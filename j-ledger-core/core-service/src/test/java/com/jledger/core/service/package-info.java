/**
 * Test package for J-Ledger Plus service-layer integration tests (Phase 5).
 *
 * <p>The {@code @NonNullApi} annotation mirrors Spring Data's own package-level
 * null-safety contract, eliminating "unchecked conversion to @NonNull" IDE
 * warnings that arise because Spring Data repository methods assume all
 * parameters and return values are non-null by default.
 */
@NonNullApi
package com.jledger.core.service;

import org.springframework.lang.NonNullApi;
