import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { Database } from '../services/db';
import { CareRequests } from '../components/screens/CareRequests';

// Mock GamificationService to avoid testing side-effects
vi.mock('../services/gamification', () => ({
  GamificationService: {
    getProfile: vi.fn(() => ({ level: 1, xp: 50, nextLevelXp: 100, coins: 10 })),
    trackAction: vi.fn(),
    awardXp: vi.fn(),
    awardCoins: vi.fn()
  }
}));

describe('CareRequests Component and Matching System', () => {
  const mockPatientUser = {
    id: 'patient_2',
    name: 'Sarah Jenkins',
    role: 'patient',
    email: 'sarah.j@outlook.com'
  };

  const mockClinicianUser = {
    id: 'dr_liam',
    name: 'Dr. Liam Carter',
    role: 'psychologist',
    email: 'liam.carter@health.me'
  };

  beforeEach(() => {
    // Reset database to initial seeds before each test
    Database.clearDatabase();
    localStorage.setItem('psypyrus_care_requests', JSON.stringify([]));
    localStorage.setItem('psypyrus_appointments', JSON.stringify([]));
    // Clear alerts
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('renders patient view and allows posting a new care request', () => {
    render(<CareRequests activeRole="Patient" currentUser={mockPatientUser} />);

    // Verify header title
    expect(screen.getByText('My Support Requests')).toBeInTheDocument();

    // Fill form
    const titleInput = screen.getByPlaceholderText('e.g. Managing career transition anxiety');
    const descInput = screen.getByPlaceholderText(/Provide details about your symptoms/);
    const submitBtn = screen.getByRole('button', { name: 'Submit to Intake Pool' });

    fireEvent.change(titleInput, { target: { value: 'Severe panic attacks' } });
    fireEvent.change(descInput, { target: { value: 'I have panic attacks during presentation meetings.' } });

    fireEvent.click(submitBtn);

    // Verify it was added to database
    const requests = Database.getCareRequests();
    const latest = requests.find(r => r.title === 'Severe panic attacks');
    expect(latest).toBeDefined();
    expect(latest.patientName).toBe('Sarah Jenkins');
    expect(latest.category).toBe('Stress & Burnout'); // default
    expect(latest.severity).toBe('Moderate'); // default
  });

  it('renders professional view and shows patient requests', () => {
    // Insert a new request in DB
    Database.insertCareRequest({
      patientId: 4,
      patientName: 'Sophia Patel',
      title: 'PTSD Flashbacks support',
      description: 'Looking for EMDR clinician.',
      category: 'Trauma/PTSD',
      severity: 'Severe'
    });

    render(<CareRequests activeRole="Professional" currentUser={mockClinicianUser} />);

    expect(screen.getByText('Patient Care & Intake Pool')).toBeInTheDocument();
    expect(screen.getByText('PTSD Flashbacks support')).toBeInTheDocument();
    expect(screen.getByText('Sophia Patel')).toBeInTheDocument();
  });

  it('allows professional to make a proposal/offer to a patient request', () => {
    const reqId = Database.insertCareRequest({
      patientId: 4,
      patientName: 'Sophia Patel',
      title: 'PTSD Flashbacks support',
      description: 'Looking for EMDR clinician.',
      category: 'Trauma/PTSD',
      severity: 'Severe'
    });

    render(<CareRequests activeRole="Professional" currentUser={mockClinicianUser} />);

    // Open proposal form
    const offerBtn = screen.getByRole('button', { name: 'Offer Clinical Services' });
    fireEvent.click(offerBtn);

    // Type proposal message
    const msgTextarea = screen.getByPlaceholderText(/Write a warm, professional introduction/);
    fireEvent.change(msgTextarea, { target: { value: 'I specialize in EMDR trauma therapy.' } });

    // Submit proposal
    const sendBtn = screen.getByRole('button', { name: 'Send Proposal' });
    fireEvent.click(sendBtn);

    // Verify database has the offer
    const requests = Database.getCareRequests();
    const updatedReq = requests.find(r => r.id === reqId);
    expect(updatedReq.offers.length).toBe(1);
    expect(updatedReq.offers[0].professionalName).toBe('Dr. Liam Carter');
    expect(updatedReq.offers[0].message).toBe('I specialize in EMDR trauma therapy.');
    expect(updatedReq.status).toBe('Offer Received');
  });

  it('allows patient to accept a clinical proposal, matching them and scheduling appointment', () => {
    // Setup request with an offer in DB
    const reqId = Database.insertCareRequest({
      patientId: 2,
      patientName: 'Sarah Jenkins',
      title: 'Burnout help',
      description: 'Looking for CBT.',
      category: 'Stress & Burnout',
      severity: 'Moderate'
    });

    Database.addOfferToCareRequest(reqId, {
      professionalId: 'dr_liam',
      professionalName: 'Dr. Liam Carter',
      message: 'I have opening slots for burnout CBT.'
    });

    render(<CareRequests activeRole="Patient" currentUser={mockPatientUser} />);

    // Verify offer is visible
    expect(screen.getByText('Dr. Liam Carter')).toBeInTheDocument();
    expect(screen.getByText('I have opening slots for burnout CBT.')).toBeInTheDocument();

    // Accept & Book
    const acceptBtn = screen.getByRole('button', { name: 'Accept & Book' });
    fireEvent.click(acceptBtn);

    // Verify request status is connected
    const requests = Database.getCareRequests();
    const updatedReq = requests.find(r => r.id === reqId);
    expect(updatedReq.status).toBe('Connected');
    expect(updatedReq.offers[0].status).toBe('Accepted');

    // Verify appointment was created
    const appts = Database.getAppointments();
    const matchedAppt = appts.find(a => a.patientName === 'Sarah Jenkins' && a.psychologistId === 'dr_liam');
    expect(matchedAppt).toBeDefined();
    expect(matchedAppt.status).toBe('Scheduled');
    expect(matchedAppt.notes).toContain('Session booked via Care Request matching: Burnout help');
  });
});
