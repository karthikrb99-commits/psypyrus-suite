import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('Sanity Test Suite', () => {
  it('should verify basic mathematical assertions work', () => {
    expect(1 + 1).toBe(2);
  });

  it('should verify JSDOM and React rendering work correctly', () => {
    render(<div data-testid="sanity-test-element">Hello, PsyPyrus Testing Environment!</div>);
    const element = screen.getByTestId('sanity-test-element');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Hello, PsyPyrus Testing Environment!');
  });

  it('should verify global electronAPI mock is active', () => {
    expect(window.electronAPI).toBeDefined();
    expect(window.electronAPI.writeAuditLog).toBeTypeOf('function');
  });

  it('should verify global Canvas mock is active', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    expect(ctx).toBeDefined();
    expect(ctx.beginPath).toBeTypeOf('function');
  });
});
