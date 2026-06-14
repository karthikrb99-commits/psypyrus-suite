import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { ToastProvider, useToast } from '../components/ToastProvider';

// Mock GamificationService
vi.mock('../services/gamification', () => ({
  GamificationService: {
    getProfile: vi.fn(() => ({ level: 1, xp: 50, nextLevelXp: 100, coins: 10 }))
  }
}));

// Helper to consume useToast
function ToastTestComponent({ message, type, duration }) {
  const { showToast } = useToast();
  return (
    <button onClick={() => showToast(message, type, duration)}>
      Trigger Toast
    </button>
  );
}

describe('Modernized Components Tests', () => {
  it('renders Header with breadcrumbs and theme toggle', () => {
    const onThemeToggle = vi.fn();
    render(
      <Header
        activeRole="Professional"
        activeScreen="Dashboard"
        theme="dark"
        onRoleChange={() => {}}
        onThemeToggle={onThemeToggle}
        onSettingsOpen={() => {}}
        onLock={() => {}}
        onShowLanding={() => {}}
        onCommandPaletteOpen={() => {}}
      />
    );

    // Verify role and screen display
    expect(screen.getAllByText('Professional').length).toBeGreaterThan(0);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    // Verify Theme toggle button works
    const themeBtn = document.getElementById('theme-toggle-btn');
    expect(themeBtn).toBeInTheDocument();
    fireEvent.click(themeBtn);
    expect(onThemeToggle).toHaveBeenCalled();
  });

  it('renders Sidebar with role-specific items', () => {
    render(
      <Sidebar
        activeRole="Professional"
        activeScreen="Dashboard"
        activePatientName="Sophia Martinez"
        onScreenChange={() => {}}
        onRoleToggle={() => {}}
        onLock={() => {}}
        onShowLanding={() => {}}
      />
    );

    // Verify brand name and doctor role display
    expect(screen.getByText('PsyPyrus')).toBeInTheDocument();
    expect(screen.getByText('Dr. Liam Carter')).toBeInTheDocument();
    expect(screen.getByText('Sophia Martinez')).toBeInTheDocument();
  });

  it('renders ToastProvider and triggers toasts successfully', async () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <ToastTestComponent message="Test notification payload" type="success" duration={3000} />
      </ToastProvider>
    );

    // Click button to show toast inside act
    const button = screen.getByText('Trigger Toast');
    act(() => {
      fireEvent.click(button);
    });

    // Verify toast shows up
    expect(screen.getByText('Test notification payload')).toBeInTheDocument();

    // Fast-forward timers inside act
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Verify toast is gone
    expect(screen.queryByText('Test notification payload')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
