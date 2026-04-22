package com.jledger.core.service;

import com.jledger.core.domain.Account;
import com.jledger.core.domain.KycStatus;
import com.jledger.core.exception.ConflictException;
import com.jledger.core.repository.AccountRepository;
import java.time.ZonedDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KycComplianceService {

    private final AccountRepository accountRepository;

    private static final int KYC_REVIEW_DAYS = 365; // Review annually

    public void checkKycCompliance(UUID accountId) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new ConflictException("Account not found"));

        // Check KYC status
        if (account.getKycStatus() != KycStatus.APPROVED) {
            throw new ConflictException(String.format(
                "KYC verification required for transfer. Current status: %s",
                account.getKycStatus()
            ));
        }

        // Check KYC review date
        if (account.getKycReviewDate() != null) {
            ZonedDateTime reviewExpiry = account.getKycReviewDate().plusDays(KYC_REVIEW_DAYS);
            if (ZonedDateTime.now().isAfter(reviewExpiry)) {
                throw new ConflictException(
                    "KYC review expired. Please complete KYC review before transferring."
                );
            }
        }
    }

    public void updateKycStatus(UUID accountId, KycStatus kycStatus) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new ConflictException("Account not found"));

        account.setKycStatus(kycStatus);
        if (kycStatus == KycStatus.APPROVED) {
            account.setKycReviewDate(ZonedDateTime.now());
        }

        accountRepository.save(account);
        log.info("KYC status updated: accountId={}, status={}", accountId, kycStatus);
    }
}
