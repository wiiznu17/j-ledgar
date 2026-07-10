package com.jledger.finance.service.compliance;

import com.jledger.finance.domain.enums.KycStatus;
import java.util.UUID;

public interface KycComplianceService {
    void checkKycCompliance(UUID accountId);
    void updateKycStatus(UUID accountId, KycStatus kycStatus);
}
