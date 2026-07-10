package com.jledger.finance.service.wallet.impl;

import com.jledger.finance.service.wallet.WalletService;

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
public class WalletServiceImpl implements WalletService {

    private final WalletQueryService walletQueryService;
    private final WalletAdminService walletAdminService;
    private final LinkedBankAccountService linkedBankAccountService;
    private final TopUpService topUpService;
    private final P2PTransferService p2pTransferService;

    @Override
    public Wallet createWallet(String userId, String currency) {
        return walletAdminService.createWallet(userId, currency);
    }

    @Override
    public Optional<Wallet> getWallet(String userId) {
        return walletQueryService.getWallet(userId);
    }

    @Override
    @Transactional
    public Wallet updateBalance(String userId, BigDecimal amount) {
        return walletAdminService.updateBalance(userId, amount);
    }

    @Override
    public boolean validateTransaction(String userId, BigDecimal amount) {
        return walletQueryService.validateTransaction(userId, amount);
    }

    @Override
    public Wallet deactivateWallet(String userId) {
        return walletAdminService.deactivateWallet(userId);
    }

    @Override
    public Map<String, BigDecimal> getTransactionLimits(String userId) {
        return walletQueryService.getTransactionLimits(userId);
    }

    @Override
    public Wallet activateWallet(String userId) {
        return walletAdminService.activateWallet(userId);
    }

    @Override
    public Wallet freezeWallet(String userId) {
        return walletAdminService.freezeWallet(userId);
    }

    @Override
    public Wallet unfreezeWallet(String userId) {
        return walletAdminService.unfreezeWallet(userId);
    }

    @Override
    public List<Transaction> getTopUpHistory(String userId) {
        return walletQueryService.getTopUpHistory(userId);
    }

    @Override
    public String generateStaticQR(String userId) {
        Wallet wallet = walletQueryService.getWallet(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        return "jledger|static|" + wallet.getId();
    }

    @Override
    public List<Transaction> getTransactions(String userId) {
        return walletQueryService.getTransactions(userId);
    }

    @Override
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

    @Override
    public List<Transaction> getQRHistory(String userId) {
        return walletQueryService.getQRHistory(userId);
    }

    @Override
    public Wallet getWalletById(Long id) {
        return walletQueryService.getWalletById(id);
    }

    @Override
    @Transactional
    public Wallet adjustBalanceById(Long id, BigDecimal amount, String reason) {
        return walletAdminService.adjustBalanceById(id, amount, reason);
    }

    @Override
    public Wallet deactivateWalletById(Long id) {
        return walletAdminService.deactivateWalletById(id);
    }

    @Override
    public Wallet activateWalletById(Long id) {
        return walletAdminService.activateWalletById(id);
    }

    @Override
    public Wallet updateLimits(Long id, BigDecimal dailyLimit, BigDecimal monthlyLimit) {
        return walletAdminService.updateLimits(id, dailyLimit, monthlyLimit);
    }

    @Override
    @Transactional
    public Transaction topUpBank(String userId, BigDecimal amount, Long bankAccountId) {
        return topUpService.topUpBank(userId, amount, bankAccountId);
    }

    @Override
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

    @Override
    public List<LinkedBankAccount> listLinkedBankAccounts(String userId) {
        return linkedBankAccountService.listLinkedBankAccounts(userId);
    }

    @Override
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

    @Override
    public LinkedBankAccount findOwnedLinkedBankAccount(String userId, Long bankAccountId) {
        return linkedBankAccountService.findOwnedLinkedBankAccount(userId, bankAccountId);
    }

    @Override
    @Transactional
    public LinkedBankAccount setDefaultLinkedBankAccount(String userId, Long bankAccountId) {
        return linkedBankAccountService.setDefaultLinkedBankAccount(userId, bankAccountId);
    }

    @Override
    @Transactional
    public void deleteOwnedLinkedBankAccount(String userId, Long bankAccountId) {
        linkedBankAccountService.deleteOwnedLinkedBankAccount(userId, bankAccountId);
    }

    @Override
    @Transactional
    public Transaction topUpCounter(String userId, BigDecimal amount, String counterCode) {
        return topUpService.topUpCounter(userId, amount, counterCode);
    }

    @Override
    @Transactional
    public Transaction topUpCash(String userId, BigDecimal amount, String agentId) {
        return topUpService.topUpCash(userId, amount, agentId);
    }

    @Override
    @Transactional
    public Transaction transferByPhone(String fromUserId, String toPhone, BigDecimal amount) {
        return p2pTransferService.transferByPhone(fromUserId, toPhone, amount);
    }

    @Override
    public Map<String, Object> previewTransferByPhone(String fromUserId, String recipientPhone, BigDecimal amount) {
        return p2pTransferService.previewTransferByPhone(fromUserId, recipientPhone, amount);
    }

    @Override
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

    @Override
    @Transactional
    public Transaction transferByWalletId(String fromUserId, String toWalletId, BigDecimal amount, Object metadata) {
        return p2pTransferService.transferByWalletId(fromUserId, toWalletId, amount, metadata);
    }

    @Override
    @Transactional
    public Transaction transferWalletToAccount(String fromUserId, String toAccountId, BigDecimal amount, Object metadata) {
        return p2pTransferService.transferWalletToAccount(fromUserId, toAccountId, amount, metadata);
    }

    @Override
    public Transaction transferByQR(String fromUserId, String qrData, BigDecimal amount) {
        return p2pTransferService.transferByQR(fromUserId, qrData, amount);
    }

    @Override
    public String generateQR(String userId, BigDecimal amount) {
        return p2pTransferService.generateQR(userId, amount);
    }

    @Override
    @Transactional
    public Transaction payQR(String fromUserId, String qrData, BigDecimal amount) {
        return p2pTransferService.payQR(fromUserId, qrData, amount);
    }

    @Override
    @Transactional
    public Transaction payUtilityBill(String userId, String billerCode, String accountNumber, BigDecimal amount) {
        return p2pTransferService.payUtilityBill(userId, billerCode, accountNumber, amount);
    }

    @Override
    @Transactional
    public Transaction payCreditCardBill(String userId, String cardNumber, BigDecimal amount) {
        return p2pTransferService.payCreditCardBill(userId, cardNumber, amount);
    }

    @Override
    @Transactional
    public Transaction payMobileTopup(String userId, String phoneNumber, BigDecimal amount) {
        return p2pTransferService.payMobileTopup(userId, phoneNumber, amount);
    }

    @Override
    public Page<Wallet> getAllWallets(Pageable pageable) {
        return walletQueryService.getAllWallets(pageable);
    }

    @Override
    public List<Wallet> getAllWallets() {
        return walletQueryService.getAllWallets();
    }

    @Override
    public List<Wallet> searchWallets(String query) {
        return walletQueryService.searchWallets(query);
    }

    @Override
    public List<Transaction> getAllTransactions() {
        return walletQueryService.getAllTransactions();
    }

    @Override
    @Transactional
    public Wallet adjustBalance(String userId, BigDecimal amount, String reason) {
        return walletAdminService.adjustBalance(userId, amount, reason);
    }

    @Override
    public Optional<Transaction> getTransactionById(String id) {
        return walletQueryService.getTransactionById(id);
    }
}
