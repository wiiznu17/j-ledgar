package com.jledger.finance.service.compliance.impl;

import com.jledger.finance.domain.entity.Account;
import com.jledger.finance.domain.enums.KycStatus;
import com.jledger.finance.exception.ConflictException;
import com.jledger.finance.repository.ledger.AccountRepository;
import com.jledger.finance.service.compliance.KycComplianceService;

import java.time.ZonedDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KycComplianceServiceImpl implements KycComplianceService {

    private final AccountRepository accountRepository;

    private static final int KYC_REVIEW_DAYS = 365;

    @Override
    public void checkKycCompliance(UUID accountId) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new ConflictException("Account not found"));

        if (account.getKycStatus() != KycStatus.APPROVED) {
            throw new ConflictException(String.format(
                "KYC verification required for transfer. Current status: %s",
                account.getKycStatus()
            ));
        }

        if (account.getKycReviewDate() != null) {
            ZonedDateTime reviewExpiry = account.getKycReviewDate().plusDays(KYC_REVIEW_DAYS);
            if (ZonedDateTime.now().isAfter(reviewExpiry)) {
                throw new ConflictException(
                    "KYC review expired. Please complete KYC review before transferring."
                );
            }
        }
    }

    @Override
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
