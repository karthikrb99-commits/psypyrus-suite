import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { Database } from '../services/db';
import { PricingAgreements } from '../components/screens/PricingAgreements';

// Mock Toast Provider
vi.mock('../components/ToastProvider', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}));

describe('PricingAgreements Component and Sliding Scale / Pro Bono flow', () => {
  const mockPatientUser = {
    id: 'patient_2',
    name: 'Sarah Jenkins',
    role: 'patient',
    email: 'sarah.j@outlook.com'
  };

  const mockClinicianUser = {
    id: 'dr_liam',
    name: 'Dr. Liam Carter',
    role: 'professional',
    email: 'liam.carter@health.me'
  };

  beforeEach(() => {
    Database.clearDatabase();
    localStorage.clear();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('renders settings config form in Professional mode and saves settings', () => {
    render(<PricingAgreements activeRole="Professional" currentUser={mockClinicianUser} />);

    expect(screen.getByRole('heading', { name: /Accessibility Policies/i })).toBeInTheDocument();

    const minRateInput = screen.getByLabelText(/Minimum Sliding Rate/i);
    const maxRateInput = screen.getByLabelText(/Maximum Sliding Rate/i);
    const proBonoInput = screen.getByLabelText(/Total Pro Bono Slots/i);
    const saveBtn = screen.getByRole('button', { name: /Update Accessibility Policies/i });

    fireEvent.change(minRateInput, { target: { value: '45' } });
    fireEvent.change(maxRateInput, { target: { value: '135' } });
    fireEvent.change(proBonoInput, { target: { value: '6' } });

    fireEvent.click(saveBtn);

    expect(localStorage.getItem('psypyrus_min_rate')).toBe('45');
    expect(localStorage.getItem('psypyrus_max_rate')).toBe('135');
    expect(localStorage.getItem('psypyrus_pro_bono_slots')).toBe('6');
  });

  it('renders request form in Patient mode and allows submitting a pricing proposal', () => {
    render(<PricingAgreements activeRole="Patient" currentUser={mockPatientUser} />);

    expect(screen.getByText(/Request Special Pricing/i)).toBeInTheDocument();

    const clinicianSelect = screen.getByLabelText(/Select Clinician/i);
    const tierSelect = screen.getByLabelText(/Select Target Tier/i);
    const feeInput = screen.getByLabelText(/Proposed Session Fee/i);
    const incomeInput = screen.getByLabelText(/Your Annual Income/i);
    const justificationInput = screen.getByLabelText(/Justification /i);
    const submitBtn = screen.getByRole('button', { name: /Submit Pricing Proposal/i });

    fireEvent.change(clinicianSelect, { target: { value: 'dr_katherine' } });
    fireEvent.change(tierSelect, { target: { value: 'Student Sliding Scale' } });
    fireEvent.change(feeInput, { target: { value: '55' } });
    fireEvent.change(incomeInput, { target: { value: '25000' } });
    fireEvent.change(justificationInput, { target: { value: 'I am a graduate student living on a stipend.' } });

    fireEvent.click(submitBtn);

    const agreements = Database.getPricingAgreements();
    const latest = agreements.find(a => a.proposedFee === 55);
    expect(latest).toBeDefined();
    expect(latest.patientName).toBe('Sarah Jenkins');
    expect(latest.professionalName).toBe('Dr. Katherine Brewster');
    expect(latest.incomeDeclared).toBe(25000);
    expect(latest.message).toBe('I am a graduate student living on a stipend.');
  });

  it('allows clinician to approve, reject, or counter-propose a request', () => {
    // Insert a pending pricing agreement in DB
    const agreeId = Database.createPricingAgreement({
      patientId: 2,
      patientName: 'Sarah Jenkins',
      professionalId: 'dr_liam',
      professionalName: 'Dr. Liam Carter',
      proposedFee: 40,
      tier: 'Low Income Sliding Scale',
      incomeDeclared: 15000,
      message: 'Unemployed'
    });

    render(<PricingAgreements activeRole="Professional" currentUser={mockClinicianUser} />);

    // Verify agreement is listed under clinician inbox
    expect(screen.getByText(/Sarah Jenkins/i)).toBeInTheDocument();
    expect(screen.getByText(/\$40\/session/i)).toBeInTheDocument();

    // Click Counter Offer
    const counterBtn = screen.getByRole('button', { name: /Counter/i });
    fireEvent.click(counterBtn);

    // Enter counter rate
    const counterFeeInput = screen.getByLabelText(/Counter Fee/i);
    const sendCounterBtn = screen.getByRole('button', { name: /Submit Counter/i });

    fireEvent.change(counterFeeInput, { target: { value: '50' } });
    fireEvent.click(sendCounterBtn);

    // Verify DB updated to Countered with fee 50
    let ags = Database.getPricingAgreements();
    let updated = ags.find(a => a.id === agreeId);
    expect(updated.status).toBe('Countered');
    expect(updated.proposedFee).toBe(50);
  });

  it('allows patient to accept or decline a countered rate from professional', () => {
    // Insert a countered agreement in DB
    const agreeId = Database.createPricingAgreement({
      patientId: 2,
      patientName: 'Sarah Jenkins',
      professionalId: 'dr_liam',
      professionalName: 'Dr. Liam Carter',
      proposedFee: 50,
      tier: 'Low Income Sliding Scale',
      message: 'Clinician countered offer.'
    });
    Database.updatePricingAgreement(agreeId, 'Countered', 50, 'Clinician countered offer.');

    render(<PricingAgreements activeRole="Patient" currentUser={mockPatientUser} />);

    // Verify countered agreement is in patient view
    expect(screen.getAllByText(/Dr. Liam Carter/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Counter Offered/i)).toBeInTheDocument();

    // Click Accept Counter
    const acceptBtn = screen.getByRole('button', { name: /Accept Counter/i });
    fireEvent.click(acceptBtn);

    // Verify status is Approved
    let ags = Database.getPricingAgreements();
    let updated = ags.find(a => a.id === agreeId);
    expect(updated.status).toBe('Approved');
  });
});
