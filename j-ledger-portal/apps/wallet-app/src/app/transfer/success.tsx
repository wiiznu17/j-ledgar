import {
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TransactionReceipt } from '@/components/transaction/TransactionReceipt';


export default function TransferSuccessScreen() {
  const router = useRouter();
  const {
    recipient,
    amount,
    merchantName,
    transactionId,
    createdAt,
    recipientName,
  } = useLocalSearchParams<{
    recipient?: string;
    amount: string;
    merchantName?: string;
    transactionId: string;
    createdAt?: string;
    recipientName?: string;
  }>();

  // Determine if it's a merchant based on the presence of merchantName
  const isMerchant = !!merchantName;
  
  // The name to display as the recipient
  const displayRecipient = merchantName || recipientName || recipient || 'Recipient';

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <TransactionReceipt 
          amount={parseFloat(amount) || 0}
          transactionId={transactionId || '-'}
          timestamp={createdAt || new Date().toISOString()}
          recipientName={displayRecipient}
          recipientType={isMerchant ? 'merchant' : 'user'}
          onDone={() => router.replace('/(tabs)')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
