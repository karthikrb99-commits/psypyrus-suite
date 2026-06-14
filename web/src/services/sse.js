/**
 * PsyPyrus Server-Sent Events (SSE) Subscriber Manager
 * Subscribes to live unidirectional notification channels for practitioner/patient alerts.
 */

import { Logger } from './logger';
import { Tracer } from './tracer';

class SSEManager {
    constructor() {
        this.status = 'DISCONNECTED';
        this.onNotificationCallbacks = new Set();
        this.mockStreamTimeout = null;
    }

    subscribe(cb) {
        this.onNotificationCallbacks.add(cb);
        
        if (this.status === 'CONNECTED') return;
        
        this.status = 'CONNECTED';
        Logger.info('sse-service', 'SSE_CONNECTED', 'Established Server-Sent Events text/event-stream connection.', { endpoint: '/api/v1/notifications/stream' });
        
        // Start simulated event publisher
        this.startMockStream();
        window.dispatchEvent(new CustomEvent('psypyrus_sse_state', { detail: { status: 'CONNECTED' } }));
    }

    unsubscribe() {
        this.status = 'DISCONNECTED';
        this.onNotificationCallbacks.clear();
        this.stopMockStream();
        Logger.info('sse-service', 'SSE_DISCONNECTED', 'Closed SSE connection stream.');
        window.dispatchEvent(new CustomEvent('psypyrus_sse_state', { detail: { status: 'DISCONNECTED' } }));
    }

    startMockStream() {
        this.stopMockStream();
        
        const scheduleNext = () => {
            const delay = Math.floor(Math.random() * 25000) + 15000; // 15-40s delay between alerts
            this.mockStreamTimeout = setTimeout(() => {
                if (this.status !== 'CONNECTED') return;
                
                this.triggerMockNotification();
                scheduleNext();
            }, delay);
        };
        
        scheduleNext();
    }

    stopMockStream() {
        if (this.mockStreamTimeout) {
            clearTimeout(this.mockStreamTimeout);
            this.mockStreamTimeout = null;
        }
    }

    triggerMockNotification(customAlert = null) {
        const defaultAlerts = [
            { type: 'APPOINTMENT', message: 'Sarah Jenkins completed the scheduled GAD-7 assessment.' },
            { type: 'SYSTEM', message: 'EHR Cloud Sync completed successfully. 4 records updated.' },
            { type: 'MARKETPLACE', message: 'Wellness Store: New ambient soundscape "Misty Mountain" is now available!' },
            { type: 'EHR_ALERT', message: 'Intake compliance check completed. No HIPAA locks active.' }
        ];
        
        const alert = customAlert || defaultAlerts[Math.floor(Math.random() * defaultAlerts.length)];
        
        const notification = {
            id: 'sse_evt_' + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            ...alert
        };

        const trace = Tracer.startSpan('sseReceiveEvent', null, { eventId: notification.id, type: notification.type });
        
        Logger.info('sse-service', 'SSE_EVENT_RECEIVED', `SSE stream packet received: [${notification.type}] ${notification.message}`, { notification });
        
        this.onNotificationCallbacks.forEach(cb => cb(notification));
        
        // Dispatch window event for live toaster/popovers
        window.dispatchEvent(new CustomEvent('psypyrus_sse_notification', { detail: notification }));
        
        setTimeout(() => {
            Tracer.endSpan(trace.spanId);
        }, 50);
    }
}

export const SSESubscriber = new SSEManager();
