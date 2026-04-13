import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/layout/Sidebar';
import React from 'react';
import '@testing-library/jest-dom';

// Mock lucide icons to avoid SVGR issues in Jest
jest.mock('lucide-react', () => ({
  Activity: () => <div data-testid="icon-activity" />,
  CreditCard: () => <div data-testid="icon-creditcard" />,
  LayoutDashboard: () => <div data-testid="icon-dashboard" />,
  LogOut: () => <div data-testid="icon-logout" />,
  Send: () => <div data-testid="icon-send" />,
  ShieldCheck: () => <div data-testid="icon-shield" />,
  Users: () => <div data-testid="icon-users" />,
}));

describe('Sidebar RBAC Visibility', () => {
  const mockOnLogout = jest.fn();

  it('renders standard links for SUPPORT_STAFF but hides restricted ones', () => {
    render(
      <Sidebar 
        onLogout={mockOnLogout} 
        userRole="SUPPORT_STAFF" 
      />
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByText('System Outbox')).toBeInTheDocument();
    
    // Restricted links
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('renders ALL links for SUPER_ADMIN', () => {
    render(
      <Sidebar 
        onLogout={mockOnLogout} 
        userRole="SUPER_ADMIN" 
      />
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('hides Accounts and Users for RECONCILER', () => {
    render(
      <Sidebar 
        onLogout={mockOnLogout} 
        userRole="RECONCILER" 
      />
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Reconcile')).toBeInTheDocument();
    
    expect(screen.queryByText('Accounts')).not.toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });
});
