import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { Database } from '../services/db';
import { ResearchHub } from '../components/screens/ResearchHub';

// Mock Toast Provider
vi.mock('../components/ToastProvider', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}));

describe('ResearchHub Component and study collaboration', () => {
  const mockUser = {
    id: 'dr_liam',
    name: 'Dr. Liam Carter',
    role: 'professional'
  };

  beforeEach(() => {
    Database.clearDatabase();
    localStorage.setItem('psypyrus_research_invites', JSON.stringify([]));
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('renders research feed and allows professional/researcher to post a new study invite', () => {
    render(<ResearchHub activeRole="Professional" currentUser={mockUser} />);

    // Check header title
    expect(screen.getByRole('heading', { name: /Research invites & collaboration/i })).toBeInTheDocument();

    // Open creation form
    const addBtn = screen.getByRole('button', { name: /Post Study Invite/i });
    fireEvent.click(addBtn);

    // Fill the fields
    const titleInput = screen.getByLabelText(/Study Title/i);
    const instInput = screen.getByLabelText(/Institution/i);
    const descInput = screen.getByLabelText(/Detailed Description/i);
    const compInput = screen.getByLabelText(/Compensation/i);
    const submitBtn = screen.getByRole('button', { name: /Publish Study Invitation/i });

    fireEvent.change(titleInput, { target: { value: 'Sleep Cycle Analysis' } });
    fireEvent.change(instInput, { target: { value: 'MIT Brain Lab' } });
    fireEvent.change(descInput, { target: { value: 'Tracking REM sleep patterns.' } });
    fireEvent.change(compInput, { target: { value: '$150 Amazon Giftcard' } });

    fireEvent.click(submitBtn);

    // Verify it was added to database
    const invites = Database.getResearchInvites();
    const latest = invites.find(i => i.title === 'Sleep Cycle Analysis');
    expect(latest).toBeDefined();
    expect(latest.institution).toBe('MIT Brain Lab');
    expect(latest.compensation).toBe('$150 Amazon Giftcard');
  });

  it('allows users to upvote a study invite in the feed', () => {
    // Insert a dummy invite
    Database.insertResearchInvite({
      title: 'Neuroplasticity in GAD',
      institution: 'Harvard Med',
      category: 'Anxiety',
      description: 'fMRI study on anxiety and meditation.',
      principalInvestigator: 'Dr. Vance',
      compensation: 'Free therapy',
      eligibility: 'All GAD patients',
      status: 'Open Studies',
      upvotes: 5,
      comments: []
    });

    render(<ResearchHub activeRole="Patient" currentUser={mockUser} />);

    // Get upvote button
    const upvoteBtn = screen.getByRole('button', { name: /Upvote study/i });
    fireEvent.click(upvoteBtn);

    // Check state in Database
    const invites = Database.getResearchInvites();
    expect(invites[0].upvotes).toBe(1);
  });

  it('allows users to add comments to study invites', () => {
    Database.insertResearchInvite({
      title: 'Neuroplasticity in GAD',
      institution: 'Harvard Med',
      category: 'Anxiety',
      description: 'fMRI study on anxiety and meditation.',
      principalInvestigator: 'Dr. Vance',
      compensation: 'Free therapy',
      eligibility: 'All GAD patients',
      status: 'Open Studies',
      upvotes: 5,
      comments: []
    });

    render(<ResearchHub activeRole="Professional" currentUser={mockUser} />);

    // Enter comment
    const commentInput = screen.getByPlaceholderText(/Ask a question about this study/i);
    fireEvent.change(commentInput, { target: { value: 'Is this study fully remote?' } });

    // Submit comment form
    const submitBtn = screen.getByRole('button', { name: /Send/i });
    fireEvent.click(submitBtn);

    // Verify comment is in DB
    const invites = Database.getResearchInvites();
    expect(invites[0].comments.length).toBe(1);
    expect(invites[0].comments[0].comment).toBe('Is this study fully remote?');
    expect(invites[0].comments[0].userName).toBe('Dr. Liam Carter');
  });

  it('filters studies by category and search query in directory view', () => {
    Database.insertResearchInvite({
      title: 'ADHD Executive Focus',
      institution: 'Stanford',
      category: 'ADHD & Anxiety',
      description: 'ADHD focus group',
      status: 'Open Studies'
    });
    Database.insertResearchInvite({
      title: 'Depression Cognitive Study',
      institution: 'Oxford',
      category: 'Depression',
      description: 'Depression research study',
      status: 'Open Studies'
    });

    render(<ResearchHub activeRole="Professional" currentUser={mockUser} />);

    // Switch to directory tab
    const dirTabBtn = screen.getByRole('button', { name: /Directory/i });
    fireEvent.click(dirTabBtn);

    // Verify both are listed initially
    expect(screen.getByText('ADHD Executive Focus')).toBeInTheDocument();
    expect(screen.getByText('Depression Cognitive Study')).toBeInTheDocument();

    // Filter by Category
    const categorySelect = screen.getByLabelText(/Category/i);
    fireEvent.change(categorySelect, { target: { value: 'Depression' } });

    // Verify only Depression study is visible
    expect(screen.queryByText('ADHD Executive Focus')).not.toBeInTheDocument();
    expect(screen.getByText('Depression Cognitive Study')).toBeInTheDocument();
  });

  it('renders Kanban board and permits advancing study status', () => {
    const studyId = Database.insertResearchInvite({
      title: 'Inter-generational PTSD',
      institution: 'Yale',
      category: 'Trauma/PTSD',
      description: 'Yale PTSD study',
      status: 'Open Studies'
    });

    render(<ResearchHub activeRole="Professional" currentUser={mockUser} />);

    // Switch to Kanban Board tab
    const boardTabBtn = screen.getByRole('button', { name: /Kanban Board/i });
    fireEvent.click(boardTabBtn);

    // Verify study is under Open Studies column
    expect(screen.getByText('Inter-generational PTSD')).toBeInTheDocument();

    // Advance status
    const statusSelect = screen.getByRole('combobox', { name: /Status/i });
    fireEvent.change(statusSelect, { target: { value: 'In Review' } });

    // Verify DB updated
    const invites = Database.getResearchInvites();
    expect(invites[0].status).toBe('In Review');
  });
});
