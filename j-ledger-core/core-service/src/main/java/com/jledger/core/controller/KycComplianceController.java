package com.jledger.core.controller;

import com.jledger.core.domain.KycStatus;
import com.jledger.core.service.KycComplianceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
    public ResponseEntity<Void> updateKycStatus(@RequestBody UpdateKycStatusRequest request) {
        kycComplianceService.updateKycStatus(request.accountId(), request.kycStatus());
        return ResponseEntity.ok().build();
    }

    private record UpdateKycStatusRequest(UUID accountId, KycStatus kycStatus) {}
}
