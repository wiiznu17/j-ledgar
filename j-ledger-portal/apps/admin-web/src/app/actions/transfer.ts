'use server';

import { transactionRequester } from '@/lib/requesters';
import { cookies } from 'next/headers';
import { TransferRequest } from '@repo/dto';
import { ApiError } from '@/lib/api-client';

export async function executeTransfer(formData: FormData) {
  const sourceAccountId = formData.get('sourceAccountId') as string;
  const destinationAccountId = formData.get('destinationAccountId') as string;
  const amount = formData.get('amount') as string;
  const currency = (formData.get('currency') as string) || 'THB';

  const idempotencyKey = crypto.randomUUID();

  if (!sourceAccountId || !destinationAccountId || !amount) {
    return { success: false, error: 'Missing required fields' };
  }

  try {
    const transferData: TransferRequest = {
      fromAccountId: sourceAccountId,
      toAccountId: destinationAccountId,
      amount: amount,
      currency: currency,
    };

    // transactionRequester uses the standard /api/admin/transactions/transfer endpoint
    // apiClient automatically injects auth from cookies in server-side context
    const data = await transactionRequester.transfer(transferData, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });

    return { success: true, data };
  } catch (err) {
    console.error('Transfer Error:', err);

    if (err instanceof ApiError) {
      return {
        success: false,
        error: err.message,
        code: err.code ? String(err.code) : undefined,
        details: err.details,
      };
    }

    const message =
      err instanceof Error
        ? err.message
        : 'Transaction failed. Please check your balance and try again.';
    return {
      success: false,
      error: message,
    };
  }
}
