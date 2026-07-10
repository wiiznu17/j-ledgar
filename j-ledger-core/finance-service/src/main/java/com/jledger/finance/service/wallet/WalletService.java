package com.jledger.finance.service.wallet;

import com.jledger.finance.domain.entity.LinkedBankAccount;
import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.domain.entity.Wallet;
import com.jledger.finance.domain.enums.TransactionType;
import com.jledger.finance.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletQueryService walletQueryService;
    private final WalletAdminService walletAdminService;
    private final LinkedBankAccountService linkedBankAccountService;
    private final TopUpService topUpService;
    private final P2PTransferService p2pTransferService;

    public Wallet createWallet(String userId, String currency) {
        return walletAdminService.createWallet(userId, currency);
    }

    public Optional<Wallet> getWallet(String userId) {
        return walletQueryService.getWallet(userId);
    }

    @Transactional
    public Wallet updateBalance(String userId, BigDecimal amount) {
        return walletAdminService.updateBalance(userId, amount);
    }

    public boolean validateTransaction(String userId, BigDecimal amount) {
        return walletQueryService.validateTransaction(userId, amount);
    }

    public Wallet deactivateWallet(String userId) {
        return walletAdminService.deactivateWallet(userId);
    }

    public Map<String, BigDecimal> getTransactionLimits(String userId) {
        return walletQueryService.getTransactionLimits(userId);
    }

    public Wallet activateWallet(String userId) {
        return walletAdminService.activateWallet(userId);
    }

    public Wallet freezeWallet(String userId) {
        return walletAdminService.freezeWallet(userId);
    }

    public Wallet unfreezeWallet(String userId) {
        return walletAdminService.unfreezeWallet(userId);
    }

    public List<Transaction> getTopUpHistory(String userId) {
        return walletQueryService.getTopUpHistory(userId);
    }

    public String generateStaticQR(String userId) {
        Wallet wallet = walletQueryService.getWallet(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        return "jledger|static|" + wallet.getId();
    }

    public List<Transaction> getTransactions(String userId) {
        return walletQueryService.getTransactions(userId);
    }

    public List<Transaction> getTransactions(
            String userId,
            Integer page,
            Integer size,
            TransactionType type,
            LocalDateTime from,
            LocalDateTime to
    ) {
        return walletQueryService.getTransactions(userId, page, size, type, from, to);
    }

    public List<Transaction> getQRHistory(String userId) {
        return walletQueryService.getQRHistory(userId);
    }

    public Wallet getWalletById(Long id) {
        return walletQueryService.getWalletById(id);
    }

    @Transactional
    public Wallet adjustBalanceById(Long id, BigDecimal amount, String reason) {
        return walletAdminService.adjustBalanceById(id, amount, reason);
    }

    public Wallet deactivateWalletById(Long id) {
        return walletAdminService.deactivateWalletById(id);
    }

    public Wallet activateWalletById(Long id) {
        return walletAdminService.activateWalletById(id);
    }

    public Wallet updateLimits(Long id, BigDecimal dailyLimit, BigDecimal monthlyLimit) {
        return walletAdminService.updateLimits(id, dailyLimit, monthlyLimit);
    }

    @Transactional
    public Transaction topUpBank(String userId, BigDecimal amount, Long bankAccountId) {
        return topUpService.topUpBank(userId, amount, bankAccountId);
    }

    @Transactional
    public Transaction creditTopUpFromExternal(
            String userId,
            BigDecimal amount,
            String currency,
            String externalRef,
            String provider,
            String metadataJson
    ) {
        return topUpService.creditTopUpFromExternal(userId, amount, currency, externalRef, provider, metadataJson);
    }

    public List<LinkedBankAccount> listLinkedBankAccounts(String userId) {
        return linkedBankAccountService.listLinkedBankAccounts(userId);
    }

    @Transactional
    public LinkedBankAccount createLinkedBankAccount(
            String userId,
            String bankCode,
            String bankName,
            String accountNumber,
            String accountName,
            String accountType,
            boolean isDefault,
            boolean isVerified
    ) {
        return linkedBankAccountService.createLinkedBankAccount(userId, bankCode, bankName, accountNumber, accountName, accountType, isDefault, isVerified);
    }

    public LinkedBankAccount findOwnedLinkedBankAccount(String userId, Long bankAccountId) {
        return linkedBankAccountService.findOwnedLinkedBankAccount(userId, bankAccountId);
    }

    @Transactional
    public LinkedBankAccount setDefaultLinkedBankAccount(String userId, Long bankAccountId) {
        return linkedBankAccountService.setDefaultLinkedBankAccount(userId, bankAccountId);
    }

    @Transactional
    public void deleteOwnedLinkedBankAccount(String userId, Long bankAccountId) {
        linkedBankAccountService.deleteOwnedLinkedBankAccount(userId, bankAccountId);
    }

    @Transactional
    public Transaction topUpCounter(String userId, BigDecimal amount, String counterCode) {
        return topUpService.topUpCounter(userId, amount, counterCode);
    }

    @Transactional
    public Transaction topUpCash(String userId, BigDecimal amount, String agentId) {
        return topUpService.topUpCash(userId, amount, agentId);
    }

    @Transactional
    public Transaction transferByPhone(String fromUserId, String toPhone, BigDecimal amount) {
        return p2pTransferService.transferByPhone(fromUserId, toPhone, amount);
    }

    public Map<String, Object> previewTransferByPhone(String fromUserId, String recipientPhone, BigDecimal amount) {
        return p2pTransferService.previewTransferByPhone(fromUserId, recipientPhone, amount);
    }

    @Transactional
    public Transaction transferByPhoneV1(
            String fromUserId,
            String recipientPhone,
            BigDecimal amount,
            String note,
            String idempotencyKey,
            Object metadata
    ) {
        return p2pTransferService.transferByPhoneV1(fromUserId, recipientPhone, amount, note, idempotencyKey, metadata);
    }

    @Transactional
    public Transaction transferByWalletId(String fromUserId, String toWalletId, BigDecimal amount, Object metadata) {
        return p2pTransferService.transferByWalletId(fromUserId, toWalletId, amount, metadata);
    }

    @Transactional
    public Transaction transferWalletToAccount(String fromUserId, String toAccountId, BigDecimal amount, Object metadata) {
        return p2pTransferService.transferWalletToAccount(fromUserId, toAccountId, amount, metadata);
    }

    public Transaction transferByQR(String fromUserId, String qrData, BigDecimal amount) {
        return p2pTransferService.transferByQR(fromUserId, qrData, amount);
    }

    public String generateQR(String userId, BigDecimal amount) {
        return p2pTransferService.generateQR(userId, amount);
    }

    @Transactional
    public Transaction payQR(String fromUserId, String qrData, BigDecimal amount) {
        return p2pTransferService.payQR(fromUserId, qrData, amount);
    }

    @Transactional
    public Transaction payUtilityBill(String userId, String billerCode, String accountNumber, BigDecimal amount) {
        return p2pTransferService.payUtilityBill(userId, billerCode, accountNumber, amount);
    }

    @Transactional
    public Transaction payCreditCardBill(String userId, String cardNumber, BigDecimal amount) {
        return p2pTransferService.payCreditCardBill(userId, cardNumber, amount);
    }

    @Transactional
    public Transaction payMobileTopup(String userId, String phoneNumber, BigDecimal amount) {
        return p2pTransferService.payMobileTopup(userId, phoneNumber, amount);
    }

    public Page<Wallet> getAllWallets(Pageable pageable) {
        return walletQueryService.getAllWallets(pageable);
    }

    public List<Wallet> getAllWallets() {
        return walletQueryService.getAllWallets();
    }

    public List<Wallet> searchWallets(String query) {
        return walletQueryService.searchWallets(query);
    }

    public List<Transaction> getAllTransactions() {
        return walletQueryService.getAllTransactions();
    }

    @Transactional
    public Wallet adjustBalance(String userId, BigDecimal amount, String reason) {
        return walletAdminService.adjustBalance(userId, amount, reason);
    }

    public Optional<Transaction> getTransactionById(String id) {
        return walletQueryService.getTransactionById(id);
    }
}
