package com.jledger.finance.service.transaction;

import com.jledger.finance.domain.entity.RewardAccount;
import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.domain.entity.Wallet;
import com.jledger.finance.dto.MerchantPayRequest;
import com.jledger.finance.repository.ledger.AccountRepository;
import com.jledger.finance.repository.ledger.RewardAccountRepository;
import com.jledger.finance.repository.wallet.WalletRepository;
import com.jledger.finance.service.system.RedisIdempotencyService;
import com.jledger.finance.service.wallet.WalletService;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MerchantPaymentService {

    private static final Logger LOGGER = LoggerFactory.getLogger(MerchantPaymentService.class);
    private static final BigDecimal POINTS_RATIO = new BigDecimal("0.01"); // 1% or 1 point per 100 THB

    private final WalletService walletService;
    private final RewardAccountRepository rewardAccountRepository;
    private final WalletRepository walletRepository;
    private final AccountRepository accountRepository;
    private final RedisIdempotencyService redisIdempotencyService;

    @Transactional
    public Transaction processMerchantPayment(String idempotencyKey, MerchantPayRequest request) {
        if (request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }

        // 0. Check Idempotency
        return redisIdempotencyService.getIfProcessed(idempotencyKey)
            .map(tx -> {
                LOGGER.info("Returning cached transaction for idempotency key: {}", idempotencyKey);
                return tx;
            })
            .orElseGet(() -> {
                LOGGER.info("Processing merchant payment: {} -> {} amount={}",
                    request.fromWalletId(), request.toWalletId(), request.amount());

                Wallet fromWallet = walletRepository.findById(request.fromWalletId())
                    .orElseThrow(() -> new IllegalArgumentException("Source wallet not found"));

                // 1. Perform Fund Transfer using WalletService
                Transaction transaction = walletService.transferByWalletId(
                    fromWallet.getUserId(),
                    request.toWalletId().toString(),
                    request.amount()
                );

                // 2. Calculate and Issue Rewards
                BigDecimal pointsToAward = request.amount().multiply(POINTS_RATIO).setScale(2, RoundingMode.HALF_UP);

                UUID userId = UUID.fromString(fromWallet.getUserId());
                UUID accountId = accountRepository.findByUserId(userId).stream()
                    .findFirst()
                    .map(account -> account.getId())
                    .orElseThrow(() -> new IllegalStateException("Ledger account not found for userId: " + userId));

                RewardAccount rewardAccount = rewardAccountRepository.findById(accountId)
                    .orElse(RewardAccount.builder()
                        .accountId(accountId)
                        .pointsBalance(BigDecimal.ZERO)
                        .build());

                rewardAccount.setPointsBalance(rewardAccount.getPointsBalance().add(pointsToAward));
                rewardAccountRepository.save(rewardAccount);

                LOGGER.info("Awarded {} points to account {}", pointsToAward, accountId);

                // 3. Cache response for idempotency
                redisIdempotencyService.cacheResponse(idempotencyKey, transaction);

                return transaction;
            });
    }
}
