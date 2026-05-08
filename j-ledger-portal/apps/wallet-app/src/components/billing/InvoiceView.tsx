import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface InvoiceViewProps {
  invoice: {
    invoiceNumber: string;
    senderName?: string;
    senderDetail?: string;
    amount: number;
    tax: number;
    total: number;
    currency: string;
    createdAt: string;
    items: InvoiceItem[];
    note?: string;
  };
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: invoice.currency || 'THB',
    }).format(val);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
        </View>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>P-WALLET</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoBlock}>
          <Text style={styles.label}>FROM</Text>
          <Text style={styles.infoValue}>{invoice.senderName || 'P-wallet Platform'}</Text>
          {invoice.senderDetail && (
            <Text style={styles.infoSubValue}>{invoice.senderDetail}</Text>
          )}
        </View>
        <View style={[styles.infoBlock, { alignItems: 'flex-end' }]}>
          <Text style={styles.label}>DATE</Text>
          <Text style={styles.infoValue}>
            {format(new Date(invoice.createdAt), 'dd MMM yyyy, HH:mm')}
          </Text>
        </View>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 2 }]}>Description</Text>
        <Text style={[styles.tableHeaderText, { flex: 0.5, textAlign: 'center' }]}>Qty</Text>
        <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Amount</Text>
      </View>

      {/* Table Items */}
      {invoice.items.map((item) => (
        <View key={item.id} style={styles.tableRow}>
          <Text style={[styles.itemText, { flex: 2 }]}>{item.name}</Text>
          <Text style={[styles.itemText, { flex: 0.5, textAlign: 'center' }]}>{item.quantity}</Text>
          <Text style={[styles.itemText, { flex: 1.5, textAlign: 'right' }]}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
      ))}

      <View style={styles.divider} />

      {/* Totals */}
      <View style={styles.totalsContainer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.amount)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>VAT (7%)</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.tax)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>Total Amount</Text>
          <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
        </View>
      </View>

      {invoice.note && (
        <View style={styles.noteSection}>
          <Text style={styles.label}>NOTE</Text>
          <Text style={styles.noteValue}>{invoice.note}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Thank you for using P-wallet</Text>
        <Text style={styles.footerSubText}>This is an electronic receipt and does not require a signature.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    letterSpacing: 1,
  },
  invoiceNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoPlaceholder: {
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 20,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  infoBlock: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    color: '#999',
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  infoSubValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 12,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
  },
  totalsContainer: {
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  noteSection: {
    marginTop: 30,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  noteValue: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  footerSubText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
});
