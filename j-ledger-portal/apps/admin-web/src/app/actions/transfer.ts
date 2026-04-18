'use server';

import { transactionRequester } from '@/lib/requesters';
import { cookies } from 'next/headers';

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
    // transactionRequester uses the standard /api/admin/transactions/transfer endpoint
    // apiClient automatically injects auth from cookies in server-side context
    const data = await transactionRequester.transfer({
      fromAccountId: sourceAccountId,
      toAccountId: destinationAccountId,
      amount: amount,
      currency: currency,
    }, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      }
    });

    return { success: true, data };
  } catch (err: any) {
    console.error('Transfer Error:', err);
    return { 
      success: false, 
      error: err.message || 'Transaction failed. Please check your balance and try again.' 
    };
  }
}
