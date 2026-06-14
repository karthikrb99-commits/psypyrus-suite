import { describe, it, expect, beforeEach } from 'vitest';
import { MedicationService, CLINICAL_DRUGS_DB } from '../services/medicationService';
import { Database } from '../services/db';

describe('MedicationService Logic Tests', () => {
  beforeEach(() => {
    // Clean local storage before test
    localStorage.clear();
    Database.init();
  });

  it('should recommend correct drugs based on case-insensitive diagnoses substring match', () => {
    const recommendations = MedicationService.getRecommendationsForDisorders([
      "Major Depressive Disorder (MDD), Single Episode",
      "Generalized Anxiety Disorder (GAD)"
    ]);
    
    // MDD matches 'depressive' category; GAD matches 'anxiety' category
    expect(recommendations.length).toBeGreaterThan(0);
    const names = recommendations.map(r => r.name);
    
    expect(names).toContain('Sertraline');
    expect(names).toContain('Escitalopram');
    expect(names).toContain('Buspirone');
  });

  it('should run safety audit and flag pediatric warning for pediatric cohort (< 18)', () => {
    const selectedDrugs = CLINICAL_DRUGS_DB.depressive; // Sertraline & Escitalopram
    const audit = MedicationService.runSafetyAudit(10, 'Male', selectedDrugs);
    
    expect(audit.cohort).toBe('Pediatric');
    expect(audit.overallRisk).toBe('Critical'); // Boxed warnings for suicide are Critical
    expect(audit.alerts.length).toBeGreaterThan(0);
    
    const alertTypes = audit.alerts.map(a => a.type);
    expect(alertTypes).toContain('Pediatric Risk');
  });

  it('should run safety audit and flag geriatric warning for geriatric cohort (> 65)', () => {
    const selectedDrugs = CLINICAL_DRUGS_DB.depressive; // Sertraline & Escitalopram
    const audit = MedicationService.runSafetyAudit(72, 'Female', selectedDrugs);
    
    expect(audit.cohort).toBe('Geriatric');
    expect(audit.overallRisk).toBe('Warning'); // SIADH warnings are Warnings
    expect(audit.alerts.length).toBeGreaterThan(0);
    
    const alertTypes = audit.alerts.map(a => a.type);
    expect(alertTypes).toContain('Geriatric Risk');
  });

  it('should run safety audit and flag pregnancy warning for female patients', () => {
    const selectedDrugs = CLINICAL_DRUGS_DB.depressive;
    const audit = MedicationService.runSafetyAudit(25, 'Female', selectedDrugs);
    
    expect(audit.cohort).toBe('Adult');
    expect(audit.alerts.length).toBeGreaterThan(0);
    const alertTypes = audit.alerts.map(a => a.type);
    expect(alertTypes).toContain('Pregnancy/Childbearing Warning');
  });

  it('should successfully simulate ABDM Sync and record audit logs', async () => {
    const selectedDrugs = [CLINICAL_DRUGS_DB.depressive[0]]; // Sertraline
    const receipt = await MedicationService.syncPrescriptionToAbdm({
      patientId: 1,
      patientName: "Liam Carter",
      abhaNumber: "91-2345-6789-0123",
      medications: selectedDrugs,
      clinicalJustification: "Clinical justification note"
    });

    expect(receipt.transactionId).toBeDefined();
    expect(receipt.transactionId.startsWith('TXN-')).toBe(true);
    expect(receipt.registryStatus).toBe('LINKED_AND_DISPATCHED');
    expect(receipt.recordsDispatchedCount).toBe(1);

    // Verify audit log has been written
    const logs = Database.getAuditLogs();
    const abdmLogs = logs.filter(l => l.action === 'ABDM Health Document Dispatch');
    expect(abdmLogs.length).toBe(1);
    expect(abdmLogs[0].details).toContain('Liam Carter');
  });
});
