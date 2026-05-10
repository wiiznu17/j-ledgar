package com.jledger.finance.controller;

import com.jledger.finance.domain.SuspiciousActivityStatus;
import com.jledger.finance.domain.entity.SuspiciousActivity;
import com.jledger.finance.service.AmlMonitoringService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/aml")
@RequiredArgsConstructor
@Tag(name = "AML Monitoring API", description = "Endpoints for AML transaction monitoring")
public class AmlMonitoringController {

    private final AmlMonitoringService amlMonitoringService;

    @GetMapping("/suspicious-activities")
    @Operation(summary = "List all suspicious activities", description = "Retrieves all suspicious activities in the system with pagination")
    public ResponseEntity<org.springframework.data.domain.Page<SuspiciousActivity>> getAllSuspiciousActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(amlMonitoringService.getAllSuspiciousActivities(
                org.springframework.data.domain.PageRequest.of(page, size)));
    }

    @GetMapping("/suspicious-activities/{userId}")
    @Operation(summary = "Get suspicious activities for user", description = "Retrieves all suspicious activities for a given user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Suspicious activities retrieved"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<List<SuspiciousActivity>> getSuspiciousActivities(
            @Parameter(description = "User ID") @PathVariable UUID userId) {
        List<SuspiciousActivity> activities = amlMonitoringService.getSuspiciousActivities(userId);
        return ResponseEntity.ok(activities);
    }

    @PostMapping("/report-to-amlo")
    @Operation(summary = "Report suspicious activity to AMLO", description = "Marks suspicious activity as reported to AMLO")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Activity reported successfully"),
            @ApiResponse(responseCode = "404", description = "Activity not found")
    })
    public ResponseEntity<AmloReportResponse> reportToAmlo(
            @RequestBody AmloReportRequest request) {
        String amloReference = amlMonitoringService.reportSuspiciousActivityToAmlo(
            request.activityId(),
            request.reviewedBy()
        );
        return ResponseEntity.ok(new AmloReportResponse(amloReference));
    }

    @PutMapping("/suspicious-activities/{id}/status")
    @Operation(summary = "Update suspicious activity status", description = "Updates the status of a suspicious activity")
    public ResponseEntity<Void> updateSuspiciousActivityStatus(
            @PathVariable UUID id,
            @RequestBody UpdateStatusRequest request) {
        amlMonitoringService.updateSuspiciousActivityStatus(
            id,
            request.status(),
            request.reviewedBy(),
            request.description()
        );
        return ResponseEntity.ok().build();
    }

    private record UpdateStatusRequest(SuspiciousActivityStatus status, String reviewedBy, String description) {}
    private record AmloReportRequest(UUID activityId, String reviewedBy) {}
    private record AmloReportResponse(String amloReference) {}
}
