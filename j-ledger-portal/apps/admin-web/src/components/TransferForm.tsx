'use client';

import { useState, useRef } from 'react';
import { executeTransfer } from '../app/actions/transfer';

export default function TransferForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Capture form ref before async to avoid currentTarget becoming null in JSDOM
    const form = formRef.current;
    const formData = new FormData(form || e.currentTarget);
    const result = await executeTransfer(formData);

    if (result.success) {
      setMessage({ text: `Transfer successful! Tx ID: ${result.data?.id}`, type: 'success' });
      form?.reset();
    } else {
      setMessage({ text: result.error || 'Transfer failed', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4 max-w-md"
      data-testid="transfer-form"
    >
      <h2 className="text-xl font-semibold text-white">Create Transfer</h2>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm border ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
        >
          {message.text}
        </div>
      )}

      <div>
        <label htmlFor="sourceAccountId" className="block text-sm text-gray-400 mb-1">
          Source Account ID
        </label>
        <input
          id="sourceAccountId"
          name="sourceAccountId"
          required
          className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
        />
      </div>
      <div>
        <label htmlFor="destinationAccountId" className="block text-sm text-gray-400 mb-1">
          Destination Account ID
        </label>
        <input
          id="destinationAccountId"
          name="destinationAccountId"
          required
          className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
        />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="amount" className="block text-sm text-gray-400 mb-1">
            Amount
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            required
            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="w-1/3">
          <label className="block text-sm text-gray-400 mb-1">Currency</label>
          <select
            name="currency"
            defaultValue="THB"
            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="THB">THB</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
      >
        {loading ? 'Processing...' : 'Execute Transfer'}
      </button>
    </form>
  );
}
