package com.jledger.core.service;

import com.jledger.core.domain.RewardAccount;
import com.jledger.core.domain.Transaction;
import com.jledger.core.dto.MerchantPayRequest;
import com.jledger.core.dto.TransferRequest;
import com.jledger.core.repository.RewardAccountRepository;
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

    private final TransferExecutionService transferExecutionService;
    private final RewardAccountRepository rewardAccountRepository;

    @Transactional
    public Transaction processMerchantPayment(String idempotencyKey, MerchantPayRequest request) {
        LOGGER.info("Processing merchant payment: {} -> {} amount={}", 
            request.fromAccountId(), request.merchantAccountId(), request.amount());

        // 1. Perform Fund Transfer
        TransferRequest transferRequest = new TransferRequest(
            request.fromAccountId(),
            request.merchantAccountId(),
            request.amount(),
            request.currency()
        );
        
        Transaction transaction = transferExecutionService.performTransferInDb(
            idempotencyKey, 
            transferRequest, 
            request.amount()
        );

        // 2. Calculate and Issue Rewards
        BigDecimal pointsToAward = request.amount().multiply(POINTS_RATIO).setScale(2, RoundingMode.HALF_UP);
        
        RewardAccount rewardAccount = rewardAccountRepository.findById(request.fromAccountId())
            .orElse(RewardAccount.builder()
                .accountId(request.fromAccountId())
                .pointsBalance(BigDecimal.ZERO)
                .build());

        rewardAccount.setPointsBalance(rewardAccount.getPointsBalance().add(pointsToAward));
        rewardAccountRepository.save(rewardAccount);

        LOGGER.info("Awarded {} points to account {}", pointsToAward, request.fromAccountId());

        return transaction;
    }
}
