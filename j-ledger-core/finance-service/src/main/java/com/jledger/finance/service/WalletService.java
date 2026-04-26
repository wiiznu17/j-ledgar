package com.jledger.finance.service;

import com.jledger.finance.model.Transaction;
import com.jledger.finance.model.TransactionStatus;
import com.jledger.finance.model.TransactionType;
import com.jledger.finance.model.Wallet;
import com.jledger.finance.repository.TransactionRepository;
import com.jledger.finance.repository.WalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
public class WalletService {

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_PREFIX = "wallet:";
    private static final BigDecimal DAILY_LIMIT = new BigDecimal("1000000");
    private static final BigDecimal TRANSACTION_LIMIT = new BigDecimal("50000");

    public Wallet createWallet(Long userId, String currency) {
        if (walletRepository.existsByUserId(userId)) {
            throw new RuntimeException("Wallet already exists for user");
        }

        Wallet wallet = new Wallet();
        wallet.setUserId(userId);
        wallet.setCurrency(currency);
        wallet.setBalance(BigDecimal.ZERO);
        wallet.setIsActive(true);

        return walletRepository.save(wallet);
    }

    public Optional<Wallet> getWallet(Long userId) {
        String cacheKey = CACHE_PREFIX + userId;
        Wallet cached = (Wallet) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return Optional.of(cached);
        }

