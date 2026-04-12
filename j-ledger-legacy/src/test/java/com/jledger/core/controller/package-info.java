/**
 * Test package for J-Ledger controller-layer integration tests.
 *
 * <p>The {@code @NonNullApi} annotation mirrors Spring Data's own package-level
 * null-safety contract, eliminating "unchecked conversion to @NonNull" IDE
 * warnings that arise because Spring Data repository methods assume all
 * parameters and return values are non-null by default.
 */
@NonNullApi
package com.jledger.core.controller;

import org.springframework.lang.NonNullApi;
