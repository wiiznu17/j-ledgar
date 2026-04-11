'use server'

export async function executeTransfer(formData: FormData) {
  const sourceAccountId = formData.get('sourceAccountId') as string;
  const destinationAccountId = formData.get('destinationAccountId') as string;
  const amount = formData.get('amount') as string;
  const currency = formData.get('currency') as string || 'THB';

  const idempotencyKey = crypto.randomUUID();
  const gatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:8080';

  if (!sourceAccountId || !destinationAccountId || !amount) {
    return { success: false, error: 'Missing required fields' };
  }

  try {
    const response = await fetch(`${gatewayUrl}/api/v1/transactions/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        fromAccountId: sourceAccountId,
        toAccountId: destinationAccountId,
        amount: amount,
        currency: currency,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return { success: false, error: errorData?.message || 'Transaction failed at Gateway' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err: any) {
    console.error("Transfer Error", err);
    return { success: false, error: 'Network error or gateway unreachable' };
  }
}
