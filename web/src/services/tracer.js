/**
 * PsyPyrus Distributed Tracing Service
 * Records spans, parent-child trace relationships, and transaction timing.
 */

class TracerService {
    constructor() {
        this.activeSpans = new Map();
        this.completedTraces = [];
        this.maxTraces = 30;
    }

    generateId(length = 16) {
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }

    startSpan(name, parentSpan = null, tags = {}) {
        const spanId = this.generateId(16);
        const traceId = parentSpan ? parentSpan.traceId : this.generateId(32);
        const parentSpanId = parentSpan ? parentSpan.spanId : null;

        const span = {
            traceId,
            spanId,
            parentSpanId,
            name,
            startTime: Date.now(),
            durationMs: 0,
            tags: { ...tags },
            isCompleted: false
        };

        this.activeSpans.set(spanId, span);
        return span;
    }

    endSpan(spanId, error = false, errorMsg = '') {
        const span = this.activeSpans.get(spanId);
        if (!span) return null;

        span.durationMs = Date.now() - span.startTime;
        span.isCompleted = true;
        if (error) {
            span.tags.error = true;
            span.tags.errorMessage = errorMsg;
        } else {
            span.tags.error = false;
        }

        this.activeSpans.delete(spanId);

        // Add to completed traces list
        if (!span.parentSpanId) {
            // Root span completed: save trace
            const traceObj = {
                traceId: span.traceId,
                name: span.name,
                startTime: span.startTime,
                durationMs: span.durationMs,
                rootSpan: span,
                spans: [span]
            };
            this.completedTraces.push(traceObj);
            if (this.completedTraces.length > this.maxTraces) {
                this.completedTraces.shift();
            }
            window.dispatchEvent(new CustomEvent('psypyrus_trace', { detail: traceObj }));
        } else {
            // Find parent trace and append span
            const parentTrace = this.completedTraces.find(t => t.traceId === span.traceId);
            if (parentTrace) {
                parentTrace.spans.push(span);
                parentTrace.durationMs = Math.max(parentTrace.durationMs, Date.now() - parentTrace.startTime);
                window.dispatchEvent(new CustomEvent('psypyrus_trace_update', { detail: parentTrace }));
            }
        }

        return span;
    }

    getCompletedTraces() {
        return [...this.completedTraces];
    }

    clearTraces() {
        this.completedTraces = [];
        window.dispatchEvent(new CustomEvent('psypyrus_trace_clear'));
    }
}

export const Tracer = new TracerService();
