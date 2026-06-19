import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { Database } from '../services/db';
import { TherapeuticContracts } from '../components/screens/TherapeuticContracts';

// Mock Toast Provider
vi.mock('../components/ToastProvider', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}));

describe('Therapeutic Contracts Component and Negotiation Flow', () => {
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

  const mockPatients = [
    { id: 1, name: "Liam Carter", age: 29, gender: "Male", email: "liam.carter@health.me" },
    { id: 2, name: "Sarah Jenkins", age: 34, gender: "Female", email: "sarah.j@outlook.com" }
  ];

  beforeEach(() => {
    Database.clearDatabase();
    localStorage.clear();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    
    // Seed database manually if needed
    Database.init();
  });

  it('renders screens correctly and displays existing contracts', () => {
    render(
      <TherapeuticContracts 
        activeRole="Professional" 
        currentUser={mockClinicianUser} 
        patients={mockPatients}
        activePatientId={1}
      />
    );

    expect(screen.getByRole('heading', { name: /Negotiable Therapeutic Contracts/i })).toBeInTheDocument();
    expect(screen.getByText(/Therapeutic Alliance & Boundary Agreement/i)).toBeInTheDocument();
    expect(screen.getByText(/1. Clinical Goals & Focus Areas/i)).toBeInTheDocument();
  });

  it('allows clinician to add a comment during negotiation', () => {
    render(
      <TherapeuticContracts 
        activeRole="Professional" 
        currentUser={mockClinicianUser} 
        patients={mockPatients}
        activePatientId={2}
      />
    );

    const commentInput = screen.getByPlaceholderText(/Ask questions or add remarks.../i);
    const commentBtn = screen.getByRole('button', { name: /Comment/i });

    fireEvent.change(commentInput, { target: { value: 'Clarifying the cancellation duration.' } });
    fireEvent.click(commentBtn);

    const contracts = Database.getTherapeuticContracts();
    const target = contracts.find(c => c.patientId === 2);
    expect(target.negotiationHistory.some(h => h.message === 'Clarifying the cancellation duration.')).toBe(true);
  });

  it('allows counter-proposing contract terms', () => {
    render(
      <TherapeuticContracts 
        activeRole="Patient" 
        currentUser={mockPatientUser} 
        patients={mockPatients}
        activePatientId={2}
      />
    );

    // Click Propose Counters button to open counter form
    const counterBtn = screen.getByRole('button', { name: /Propose Counters/i });
    fireEvent.click(counterBtn);

    // Verify counter form inputs are visible
    expect(screen.getByText(/Propose Counter-Terms/i)).toBeInTheDocument();

    const frequencySelect = screen.getByLabelText(/Frequency/i);
    const durationSelect = screen.getByLabelText(/Session Duration/i);
    const cancellationInput = screen.getByLabelText(/Cancellation Policy/i);
    const submitBtn = screen.getByRole('button', { name: /Propose Counter/i });

    fireEvent.change(frequencySelect, { target: { value: 'Weekly' } });
    fireEvent.change(durationSelect, { target: { value: '50' } });
    fireEvent.change(cancellationInput, { target: { value: '24-Hour Notice Required' } });

    fireEvent.click(submitBtn);

    // Verify database is updated
    const contracts = Database.getTherapeuticContracts();
    const target = contracts.find(c => c.patientId === 2);
    expect(target.sessionFrequency).toBe('Weekly');
    expect(target.sessionDuration).toBe(50);
    expect(target.cancellationPolicy).toBe('24-Hour Notice Required');
    expect(target.status).toBe('Countered');
  });

  it('signs the contract and generates a seal when signed by both parties', async () => {
    // Contract 2 is unsigned by patient, but signed by clinician in seed data.
    // Let's sign it as patient.
    render(
      <TherapeuticContracts 
        activeRole="Patient" 
        currentUser={mockPatientUser} 
        patients={mockPatients}
        activePatientId={2}
      />
    );

    // Toggle typed signature
    const typeBtn = screen.getByRole('button', { name: /Type/i });
    fireEvent.click(typeBtn);

    const nameInput = screen.getByPlaceholderText(/Type full legal name.../i);
    fireEvent.change(nameInput, { target: { value: 'Sarah Jenkins' } });

    const signBtn = screen.getByRole('button', { name: /Lock Agreement & Sign/i });
    fireEvent.click(signBtn);

    await waitFor(() => {
      const contracts = Database.getTherapeuticContracts();
      const target = contracts.find(c => c.patientId === 2);
      expect(target.status).toBe('Approved');
      expect(target.patientSignature).toBe('[Typed Signature] Sarah Jenkins');
      expect(target.cryptographicSeal).not.toBe('');
    });
  });
});
