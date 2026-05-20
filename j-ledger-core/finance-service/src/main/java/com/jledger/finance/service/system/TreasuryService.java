package com.jledger.finance.service.system;

import com.jledger.finance.domain.entity.TreasuryBankAccount;
import com.jledger.finance.domain.entity.TreasuryPayout;
import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.domain.enums.TransactionStatus;
import com.jledger.finance.domain.enums.TransactionType;
import com.jledger.finance.dto.TreasurySummaryResponse;
import com.jledger.finance.repository.system.TreasuryBankAccountRepository;
import com.jledger.finance.repository.system.TreasuryPayoutRepository;
import com.jledger.finance.repository.transaction.TransactionRepository;
import com.jledger.finance.repository.wallet.WalletRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TreasuryService {
    private final TreasuryBankAccountRepository bankAccountRepository;
    private final TreasuryPayoutRepository payoutRepository;
    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;

    public TreasuryService(
            TreasuryBankAccountRepository bankAccountRepository,
            TreasuryPayoutRepository payoutRepository,
            TransactionRepository transactionRepository,
            WalletRepository walletRepository) {
        this.bankAccountRepository = bankAccountRepository;
        this.payoutRepository = payoutRepository;
        this.transactionRepository = transactionRepository;
        this.walletRepository = walletRepository;
    }

    public TreasurySummaryResponse getSummary() {
        // 1. Calculate Stripe Balance
        BigDecimal totalTopups = transactionRepository.sumAmountByTypeAndStatus(TransactionType.TOPUP, TransactionStatus.COMPLETED);
        if (totalTopups == null) totalTopups = BigDecimal.ZERO;

        // Sum of all COMPLETED payouts from Stripe
        BigDecimal totalPayouts = payoutRepository.findAll().stream()
                .filter(p -> "COMPLETED".equals(p.getStatus()))
                .map(TreasuryPayout::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal stripeBalance = totalTopups.subtract(totalPayouts);

        // 2. Get Bank Balances
        List<TreasuryBankAccount> bankAccounts = bankAccountRepository.findAll();
        BigDecimal totalBankBalance = bankAccounts.stream()
                .map(TreasuryBankAccount::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. Get Customer Liability
        BigDecimal totalCustomerLiability = walletRepository.sumAllBalances();
        if (totalCustomerLiability == null) totalCustomerLiability = BigDecimal.ZERO;

        // 4. Calculate Reserve Ratio
        BigDecimal totalAssets = stripeBalance.add(totalBankBalance);
        BigDecimal reserveRatio = BigDecimal.ZERO;
        if (totalCustomerLiability.compareTo(BigDecimal.ZERO) > 0) {
            reserveRatio = totalAssets.multiply(new BigDecimal("100"))
                    .divide(totalCustomerLiability, 2, RoundingMode.HALF_UP);
        }

        // Prepare Response
        TreasurySummaryResponse response = new TreasurySummaryResponse();
        response.setStripeBalance(stripeBalance);
        response.setTotalBankBalance(totalBankBalance);
        response.setTotalCustomerLiability(totalCustomerLiability);
        response.setReserveRatio(reserveRatio);
        
        List<TreasurySummaryResponse.BankAccountSummary> summaries = bankAccounts.stream()
                .map(acc -> new TreasurySummaryResponse.BankAccountSummary(
                        acc.getName(),
                        acc.getBankName(),
                        acc.getAccountNumber(),
                        acc.getBalance(),
                        acc.getProvider()
                ))
                .collect(Collectors.toList());
        response.setBankAccounts(summaries);

        return response;
    }

    @Transactional
    public void recordStripePayoutConfirmed(String stripePayoutId, BigDecimal amount, LocalDateTime arrivalDate) {
        if (payoutRepository.findByStripePayoutId(stripePayoutId).isPresent()) {
            return; // Already processed (idempotency)
        }

        // 1. Find SCB Main Account (as destination for this example)
        TreasuryBankAccount destinationAccount = bankAccountRepository.findByProvider("SCB")
                .orElseThrow(() -> new RuntimeException("Destination bank account not found"));

        // 3. Create Payout Record
        TreasuryPayout payout = new TreasuryPayout();
        payout.setStripePayoutId(stripePayoutId);
        payout.setAmount(amount);
        payout.setStatus("COMPLETED");
        payout.setDestinationAccount(destinationAccount);
        payout.setArrivalDate(arrivalDate);
        payout.setNote("Automated payout from Stripe");
        payoutRepository.save(payout);

        // 4. Update Destination Account Balance
        destinationAccount.setBalance(destinationAccount.getBalance().add(amount));
        bankAccountRepository.save(destinationAccount);

        // 5. Record Transaction Log (Double-entry representation)
        String txId = generateReadableTransactionId();
        Transaction tx = new Transaction();
        tx.setTransactionId(txId);
        tx.setReferenceId(stripePayoutId);
        tx.setType(TransactionType.WITHDRAWAL);
        tx.setAmount(amount);
        tx.setStatus(TransactionStatus.COMPLETED);
        tx.setDescription("Stripe payout sweep to corporate bank account: SCB (" + destinationAccount.getAccountNumber() + ")");
        tx.setCompletedAt(arrivalDate);
        tx.setMetadata("{\"stripePayoutId\":\"" + stripePayoutId + "\",\"note\":\"Automated payout from Stripe to SCB Main Corporate\"}");
        transactionRepository.save(tx);
    }
    
    private String generateReadableTransactionId() {
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyMMdd");
        String dateStr = java.time.LocalDate.now().format(formatter);
        int randomNum = (int) (Math.random() * 900000) + 100000;
        return "TXN" + dateStr + randomNum;
    }
    
    public List<TreasuryPayout> getPayoutHistory() {
        return payoutRepository.findAll();
    }
}
