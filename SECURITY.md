# Security Policy

## Vulnerability Disclosure & Safety

Security is of paramount importance to the **Papyrus Ecosystem** (and the **PsyPyrus Suite**) because it serves as an open-source mental health operating system facilitating the processing of Protected Health Information (PHI). Under our core principle of **Privacy by Design**, security and confidentiality are foundational requirements.

If you discover a security vulnerability, please do NOT report it publicly via a GitHub issue. Instead, follow the process outlined below.

---

## Supported Versions

Only the latest release version of the Papyrus Ecosystem client packages is supported for security updates.

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |
| < 1.0   | No        |

---

## Reporting a Vulnerability

If you believe you have found a security vulnerability or clinical safety issue (e.g. diagnostic rule engine failure exposing dangerous risk factors), please send an email to **security@psypyrus.org**.

Please include the following details in your report:
- A description of the vulnerability and its potential impact.
- Detailed steps to reproduce the vulnerability (including proof-of-concept scripts or screenshots if applicable).
- The platform package (Web, Android, iOS, macOS, Desktop) and version affected.

We will acknowledge receipt of your report within **24 hours** and provide a detailed response along with an estimated timeline for remediation within **3-5 business days**.

---

## Clinical Safety Disclaimer

Papyrus applications operate as a **Clinical Decision Support System (CDSS)**. Any security vulnerabilities that compromise data integrity, client-side encryption (such as SQLite/CoreData/IndexedDB envelope encryption), or diagnostic engine operations will be treated with the highest severity.

Developers are prohibited from checking in:
- Plaintext secrets, keys, or credentials.
- Unencrypted storage methods for PHI.
- Unvalidated clinical diagnostics schemas.
