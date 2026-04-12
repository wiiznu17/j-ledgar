import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TransferForm from '../src/components/TransferForm';
import { executeTransfer } from '../src/app/actions/transfer';
import React from 'react';

jest.mock('../src/app/actions/transfer', () => ({
  executeTransfer: jest.fn()
}));

describe('TransferForm Client Component Isolation Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders standard fields cleanly mapping to Ledger logic', () => {
    render(<TransferForm />);
    expect(screen.getByText('Create Transfer')).toBeInTheDocument();
    expect(screen.getByLabelText('Source Account ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
  });

  it('displays accurate success state resolving mock action perfectly', async () => {
    (executeTransfer as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: { id: 'tx-223344' }
    });

    render(<TransferForm />);
    
    fireEvent.change(screen.getByLabelText('Source Account ID'), { target: { value: 'user-a' } });
    fireEvent.change(screen.getByLabelText('Destination Account ID'), { target: { value: 'user-b' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '100' } });
    
    fireEvent.submit(screen.getByTestId('transfer-form'));

    expect(screen.getByText('Processing...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Transfer successful! Tx ID: tx-223344')).toBeInTheDocument();
    });
  });

  it('displays accurate error boundary text resolving failed mock seamlessly', async () => {
    (executeTransfer as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: 'Lock contention blocked explicitly'
    });

    render(<TransferForm />);

    // Must populate required fields so native form validation doesn't block submission
    fireEvent.change(screen.getByLabelText('Source Account ID'), { target: { value: 'ac-1' } });
    fireEvent.change(screen.getByLabelText('Destination Account ID'), { target: { value: 'ac-2' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '22' } });

    fireEvent.submit(screen.getByTestId('transfer-form'));

    await waitFor(() => {
      expect(screen.getByText('Lock contention blocked explicitly')).toBeInTheDocument();
    });
  });
});
