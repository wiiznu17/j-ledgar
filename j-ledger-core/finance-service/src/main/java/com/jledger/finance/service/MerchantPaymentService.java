package com.jledger.finance.service;

import com.jledger.finance.domain.entity.RewardAccount;
import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.dto.MerchantPayRequest;
import com.jledger.finance.repository.RewardAccountRepository;
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

    @Transactional
    public Transaction processMerchantPayment(String idempotencyKey, MerchantPayRequest request) {
        LOGGER.info("Processing merchant payment: {} -> {} amount={}",
            request.fromWalletId(), request.toWalletId(), request.amount());

        // 1. Perform Fund Transfer using WalletService
        Transaction transaction = walletService.transferByWalletId(
            request.fromWalletId().toString(),
            request.toWalletId().toString(),
            request.amount()
        );

        // 2. Calculate and Issue Rewards
        BigDecimal pointsToAward = request.amount().multiply(POINTS_RATIO).setScale(2, RoundingMode.HALF_UP);

        UUID accountId = UUID.randomUUID(); // TODO: Map walletId to accountId
        RewardAccount rewardAccount = rewardAccountRepository.findById(accountId)
            .orElse(RewardAccount.builder()
                .accountId(accountId)
                .pointsBalance(BigDecimal.ZERO)
                .build());

        rewardAccount.setPointsBalance(rewardAccount.getPointsBalance().add(pointsToAward));
        rewardAccountRepository.save(rewardAccount);

        LOGGER.info("Awarded {} points to account {}", pointsToAward, accountId);

        return transaction;
    }
}
