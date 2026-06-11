# Document 05 — Backend Schema (Data Model & Security Architecture)

This document establishes the synchronized relational database schemas, table models, data types, indexes, and Cloud Sync Gateway specifications for the **PsyPyrus Suite**.

---

## 1. Database Table Configurations (Parity Schema)

All local client databases (Room DB on Android, IndexedDB/Dexie on Web/Electron, SQLite on iOS) implement the same tables, fields, and indices.

```
                  +--------------------------------+
                  |            patients            |
                  +---------------+----------------+
                                  |
            +---------------------+---------------------+
            | 1-to-1                                    | 1-to-Many
            v                                           v
  +---------+--------+                        +---------+--------+
  |  case_histories  |                        |    encounters    |
  |  (with genogram) |                        | (SOAP, MSE notes)|
  +------------------+                        +------------------+
```

### 1.1 Table: `patients`
Stores client clinical chart data.
*   `id` (Integer / Primary Key): Unique patient identifier.
*   `name` (Text)
*   `age` (Integer)
*   `gender` (Text)
*   `email` (Text)
*   `phone` (Text)
*   `riskStatus` (Text): e.g. `"None"`, `"Low"`, `"Moderate"`, `"Severe"`.
*   `specialty` (Text): e.g. `"Depression"`, `"Anxiety"`, `"ADHD"`.
*   `registrationDate` (Integer / Timestamp)

### 1.2 Table: `appointments`
Session scheduling details.
*   `id` (Integer / Primary Key)
*   `patientId` (Integer / Foreign Key → `patients.id`)
*   `patientName` (Text)
*   `dateTime` (Text): e.g., `"Today, 10:00 AM"`.
*   `status` (Text): e.g., `"Scheduled"`, `"Completed"`, `"Cancelled"`.
*   `notes` (Text)
*   `fee` (Real / Double)
*   `isVideo` (Integer / Boolean)
*   `code` (Text): Telehealth room code (e.g. `"PSY-PYR-992"`).

### 1.3 Table: `clinical_notes`
EHR text and AI compiled modules.
*   `id` (Integer / Primary Key)
*   `patientId` (Integer / Foreign Key → `patients.id`)
*   `title` (Text)
*   `noteType` (Text): `"SOAP"`, `"MSE"`, `"PLAN"`, `"GENERAL"`.
*   `bodyJson` (Text): JSON payload holding structured notes details.
*   `timestamp` (Integer / Timestamp)
*   `isRiskAlert` (Integer / Boolean)
*   `riskDisclaimer` (Text)

### 1.4 Table: `assessments`
Clinical measurement scores.
*   `id` (Integer / Primary Key)
*   `patientId` (Integer / Foreign Key → `patients.id`)
*   `type` (Text): `"PHQ-9"`, `"GAD-7"`, `"DASS-21"`, `"HiTOP-DSM-5"`.
*   `score` (Integer)
*   `details` (Text): e.g. `"Severe Depression"`.
*   `date` (Integer / Timestamp)

### 1.5 Table: `mood_logs`
Wellness tracker logs.
*   `id` (Integer / Primary Key)
*   `patientId` (Integer / Foreign Key → `patients.id`)
*   `moodScore` (Integer): `1` to `10`.
*   `moodNote` (Text)
*   `gratitude` (Text)
*   `breathingSeconds` (Integer)
*   `date` (Integer / Timestamp)

### 1.6 Table: `security_audit_logs`
HIPAA logging logs.
*   `id` (Integer / Primary Key)
*   `action` (Text): e.g. `"Generated SOAP Note via AI"`, `"Biometric Lock Triggered"`.
*   `details` (Text): Activity descriptions.
*   `timestamp` (Integer / Timestamp)
*   `actor` (Text)
*   `ipAddress` (Text)
*   `encryptionStandard` (Text): Default: `"AES-GCM-256"`.

### 1.7 Table: `homework_tasks`
Clinical homework quests.
*   `id` (Integer / Primary Key)
*   `patientId` (Integer / Foreign Key → `patients.id`)
*   `patientName` (Text)
*   `title` (Text)
*   `description` (Text)
*   `dueDate` (Text)
*   `status` (Text): `"Assigned"`, `"In Progress"`, `"Completed"`.

### 1.8 Table: `gamification_profiles`
Unified experience tracking schema.
*   `userId` (Integer / Primary Key)
*   `userRole` (Text): `"Professional"` or `"Patient"`.
*   `xp` (Integer)
*   `level` (Integer)
*   `mindCoins` (Integer)
*   `unlockedSkinsJson` (Text): JSON list of purchased skins (e.g. `["CRT_Theme"]`).

---

## 2. Cloud Database Synchronization Specifications

To support multi-device practices, local database adapters replicate transactions to the Cloud Sync Gateway API.

### 2.1 Sync Delta Payload Schema
During sync, the client packages all local changes since the last sync timestamp:
```json
{
  "sync_timestamp": 1794567210,
  "client_device": "Android_Pixel_8",
  "deltas": {
    "patients": [
      { "id": 104, "name": "Liam Carter", "riskStatus": "Severe", "last_modified": 1794567205 }
    ],
    "mood_logs": [
      { "id": 89, "patientId": 1, "moodScore": 8, "breathingSeconds": 300, "last_modified": 1794567200 }
    ]
  }
}
```

### 2.2 Conflict Resolution
The Cloud Gateway applies a **Last-Write-Wins (LWW)** protocol using client/server timestamps.
If a record mismatch occurs:
1. The cloud server compares `last_modified` timestamps.
2. The latest modification is kept.
3. Colliding overrides are logged inside the clinician's activity logs for transparency.

---

## 3. Row-Level Security (RLS) & Encryption

1. **Local Encryption**: Mobile SQLite is encrypted using SQLCipher. Web companion utilizes Dexie encryption layers.
2. **Access Control (RLS)**:
   *   Clinicians have Read/Write permissions on all clinical tables (`patients`, `clinical_notes`, `case_histories`).
   *   Patients have Read-Only permissions on their own `patients` profile, and Read/Write access on their `mood_logs`, `wellness_lounge`, and `gamification_profiles`. They cannot access other patient directories.
