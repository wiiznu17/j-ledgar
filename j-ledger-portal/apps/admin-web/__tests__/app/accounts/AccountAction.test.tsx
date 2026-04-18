import { render, screen } from '@testing-library/react';
import { AccountTable } from '@/components/tables/AccountTable';
import { Account, AccountStatus } from '@repo/dto';
import React from 'react';
import '@testing-library/jest-dom';

describe('AccountTable Role-Based Actions', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-1',
      userId: 'user-1',
      accountName: 'Savings',
      balance: 1500.0,
      currency: 'THB',
      status: AccountStatus.ACTIVE,
    },
  ];

  const mockOnToggle = jest.fn();

  it('displays the Freeze button for SUPER_ADMIN', () => {
    render(
      <AccountTable data={mockAccounts} onToggleStatus={mockOnToggle} userRole="SUPER_ADMIN" />,
    );

    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Freeze')).toBeInTheDocument();
  });

  it('hides the Actions column and Freeze button for SUPPORT_STAFF', () => {
    render(
      <AccountTable data={mockAccounts} onToggleStatus={mockOnToggle} userRole="SUPPORT_STAFF" />,
    );

    expect(screen.queryByText('Actions')).not.toBeInTheDocument();
    expect(screen.queryByText('Freeze')).not.toBeInTheDocument();
  });
});
