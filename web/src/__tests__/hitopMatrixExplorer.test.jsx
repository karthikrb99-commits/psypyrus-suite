import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { HitopMatrixExplorer } from '../components/screens/HitopMatrixExplorer';
import { Database } from '../services/db';

// Mock ToastProvider
vi.mock('../components/ToastProvider', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  })
}));

const mockPatients = [
  {
    id: 1,
    name: "Liam Carter",
    specialty: "General Psychiatry",
    riskStatus: "Moderate",
    hitopSpectrum: {
      internalizing: 78,
      thoughtDisorder: 15,
      disinhibitedExternalizing: 45,
      antagonisticExternalizing: 10
    },
    rdocDomains: {
      negativeValence: "Moderate threat hyper-reactivity.",
      positiveValence: "Mild anhedonia/reward dampening.",
      cognitiveSystems: "Executive control maintained.",
      socialProcesses: "Secured social affiliation.",
      arousalRegulatory: "Normal sleep gating."
    }
  },
  {
    id: 2,
    name: "Emma Stone",
    specialty: "Psychotherapy",
    riskStatus: "Low",
    hitopSpectrum: {
      internalizing: 30,
      thoughtDisorder: 5,
      disinhibitedExternalizing: 20,
      antagonisticExternalizing: 5
    },
    rdocDomains: {
      negativeValence: "Low threat reaction.",
      positiveValence: "High reward activation.",
      cognitiveSystems: "Excellent cognitive flexibility.",
      socialProcesses: "Strong affiliation.",
      arousalRegulatory: "Excellent circadian cycles."
    }
  }
];

describe('HitopMatrixExplorer Component Tests', () => {
  beforeEach(() => {
    Database.clearDatabase();
    localStorage.clear();
    Database.init();
  });

  it('renders HiTOP explorer screen correctly', () => {
    const handleSetPatient = vi.fn();
    render(
      <HitopMatrixExplorer 
        patients={mockPatients}
        activePatientId={1}
        onSetActivePatientId={handleSetPatient}
      />
    );

    // Verify header title
    expect(screen.getByText('HiTOP Clinical Taxonomy Matrix')).toBeInTheDocument();
    
    // Verify patient selection dropdown shows patients
    const patientDropdown = screen.getByRole('combobox');
    expect(patientDropdown).toBeInTheDocument();
    expect(patientDropdown.value).toBe("1");
  });

  it('allows changing selected tab in B-HiTOP questionnaire', () => {
    const handleSetPatient = vi.fn();
    render(
      <HitopMatrixExplorer 
        patients={mockPatients}
        activePatientId={1}
        onSetActivePatientId={handleSetPatient}
      />
    );

    // Verify we have tabs
    const detachmentTab = screen.getByRole('button', { name: /Detachment/i });
    expect(detachmentTab).toBeInTheDocument();
    
    // Click detachment tab
    fireEvent.click(detachmentTab);
    
    // Check that tab is active
    expect(detachmentTab).toHaveClass('active');
  });

  it('updates selected node details on clicking SVG nodes', () => {
    const handleSetPatient = vi.fn();
    const { container } = render(
      <HitopMatrixExplorer 
        patients={mockPatients}
        activePatientId={1}
        onSetActivePatientId={handleSetPatient}
      />
    );

    // Find the Internalizing text/node inside the SVG
    const textElements = Array.from(container.querySelectorAll('svg text'));
    const internalizingLabel = textElements.find(el => el.textContent === 'Internalizing');
    expect(internalizingLabel).toBeDefined();

    // The group element enclosing Internalizing should be clickable
    const nodeGroup = internalizingLabel.closest('g');
    expect(nodeGroup).toBeInTheDocument();
    
    fireEvent.click(nodeGroup);

    // The details panel should now display Internalizing Spectrum description
    expect(screen.getByText('Internalizing Spectrum')).toBeInTheDocument();
    expect(screen.getByText(/Characterized by negative emotional states/i)).toBeInTheDocument();
  });
});
