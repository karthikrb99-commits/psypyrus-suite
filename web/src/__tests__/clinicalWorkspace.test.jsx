import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ClinicalWorkspace from '../components/screens/ClinicalWorkspace';

// Mock recharts to avoid rendering issues in JSDOM
vi.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }) => <div className="recharts-responsive-container">{children}</div>,
    LineChart: ({ children }) => <div className="recharts-line-chart">{children}</div>,
    Line: () => <div className="recharts-line" />,
    XAxis: () => <div className="recharts-xaxis" />,
    YAxis: () => <div className="recharts-yaxis" />,
    CartesianGrid: () => <div className="recharts-grid" />,
    Tooltip: () => <div className="recharts-tooltip" />,
    Legend: () => <div className="recharts-legend" />,
  };
});

// Mock jspdf
vi.mock('jspdf', () => {
  return {
    jsPDF: vi.fn().mockImplementation(() => {
      return {
        setFont: vi.fn(),
        setFontSize: vi.fn(),
        setTextColor: vi.fn(),
        text: vi.fn(),
        setLineWidth: vi.fn(),
        setDrawColor: vi.fn(),
        line: vi.fn(),
        save: vi.fn(),
      };
    })
  };
});

describe('ClinicalWorkspace Component Tests', () => {
  it('renders correctly and can toggle tabs', () => {
    render(<ClinicalWorkspace activePatientId={7} />);

    // Verify tabs
    const ehrTabBtn = document.getElementById('nav-ehr-btn');
    const diagnosticsTabBtn = document.getElementById('nav-diagnostics-btn');

    expect(ehrTabBtn).toBeInTheDocument();
    expect(diagnosticsTabBtn).toBeInTheDocument();

    // Click diagnostics tab
    fireEvent.click(diagnosticsTabBtn);

    // Verify it changed
    expect(diagnosticsTabBtn).toHaveClass('bg-sky-50');
  });

  it('correctly locks and unlocks CDSS and Copilot controls based on roles', async () => {
    render(<ClinicalWorkspace activePatientId={7} />);

    // Default role is Psychiatrist. CDSS button should be visible in diagnostics tab.
    const diagnosticsTabBtn = document.getElementById('nav-diagnostics-btn');
    fireEvent.click(diagnosticsTabBtn);
    
    // Check CDSS run button is visible
    expect(await screen.findByText('Generate CDSS Hypothesis')).toBeInTheDocument();
    expect(screen.queryByText('Logged in : Diagnosis lock active')).not.toBeInTheDocument();

    // Copilot input should be visible
    expect(screen.getByPlaceholderText(/Ask copilot/i)).toBeInTheDocument();
    expect(screen.queryByText('Diagnostic copilot locked for Patients')).not.toBeInTheDocument();

    // Change role to Patient
    const roleSelect = document.getElementById('role-select');
    fireEvent.change(roleSelect, { target: { value: 'Patient' } });

    // Verify CDSS is locked
    expect(await screen.findByText('Logged in : Diagnosis lock active')).toBeInTheDocument();
    expect(screen.queryByText('Generate CDSS Hypothesis')).not.toBeInTheDocument();

    // Verify Copilot is locked
    expect(screen.getByText('Diagnostic copilot locked for Patients')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Ask copilot/i)).not.toBeInTheDocument();
  });
});
