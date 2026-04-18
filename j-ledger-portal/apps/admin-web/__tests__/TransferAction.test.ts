import { executeTransfer } from '../src/app/actions/transfer';

// Mock the global fetch natively before assertions
global.fetch = jest.fn();

describe('Transfer Server Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    if (!global.crypto) {
      Object.defineProperty(global, 'crypto', {
        value: {
          randomUUID: () => 'mocked-uuid-1234',
        },
      });
    } else if (!global.crypto.randomUUID) {
      global.crypto.randomUUID = () => 'a0000000-0000-0000-0000-000000001234';
    }
  });

  it('should rigidly return error if missing fields exist', async () => {
    const formData = new FormData();
    const result = await executeTransfer(formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Missing required fields');
  });

  it('should successfully map to fetch API and explicitly include Idempotency-Key header', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'tx-999', status: 'COMPLETED' }),
    });

    const formData = new FormData();
    formData.append('sourceAccountId', 'acc-val-1');
    formData.append('destinationAccountId', 'acc-val-2');
    formData.append('amount', '50.0');

    const result = await executeTransfer(formData);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    const fetchCallArgs = (global.fetch as jest.Mock).mock.calls[0];
    const fetchUrl = fetchCallArgs[0];
    const fetchOptions = fetchCallArgs[1];

    expect(fetchUrl).toContain('/api/v1/transactions/transfer');
    expect(fetchOptions.method).toBe('POST');

    // Explicit Validation of header enforcement logic per requirements
    expect(fetchOptions.headers).toHaveProperty('Idempotency-Key');

    expect(JSON.parse(fetchOptions.body)).toMatchObject({
      fromAccountId: 'acc-val-1',
      toAccountId: 'acc-val-2',
      amount: '50.0',
      currency: 'THB',
    });

    if (result.success && result.data) {
      expect(result.data.id).toBe('tx-999');
    } else {
      throw new Error('Transfer should have succeeded');
    }
  });

  it('should defensively catch API failure strings properly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'System busy, please try again.' }),
    });

    const formData = new FormData();
    formData.append('sourceAccountId', 'ac-1');
    formData.append('destinationAccountId', 'ac-2');
    formData.append('amount', '22.0');

    const result = await executeTransfer(formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('System busy, please try again.');
  });
});
