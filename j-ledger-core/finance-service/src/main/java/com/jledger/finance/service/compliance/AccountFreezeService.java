package com.jledger.finance.service.compliance;

import com.jledger.finance.domain.entity.Wallet;

public interface AccountFreezeService {
    Wallet freezeAccount(Long walletId, String reason, String frozenBy);
    Wallet unfreezeAccount(Long walletId, String reason, String unfrozenBy);
    boolean isAccountFrozen(Long walletId);
    Wallet freezeAccountDueToSuspiciousActivity(Long walletId, String suspiciousActivityId);
    Wallet unfreezeAccountAfterInvestigation(Long walletId, String clearedBy);
}
