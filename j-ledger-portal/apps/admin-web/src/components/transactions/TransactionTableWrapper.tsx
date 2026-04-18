'use client';

import { useRouter } from 'next/navigation';
import { TransactionTable } from '@/components/tables/TransactionTable';
import { Transaction } from '@repo/dto';

interface TransactionTableWrapperProps {
  transactions: Transaction[];
}

export function TransactionTableWrapper({ transactions }: TransactionTableWrapperProps) {
  const router = useRouter();
  return (
    <TransactionTable
      data={transactions}
      onRowClick={(id) => router.push(`/transactions/${id}`)}
    />
  );
}
