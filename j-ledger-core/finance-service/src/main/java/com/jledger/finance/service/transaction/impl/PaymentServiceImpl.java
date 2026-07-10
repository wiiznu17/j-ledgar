package com.jledger.finance.service.transaction.impl;

import com.jledger.finance.domain.entity.Account;
import com.jledger.finance.domain.entity.PaymentTransaction;
import com.jledger.finance.dto.PaymentWebhookRequest;
import com.jledger.finance.repository.ledger.AccountRepository;
import com.jledger.finance.repository.transaction.PaymentTransactionRepository;
import com.jledger.finance.service.transaction.PaymentService;
import com.jledger.finance.service.wallet.WalletService;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PaymentServiceImpl.class);
    private static final String DEFAULT_CURRENCY = "THB";

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final AccountRepository accountRepository;
    private final WalletService walletService;

    @Override
    @Transactional
    public void processWebhook(PaymentWebhookRequest request) {
        if (request.signature() == null || request.signature().isBlank()) {
            throw new IllegalArgumentException("Invalid signature");
        }

        int claimedRows = paymentTransactionRepository.claimIfPending(request.reference_id());

        if (claimedRows == 0) {
            paymentTransactionRepository.findByReferenceId(request.reference_id()).ifPresent(existing ->
                LOGGER.info("Webhook for reference {} already handled with status {}", request.reference_id(), existing.getStatus())
            );
            return;
        }

        PaymentTransaction payment = paymentTransactionRepository.findByReferenceId(request.reference_id())
                .orElseThrow(() -> new IllegalArgumentException("Payment not found for reference: " + request.reference_id()));

        try {
            if ("SUCCESS".equalsIgnoreCase(request.status())) {
                settlePayment(payment);
                payment.setStatus(PaymentTransaction.Status.SUCCESS);
            } else {
                payment.setStatus(PaymentTransaction.Status.FAILED);
            }
        } catch (Exception ex) {
            payment.setStatus(PaymentTransaction.Status.FAILED);
            LOGGER.error("Payment settlement failed for reference {}, marked as FAILED", request.reference_id(), ex);
        }

        paymentTransactionRepository.save(payment);
        LOGGER.info("Payment reference {} updated to {}", request.reference_id(), payment.getStatus());
    }

    @Override
    @Transactional
    public PaymentTransaction createPayment(com.jledger.finance.dto.PaymentCreateRequest request) {
        LOGGER.info("Initiating payment: type={}, amount={}, reference={}",
                request.type(), request.amount(), request.referenceId());

        PaymentTransaction payment = PaymentTransaction.builder()
                .accountId(request.accountId())
                .referenceId(request.referenceId())
                .amount(request.amount())
                .type(request.type())
                .status(PaymentTransaction.Status.PENDING)
                .build();

        return paymentTransactionRepository.save(payment);
    }

    private void settlePayment(PaymentTransaction payment) {
        if (payment.getType() == PaymentTransaction.Type.TOPUP) {
            Account account = accountRepository.findById(payment.getAccountId())
                    .orElseThrow(() -> new IllegalArgumentException("Account not found: " + payment.getAccountId()));

            walletService.creditTopUpFromExternal(
                    account.getUserId().toString(),
                    payment.getAmount(),
                    DEFAULT_CURRENCY,
                    payment.getReferenceId(),
                    "STRIPE",
                    null
            );
        } else if (payment.getType() == PaymentTransaction.Type.WITHDRAW) {
            throw new UnsupportedOperationException("Withdrawal settlement is not yet implemented");
        }
    }
}
