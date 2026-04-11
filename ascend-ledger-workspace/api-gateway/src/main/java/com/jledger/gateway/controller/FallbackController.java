package com.jledger.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @RequestMapping("/core-service")
    public Mono<ResponseEntity<Map<String, String>>> coreServiceFallback() {
        Map<String, String> fallbackResponse = Map.of(
                "status", "DOWNSTREAM_ERROR",
                "message", "Core service is currently unavailable. Please try again later."
        );
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(fallbackResponse));
    }
}