        Optional<Wallet> wallet = walletRepository.findByUserId(userId);
        wallet.ifPresent(w -> redisTemplate.opsForValue().set(cacheKey, w, 5, TimeUnit.MINUTES));
        return wallet;
    }

    @Transactional
    public Wallet updateBalance(Long userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (!wallet.getIsActive()) {
            throw new RuntimeException("Wallet is inactive");
        }

        BigDecimal newBalance = wallet.getBalance().add(amount);
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        wallet.setBalance(newBalance);
        Wallet updated = walletRepository.save(wallet);

        // Update cache
        String cacheKey = CACHE_PREFIX + userId;
        redisTemplate.opsForValue().set(cacheKey, updated, 5, TimeUnit.MINUTES);

        return updated;
    }

    public boolean validateTransaction(Long userId, BigDecimal amount) {
        Wallet wallet = getWallet(userId).orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (amount.compareTo(TRANSACTION_LIMIT) > 0) {
            throw new RuntimeException("Transaction amount exceeds limit");
        }

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        return true;
    }

    public Wallet deactivateWallet(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        wallet.setIsActive(false);
        return walletRepository.save(wallet);
    }

    public Map<String, BigDecimal> getTransactionLimits(Long userId) {
        return Map.of(
            "dailyLimit", DAILY_LIMIT,
            "transactionLimit", TRANSACTION_LIMIT
        );
    }

    public Wallet activateWallet(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        wallet.setIsActive(true);
        return walletRepository.save(wallet);
    }

    public Wallet freezeWallet(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        wallet.setStatus("FROZEN");
        return walletRepository.save(wallet);
    }

    public Wallet unfreezeWallet(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        wallet.setStatus("ACTIVE");
        return walletRepository.save(wallet);
    }

    public List<Transaction> getTopUpHistory(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        return transactionRepository.findByToWalletIdAndType(wallet.getId(), TransactionType.TOPUP);
    }

    public String generateStaticQR(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        return "jledger|static|" + wallet.getId();
    }

    public List<Transaction> getQRHistory(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        return transactionRepository.findByFromWalletIdOrToWalletId(wallet.getId(), wallet.getId());
    }

    public Optional<Wallet> getWalletById(Long id) {
        return walletRepository.findById(id);
    }

    @Transactional
    public Wallet adjustBalanceById(Long id, BigDecimal amount, String reason) {
        Wallet wallet = walletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        wallet.setBalance(wallet.getBalance().add(amount));
        Wallet updated = walletRepository.save(wallet);

        // Record adjustment transaction
        Transaction transaction = new Transaction();
        transaction.setType(amount.compareTo(BigDecimal.ZERO) > 0 ? TransactionType.TOPUP : TransactionType.WITHDRAWAL);
        transaction.setAmount(amount.abs());
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(null);
        transaction.setToWalletId(wallet.getId());
        transaction.setDescription("Admin balance adjustment: " + reason);
        transaction.setMetadata("{\"reason\":\"" + reason + "\",\"adminAdjustment\":true}");

        transactionRepository.save(transaction);

        return updated;
    }

    public Wallet deactivateWalletById(Long id) {
        Wallet wallet = walletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        wallet.setIsActive(false);
        return walletRepository.save(wallet);
    }

    public Wallet activateWalletById(Long id) {
        Wallet wallet = walletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        wallet.setIsActive(true);
        return walletRepository.save(wallet);
    }

    public Wallet updateLimits(Long id, BigDecimal dailyLimit, BigDecimal monthlyLimit) {
        Wallet wallet = walletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        wallet.setDailyLimit(dailyLimit);
        wallet.setMonthlyLimit(monthlyLimit);
        return walletRepository.save(wallet);
    }

    @Transactional
    public Transaction topUpBank(Long userId, BigDecimal amount, String bankAccount) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (!wallet.getIsActive()) {
            throw new RuntimeException("Wallet is inactive");
        }

        // Mock bank transfer - just add balance
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);

        // Record transaction
        Transaction transaction = new Transaction();
        transaction.setType(TransactionType.TOPUP);
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(null);
        transaction.setToWalletId(wallet.getId());
        transaction.setDescription("Bank top-up from " + bankAccount);
        transaction.setMetadata("{\"bankAccount\":\"" + bankAccount + "\"}");

        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction topUpCounter(Long userId, BigDecimal amount, String counterCode) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (!wallet.getIsActive()) {
            throw new RuntimeException("Wallet is inactive");
        }

        // Mock counter top-up
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);

        Transaction transaction = new Transaction();
        transaction.setType(TransactionType.TOPUP);
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(null);
        transaction.setToWalletId(wallet.getId());
        transaction.setDescription("Counter top-up at " + counterCode);
        transaction.setMetadata("{\"counterCode\":\"" + counterCode + "\"}");

        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction topUpCash(Long userId, BigDecimal amount, String agentId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (!wallet.getIsActive()) {
            throw new RuntimeException("Wallet is inactive");
        }

        // Mock cash top-up
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);

        Transaction transaction = new Transaction();
        transaction.setType(TransactionType.TOPUP);
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(null);
        transaction.setToWalletId(wallet.getId());
        transaction.setDescription("Cash top-up at agent " + agentId);
        transaction.setMetadata("{\"agentId\":\"" + agentId + "\"}");

        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction transferByPhone(Long fromUserId, String toPhone, BigDecimal amount) {
        Wallet fromWallet = walletRepository.findByUserId(fromUserId)
                .orElseThrow(() -> new RuntimeException("Source wallet not found"));

        if (!fromWallet.getIsActive()) {
            throw new RuntimeException("Source wallet is inactive");
        }

        if (fromWallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        // Mock: Find wallet by phone (in real system, would query user service)
        Wallet toWallet = walletRepository.findAll().stream()
                .filter(w -> w.getUserId().toString().equals(toPhone)) // Simplified - phone = userId for mock
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Recipient wallet not found"));

        if (!toWallet.getIsActive()) {
            throw new RuntimeException("Recipient wallet is inactive");
        }

        // Perform transfer
        fromWallet.setBalance(fromWallet.getBalance().subtract(amount));
        toWallet.setBalance(toWallet.getBalance().add(amount));
        walletRepository.save(fromWallet);
        walletRepository.save(toWallet);

        // Record transaction
        Transaction transaction = new Transaction();
        transaction.setType(TransactionType.TRANSFER);
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(fromWallet.getId());
        transaction.setToWalletId(toWallet.getId());
        transaction.setDescription("Transfer to phone " + toPhone);
        transaction.setMetadata("{\"recipientPhone\":\"" + toPhone + "\"}");

        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction transferByWalletId(Long fromUserId, String toWalletId, BigDecimal amount) {
        Wallet fromWallet = walletRepository.findByUserId(fromUserId)
                .orElseThrow(() -> new RuntimeException("Source wallet not found"));

        if (!fromWallet.getIsActive()) {
            throw new RuntimeException("Source wallet is inactive");
        }

        if (fromWallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        Wallet toWallet = walletRepository.findById(Long.parseLong(toWalletId))
                .orElseThrow(() -> new RuntimeException("Recipient wallet not found"));

        if (!toWallet.getIsActive()) {
            throw new RuntimeException("Recipient wallet is inactive");
        }

        fromWallet.setBalance(fromWallet.getBalance().subtract(amount));
        toWallet.setBalance(toWallet.getBalance().add(amount));
        walletRepository.save(fromWallet);
        walletRepository.save(toWallet);

        Transaction transaction = new Transaction();
        transaction.setType(TransactionType.TRANSFER);
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(fromWallet.getId());
        transaction.setToWalletId(toWallet.getId());
        transaction.setDescription("Transfer to wallet " + toWalletId);
        transaction.setMetadata("{\"toWalletId\":\"" + toWalletId + "\"}");

        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction transferByQR(Long fromUserId, String qrData, BigDecimal amount) {
        // Mock: Parse QR data to get wallet ID
        String toWalletId = qrData; // Simplified for mock

        return transferByWalletId(fromUserId, toWalletId, amount);
    }

    public String generateQR(Long userId, BigDecimal amount) {
        // Mock: Generate QR code data
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        return "jledger|qr|" + wallet.getId() + "|" + amount.toString();
    }

    @Transactional
    public Transaction payQR(Long fromUserId, String qrData, BigDecimal amount) {
        // Mock: Parse QR and pay
        return transferByQR(fromUserId, qrData, amount);
    }

    @Transactional
    public Transaction payUtilityBill(Long userId, String billerCode, String accountNumber, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (!wallet.getIsActive()) {
            throw new RuntimeException("Wallet is inactive");
        }

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        // Mock bill payment
        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);

        Transaction transaction = new Transaction();
        transaction.setType(TransactionType.BILL_PAYMENT);
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(wallet.getId());
        transaction.setToWalletId(null);
        transaction.setDescription("Utility bill payment to " + billerCode);
        transaction.setMetadata("{\"billersCode\":\"" + billerCode + "\",\"accountNumber\":\"" + accountNumber + "\"}");

        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction payCreditCardBill(Long userId, String cardNumber, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (!wallet.getIsActive()) {
            throw new RuntimeException("Wallet is inactive");
        }

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);

        Transaction transaction = new Transaction();
        transaction.setType(TransactionType.BILL_PAYMENT);
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(wallet.getId());
        transaction.setToWalletId(null);
        transaction.setDescription("Credit card payment for " + cardNumber);
        transaction.setMetadata("{\"cardNumber\":\"" + cardNumber + "\"}");

        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction payMobileTopup(Long userId, String phoneNumber, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        if (!wallet.getIsActive()) {
            throw new RuntimeException("Wallet is inactive");
        }

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);

        Transaction transaction = new Transaction();
        transaction.setType(TransactionType.MOBILE_TOPUP);
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(wallet.getId());
        transaction.setToWalletId(null);
        transaction.setDescription("Mobile top-up for " + phoneNumber);
        transaction.setMetadata("{\"phoneNumber\":\"" + phoneNumber + "\"}");

        return transactionRepository.save(transaction);
    }

    // Admin methods
    public List<Wallet> getAllWallets() {
        return walletRepository.findAll();
    }

    public List<Wallet> searchWallets(String query) {
        // Simplified search - in real system would search by userId, phone, etc.
        return walletRepository.findAll().stream()
                .filter(w -> w.getUserId().toString().contains(query))
                .collect(java.util.stream.Collectors.toList());
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    @Transactional
    public Wallet adjustBalance(Long userId, BigDecimal amount, String reason) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        wallet.setBalance(wallet.getBalance().add(amount));
        Wallet updated = walletRepository.save(wallet);

        // Record adjustment transaction
        Transaction transaction = new Transaction();
        transaction.setType(amount.compareTo(BigDecimal.ZERO) > 0 ? TransactionType.TOPUP : TransactionType.WITHDRAWAL);
        transaction.setAmount(amount.abs());
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setFromWalletId(null);
        transaction.setToWalletId(wallet.getId());
        transaction.setDescription("Admin balance adjustment: " + reason);
        transaction.setMetadata("{\"reason\":\"" + reason + "\",\"adminAdjustment\":true}");

        transactionRepository.save(transaction);

        return updated;
    }
}
