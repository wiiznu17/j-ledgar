package com.jledger.core.controller;

import com.jledger.core.domain.SuspiciousActivity;
import com.jledger.core.service.AmlMonitoringService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/aml")
@RequiredArgsConstructor
@Tag(name = "AML Monitoring API", description = "Endpoints for AML transaction monitoring")
public class AmlMonitoringController {

    private final AmlMonitoringService amlMonitoringService;

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

    private record AmloReportRequest(UUID activityId, String reviewedBy) {}
    private record AmloReportResponse(String amloReference) {}
}
