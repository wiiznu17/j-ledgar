package com.jledger.finance.service.compliance.impl;

import com.jledger.finance.domain.entity.Wallet;
import com.jledger.finance.domain.enums.WalletStatus;
import com.jledger.finance.repository.wallet.WalletRepository;
import com.jledger.finance.service.compliance.AccountFreezeService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class AccountFreezeServiceImpl implements AccountFreezeService {

    private final WalletRepository walletRepository;

    @Override
    @Transactional
    public Wallet freezeAccount(Long walletId, String reason, String frozenBy) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));

        if (WalletStatus.CLOSED == wallet.getStatus()) {
            throw new IllegalStateException("Cannot freeze a closed wallet");
        }

        if (WalletStatus.FROZEN == wallet.getStatus()) {
            log.warn("Wallet {} is already frozen", walletId);
            return wallet;
        }

        wallet.setStatus(WalletStatus.FROZEN);
        walletRepository.save(wallet);

        log.warn("Wallet {} frozen by {} for reason: {}", walletId, frozenBy, reason);

        return wallet;
    }

    @Override
    @Transactional
    public Wallet unfreezeAccount(Long walletId, String reason, String unfrozenBy) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));

        if (WalletStatus.CLOSED == wallet.getStatus()) {
            throw new IllegalStateException("Cannot unfreeze a closed wallet");
        }

        if (WalletStatus.ACTIVE == wallet.getStatus()) {
            log.warn("Wallet {} is already active", walletId);
            return wallet;
        }

        wallet.setStatus(WalletStatus.ACTIVE);
        walletRepository.save(wallet);

        log.info("Wallet {} unfrozen by {} for reason: {}", walletId, unfrozenBy, reason);

        return wallet;
    }

    @Override
    public boolean isAccountFrozen(Long walletId) {
        return walletRepository.findById(walletId)
                .map(wallet -> WalletStatus.FROZEN == wallet.getStatus())
                .orElse(false);
    }

    @Override
    @Transactional
    public Wallet freezeAccountDueToSuspiciousActivity(Long walletId, String suspiciousActivityId) {
        String reason = "Suspicious activity detected (ID: " + suspiciousActivityId + ")";
        return freezeAccount(walletId, reason, "AML_SYSTEM");
    }

    @Override
    @Transactional
    public Wallet unfreezeAccountAfterInvestigation(Long walletId, String clearedBy) {
        String reason = "Suspicious activity investigation completed and cleared";
        return unfreezeAccount(walletId, reason, clearedBy);
    }
}
