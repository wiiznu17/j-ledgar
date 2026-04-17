package com.jledger.core.service;

import com.jledger.core.domain.PaymentTransaction;
import com.jledger.core.dto.PaymentWebhookRequest;
import com.jledger.core.dto.TransferRequest;
import com.jledger.core.repository.PaymentTransactionRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PaymentService.class);
    private static final UUID SYSTEM_BANK_ACCOUNT_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");
    private static final String DEFAULT_CURRENCY = "THB";

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final TransferService transferService;

    @Transactional
    public void processWebhook(PaymentWebhookRequest request) {
        // 1. Mock Signature Verification
        if (request.signature() == null || request.signature().isBlank()) {
            throw new IllegalArgumentException("Invalid signature");
        }

        // 2. Find PaymentTransaction
        PaymentTransaction payment = paymentTransactionRepository.findByReferenceId(request.reference_id())
                .orElseThrow(() -> new IllegalArgumentException("Payment not found for reference: " + request.reference_id()));

        // 3. Handle Idempotency
        if (payment.getStatus() != PaymentTransaction.Status.PENDING) {
            LOGGER.info("Payment reference {} already processed with status {}", request.reference_id(), payment.getStatus());
            return;
        }

        // 4. Update Status based on Webhook
        if ("SUCCESS".equalsIgnoreCase(request.status())) {
            settlePayment(payment);
            payment.setStatus(PaymentTransaction.Status.SUCCESS);
        } else {
            payment.setStatus(PaymentTransaction.Status.FAILED);
        }

        paymentTransactionRepository.save(payment);
        LOGGER.info("Payment reference {} updated to {}", request.reference_id(), payment.getStatus());
    }

    @Transactional
    public PaymentTransaction createPayment(com.jledger.core.dto.PaymentCreateRequest request) {
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
            // Debit: System, Credit: User
            TransferRequest transferRequest = new TransferRequest(
                    SYSTEM_BANK_ACCOUNT_ID,
                    payment.getAccountId(),
                    payment.getAmount(),
                    DEFAULT_CURRENCY
            );
            
            // Use reference_id as idempotency key for the ledger transfer to ensure one-to-one mapping
            transferService.executeTransfer("PAY-" + payment.getReferenceId(), transferRequest);
        } else if (payment.getType() == PaymentTransaction.Type.WITHDRAW) {
            // Withdrawal logic would be: Debit User, Credit System
            // (Implementation skipped for now as per blueprint prioritization)
            LOGGER.warn("Withdrawal settlement not yet implemented via TransferService");
        }
    }
}
