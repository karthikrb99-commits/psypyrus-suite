/**
 * PsyPyrus Structured Logging Service
 * Formats logs into search-friendly JSON format and maintains a log buffer.
 */

class LoggerService {
    constructor() {
        this.logsBuffer = [];
        this.maxBufferLength = 100;
    }

    log(level, service, event, message, metadata = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            service: service || 'web-client',
            event: event || 'GENERAL',
            message: message || '',
            metadata: metadata || {}
        };

        // Output to native console
        const consoleMsg = `[${logEntry.timestamp}] [${logEntry.level}] [${logEntry.service}] [${logEntry.event}] - ${logEntry.message}`;
        if (logEntry.level === 'ERROR') {
            console.error(consoleMsg, logEntry.metadata);
        } else if (logEntry.level === 'WARN') {
            console.warn(consoleMsg, logEntry.metadata);
        } else {
            console.log(consoleMsg, logEntry.metadata);
        }

        // Add to buffer
        this.logsBuffer.push(logEntry);
        if (this.logsBuffer.length > this.maxBufferLength) {
            this.logsBuffer.shift();
        }

        // Dispatch window event for live frontend integration
        const eventDetail = { detail: logEntry };
        window.dispatchEvent(new CustomEvent('psypyrus_log', eventDetail));
    }

    info(service, event, message, metadata) {
        this.log('INFO', service, event, message, metadata);
    }

    warn(service, event, message, metadata) {
        this.log('WARN', service, event, message, metadata);
    }

    error(service, event, message, metadata) {
        this.log('ERROR', service, event, message, metadata);
    }

    debug(service, event, message, metadata) {
        this.log('DEBUG', service, event, message, metadata);
    }

    getLogs() {
        return [...this.logsBuffer];
    }

    clearLogs() {
        this.logsBuffer = [];
        window.dispatchEvent(new CustomEvent('psypyrus_log_clear'));
    }
}

export const Logger = new LoggerService();
