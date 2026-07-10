package com.jledger.finance.controller.compliance;

import com.jledger.finance.domain.enums.KycStatus;
import com.jledger.finance.service.compliance.KycComplianceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/kyc")
@RequiredArgsConstructor
@Tag(name = "KYC Compliance API", description = "Endpoints for KYC compliance management")
public class KycComplianceController {

    private final KycComplianceService kycComplianceService;

    @PutMapping("/status")
    @Operation(summary = "Update KYC status", description = "Updates KYC status for an account")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "KYC status updated"),
            @ApiResponse(responseCode = "404", description = "Account not found")
    })
    public ResponseEntity<Void> updateKycStatus(@Valid @RequestBody UpdateKycStatusRequest request) {
        kycComplianceService.updateKycStatus(request.accountId(), request.kycStatus());
        return ResponseEntity.ok().build();
    }

    private record UpdateKycStatusRequest(
        @NotNull(message = "accountId is required")
        UUID accountId,

        @NotNull(message = "kycStatus is required")
        KycStatus kycStatus
    ) {}
}
