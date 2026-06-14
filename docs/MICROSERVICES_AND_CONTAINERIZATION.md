# Architectural Guide: Containerization, Microservices & Real-Time Orchestration

This document details the practical implementation, design choices, and deployment instructions for containerization, microservice communication, distributed tracing, structured logging, and WebSocket connection management in the **PsyPyrus Suite**.

---

## 1. Monolith vs Microservices

### Monolithic Architecture
In the monolithic configuration, all clinical functions (Electronic Health Records, Diagnostic DSM engines, SOAP Copilots, Video Call interfaces, and Analytics) run as a single deployment unit.
*   **Pros**: Simple deployment, single codebase, low network overhead.
*   **Cons**: Single point of failure, scalability bottlenecks (e.g. video scaling requires scaling the full diagnostic engine), and language constraints.

### Microservices Architecture
The modernization plan splits the monolith into specialized containerized services:
1.  **Auth/Identity Service (OIDC/Keycloak)**: Handles JWT generation and user authentication.
2.  **Patient EHR Service**: Manages patient rosters, history records, and diagnostics check states.
3.  **AI Copilot Service**: Calls Large Language Models (e.g. Gemini 3.5 Flash) to generate SOAP notes and MSE narratives.
4.  **Telehealth Socket Gateway**: Manages WebRTC handshakes and WebSocket sessions.
5.  **Analytics Service**: Computes metrics and logs for practice billing and utilization.

---

## 2. Containerization (Docker)

Each microservice is built into a standard, isolated container image. The container encapsulates Node.js runtimes, Nginx assets, system dependencies, and environment variables.

### Build and Run Instructions

To build the React application container stage:
```bash
docker build -t psypyrus/web-app:latest ./web
```

To execute the container mapping local ports:
```bash
docker run -d -p 8080:80 --name psypyrus-web-container psypyrus/web-app:latest
```

To spin up the entire cluster including Prometheus and Grafana for monitoring:
```bash
docker-compose up -d
```

---

## 3. Inter-Service Communication

Services communicate using two primary protocols based on transaction requirements:

### REST (Representational State Transfer)
*   **Protocol**: JSON payload over HTTP/1.1.
*   **Usage**: External client-to-gateway requests, public REST webhooks (e.g. Cal.com appointment sync).
*   **Characteristics**: Text-based, human-readable, higher payload size, and connection overhead.

### gRPC (Google Remote Procedure Call)
*   **Protocol**: Protobuf binary serialization over HTTP/2.
*   **Usage**: East-West communication (internal microservice-to-microservice traffic).
*   **Characteristics**: Binary payload (low network overhead), multiplexed connections, bi-directional streaming, and client/server code generation from `.proto` schemas.

---

## 4. Service Discovery & API Gateways

In a dynamic microservices cluster, containers spin up and down with dynamic IP allocations.
*   **Service Discovery (Consul / Eureka)**: A central registry where microservice instances register their current host IP and port.
*   **API Gateway (Nginx / Spring Cloud Gateway)**: Serves as a single entry point for all clients. The gateway intercepts requests, consults the Service Registry, load-balances requests across available instances, and routes traffic.

---

## 5. Monitoring & Observability

### Centralized & Structured Logging
Standard logging (`console.log`) lacks tags and structure, making it difficult to search millions of records across services.
**Structured logs** output as JSON:
```json
{
  "timestamp": "2026-06-12T18:40:00Z",
  "level": "INFO",
  "service": "ehr-service",
  "event": "PATIENT_RECORD_VIEWED",
  "message": "Dr. Carter viewed patient record Liam Carter",
  "metadata": {
    "patientId": 1,
    "actorId": "dr_carter",
    "ip": "192.168.1.104"
  }
}
```
This is easily parsed by central aggregation indexers (e.g. Elasticsearch, Loki).

### Distributed Tracing
Distributed tracing tracks requests as they flow across multiple services. Every request starts a root span with a unique `traceId`. Sub-spans carry the same `traceId` and reference their `parentSpanId`.
We can reconstruct a visual waterfall chart of any API transaction to identify latencies.

### Metrics & Alerts
*   **Prometheus**: Scrapes metrics from `/metrics` endpoints across services.
*   **Grafana**: Connects to Prometheus to display CPU, Memory, Request Rate (RPS), and Error Rate charts.
*   **Alerting**: Alerts are triggered when metric limits are crossed (e.g. Alert if latency > 1000ms). Notifications are pushed to Slack or PagerDuty.

---

## 6. Real-Time Communication

### HTTP vs WebSockets vs SSE
1.  **Short Polling**: Client sends HTTP requests repeatedly (e.g., every 2s). High overhead.
2.  **Long Polling**: Server holds the HTTP request open until data is ready, then client re-requests. High resource lock.
3.  **Server-Sent Events (SSE)**: Single-directional HTTP stream from Server to Client. Perfect for notifications and dashboards.
4.  **WebSockets**: Bi-directional, full-duplex persistent connection over a single TCP socket. Perfect for chat chambers and live collaboration.

### Reconnection Backoff
If a WebSocket connection fails, dropping reconnect requests in a tight loop will flood the server. We implement **exponential backoff with jitter**:
$$\text{Delay} = \text{base\_delay} \times 2^{\text{attempt}} + \text{jitter}$$
This distributes connection attempts evenly over time, preventing a "thundering herd" problem.
