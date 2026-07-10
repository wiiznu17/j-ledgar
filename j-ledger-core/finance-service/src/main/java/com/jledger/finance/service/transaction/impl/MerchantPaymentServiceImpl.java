package com.jledger.finance.service.transaction.impl;

import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.domain.entity.Wallet;
import com.jledger.finance.dto.MerchantPayRequest;
import com.jledger.finance.repository.ledger.AccountRepository;
import com.jledger.finance.repository.wallet.WalletRepository;
import com.jledger.finance.dto.MerchantMultiPayRequest;
import com.jledger.finance.dto.MerchantPayLeg;
import com.jledger.finance.service.system.RedisIdempotencyService;
import com.jledger.finance.service.transaction.MerchantPaymentService;
import com.jledger.finance.service.wallet.WalletService;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class MerchantPaymentServiceImpl implements MerchantPaymentService {

    private static final Logger LOGGER = LoggerFactory.getLogger(MerchantPaymentServiceImpl.class);

    private final WalletService walletService;
    private final WalletRepository walletRepository;
    private final AccountRepository accountRepository;
    private final RedisIdempotencyService redisIdempotencyService;

    @Override
    @Transactional
    public Transaction processMerchantPayment(String idempotencyKey, MerchantPayRequest request) {
        return processMultiLegMerchantPayment(idempotencyKey, new MerchantMultiPayRequest(
            request.fromWalletId(),
            request.currency(),
            java.util.List.of(new MerchantPayLeg(
                request.toWalletId(),
                request.amount(),
                "Merchant Payment",
                request.metadata()
            ))
        ));
    }

    @Override
    @Transactional
    @SuppressWarnings("unchecked")
    public Transaction processMultiLegMerchantPayment(String idempotencyKey, MerchantMultiPayRequest request) {
        if (request.legs() == null || request.legs().isEmpty()) {
            throw new IllegalArgumentException("Payment must have at least one leg");
        }

        return redisIdempotencyService.getIfProcessed(idempotencyKey)
            .map(tx -> {
                LOGGER.info("Returning cached transaction for idempotency key: {}", idempotencyKey);
                return tx;
            })
            .orElseGet(() -> {
                LOGGER.info("Processing atomic multi-leg payment for user from wallet: {}. Total legs: {}",
                    request.fromWalletId(), request.legs().size());

                Wallet fromWallet = resolveWallet(request.fromWalletId());
                Transaction primaryTransaction = null;
                BigDecimal totalAmountForRewards = BigDecimal.ZERO;

                for (int i = 0; i < request.legs().size(); i++) {
                    MerchantPayLeg leg = request.legs().get(i);
                    
                    LOGGER.info("Processing leg {}: -> {} amount={}", i + 1, leg.toWalletId(), leg.amount());

                    Transaction tx = walletService.transferWalletToAccount(
                        fromWallet.getUserId(),
                        leg.toWalletId(),
                        leg.amount(),
                        leg.metadata()
                    );

                    if (i == 0) {
                        primaryTransaction = tx;
                        if (leg.metadata() instanceof java.util.Map) {
                            java.util.Map<String, Object> meta = (java.util.Map<String, Object>) leg.metadata();
                            if (meta.containsKey("totalAmount")) {
                                try {
                                    totalAmountForRewards = new BigDecimal(meta.get("totalAmount").toString());
                                } catch (Exception e) {
                                    totalAmountForRewards = leg.amount();
                                }
                            } else {
                                totalAmountForRewards = leg.amount();
                            }
                        } else {
                            totalAmountForRewards = leg.amount();
                        }
                    }
                }

                redisIdempotencyService.cacheResponse(idempotencyKey, primaryTransaction);

                return primaryTransaction;
            });
    }

    private Wallet resolveWallet(String walletId) {
        if (walletId.startsWith("W")) {
            return walletRepository.findByWalletId(walletId)
                .orElseThrow(() -> new IllegalArgumentException("Source wallet not found: " + walletId));
        } else {
            try {
                Long id = Long.parseLong(walletId);
                return walletRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Source wallet not found ID: " + id));
            } catch (NumberFormatException e) {
                return walletRepository.findByUserId(walletId)
                    .orElseThrow(() -> new IllegalArgumentException("Source wallet not found for user: " + walletId));
            }
        }
    }
}
