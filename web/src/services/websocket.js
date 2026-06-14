/**
 * PsyPyrus WebSocket Connection Manager
 * Coordinates real-time bi-directional messaging with keep-alives and backoff reconnects.
 */

import { Logger } from './logger';
import { Tracer } from './tracer';

class WebSocketManager {
    constructor() {
        this.status = 'DISCONNECTED'; // CONNECTING, CONNECTED, DISCONNECTED, RECONNECTING
        this.latency = 0;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.backoffDelay = 1000; // start with 1s
        this.pingInterval = null;
        this.mockServerTimeout = null;
        this.onStateChangeCallbacks = new Set();
        this.onMessageCallbacks = new Set();
        this.forceDisconnected = false;
    }

    onStateChange(cb) {
        this.onStateChangeCallbacks.add(cb);
        return () => this.onStateChangeCallbacks.delete(cb);
    }

    onMessage(cb) {
        this.onMessageCallbacks.add(cb);
        return () => this.onMessageCallbacks.delete(cb);
    }

    _updateStatus(newStatus) {
        this.status = newStatus;
        Logger.info('websocket-service', 'WS_STATE_CHANGED', `WebSocket state updated to ${newStatus}`, { status: newStatus });
        this.onStateChangeCallbacks.forEach(cb => cb(newStatus, this.latency));
        window.dispatchEvent(new CustomEvent('psypyrus_ws_state', { detail: { status: newStatus, latency: this.latency } }));
    }

    connect() {
        if (this.status === 'CONNECTED' || this.status === 'CONNECTING') return;

        this.forceDisconnected = false;
        this._updateStatus('CONNECTING');
        
        const trace = Tracer.startSpan('wsConnectionEstablish', null, { protocol: 'ws', endpoint: 'wss://api.psypyrus.org/v1/chat' });

        // Simulate WebSocket handshake latency
        this.mockServerTimeout = setTimeout(() => {
            this.status = 'CONNECTED';
            this.reconnectAttempts = 0;
            this.backoffDelay = 1000;
            this.latency = Math.floor(Math.random() * 20) + 10; // 10ms - 30ms latency
            
            Tracer.endSpan(trace.spanId);
            this._updateStatus('CONNECTED');
            
            // Start heartbeat ping-pong
            this.startHeartbeat();
        }, 800);
    }

    disconnect() {
        this.forceDisconnected = true;
        this.stopHeartbeat();
        if (this.mockServerTimeout) clearTimeout(this.mockServerTimeout);
        this._updateStatus('DISCONNECTED');
    }

    startHeartbeat() {
        this.stopHeartbeat();
        this.pingInterval = setInterval(() => {
            if (this.status !== 'CONNECTED') return;

            const sendTime = Date.now();
            Logger.debug('websocket-service', 'WS_PING', 'Sending ping frame...');
            
            // Mock receiving PONG back
            setTimeout(() => {
                if (this.status !== 'CONNECTED') return;
                this.latency = Date.now() - sendTime;
                Logger.debug('websocket-service', 'WS_PONG', `Received pong frame. Latency: ${this.latency}ms`, { rtt: this.latency });
                this.onStateChangeCallbacks.forEach(cb => cb(this.status, this.latency));
            }, Math.floor(Math.random() * 15) + 8);

        }, 5000);
    }

    stopHeartbeat() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    simulateNetworkDrop() {
        if (this.status !== 'CONNECTED') return;
        this.stopHeartbeat();
        Logger.warn('websocket-service', 'WS_CONNECTION_DROPPED', 'WebSocket link terminated unexpectedly (connection reset by peer).');
        this._updateStatus('RECONNECTING');
        this.attemptReconnect();
    }

    attemptReconnect() {
        if (this.forceDisconnected) return;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            Logger.error('websocket-service', 'WS_RECONNECT_FAILED', `Reconnection failed after ${this.reconnectAttempts} attempts. Transitioning to DISCONNECTED.`);
            this._updateStatus('DISCONNECTED');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.backoffDelay * Math.pow(2, this.reconnectAttempts - 1) + (Math.random() * 300); // Exponential backoff + jitter
        
        Logger.info('websocket-service', 'WS_RECONNECT_ATTEMPT', `Attempting WebSocket reconnection #${this.reconnectAttempts} in ${Math.round(delay)}ms...`);
        
        this.mockServerTimeout = setTimeout(() => {
            // Simulate 60% chance of failure during reconnect if attempts < 3
            if (this.reconnectAttempts < 3 && Math.random() < 0.6) {
                Logger.warn('websocket-service', 'WS_RECONNECT_FAILED_ATTEMPT', `Reconnection attempt #${this.reconnectAttempts} timed out.`);
                this.attemptReconnect();
            } else {
                Logger.info('websocket-service', 'WS_RECONNECT_SUCCESS', `WebSocket connection re-established on attempt #${this.reconnectAttempts}.`);
                this.reconnectAttempts = 0;
                this.backoffDelay = 1000;
                this.latency = Math.floor(Math.random() * 25) + 12;
                this._updateStatus('CONNECTED');
                this.startHeartbeat();
            }
        }, delay);
    }

    sendMessage(messageText, recipientId) {
        if (this.status !== 'CONNECTED') {
            Logger.warn('websocket-service', 'WS_SEND_BLOCKED', 'Cannot send message. WebSocket is not in CONNECTED state.');
            return false;
        }

        const trace = Tracer.startSpan('wsSendMessage', null, { recipientId, sizeBytes: messageText.length });
        
        // Simulating framing & sending over socket
        Logger.info('websocket-service', 'WS_SEND_MESSAGE', `Transmitting payload frame to recipient: ${recipientId}`, { recipientId });
        
        setTimeout(() => {
            Tracer.endSpan(trace.spanId);
            
            // Trigger local mock reply sometimes
            if (Math.random() < 0.3) {
                this.receiveMockIncomingMessage(recipientId);
            }
        }, 120);

        return true;
    }

    receiveMockIncomingMessage(senderId) {
        const responses = [
            "Hi, I received your message. I am logging my daily wellness routine.",
            "Understood, Katherine. I will stick to the deep breathing exercise schedule.",
            "Can we review the PHQ-9 progress next session?",
            "Yes, my sleep patterns have improved since adjusting my boundary logs."
        ];
        const randomMsg = responses[Math.floor(Math.random() * responses.length)];
        
        const incomingMsg = {
            id: 'ws_msg_' + Date.now(),
            senderId: senderId,
            content: randomMsg,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: Date.now()
        };

        Logger.info('websocket-service', 'WS_RECV_MESSAGE', `Received incoming payload frame from ${senderId}`);
        this.onMessageCallbacks.forEach(cb => cb(incomingMsg));
        window.dispatchEvent(new CustomEvent('psypyrus_ws_message', { detail: incomingMsg }));
    }
}

export const WebSocketConn = new WebSocketManager();
export const WSState = {
    CONNECTING: 'CONNECTING',
    CONNECTED: 'CONNECTED',
    DISCONNECTED: 'DISCONNECTED',
    RECONNECTING: 'RECONNECTING'
};
