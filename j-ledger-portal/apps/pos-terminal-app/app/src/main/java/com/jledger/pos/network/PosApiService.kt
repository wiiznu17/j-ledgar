package com.jledger.pos.network

import retrofit2.http.*

/**
 * Retrofit Service Interface mapping to the secure J-Ledger Gateway APIs.
 */
interface PosApiService {

    /**
     * Phase 3: Processes POS terminal card/wallet split payments.
     */
    @POST("api/v1/terminal/payment")
    suspend fun processPayment(
        @Body request: TerminalPaymentRequest
    ): TerminalPaymentResponse

    /**
     * Phase 4: Processes Customer Loyalty Point redemptions.
     */
    @POST("api/v1/terminal/loyalty/redeem")
    suspend fun processRedemption(
        @Body request: TerminalRedeemRequest
    ): TerminalRedeemResponse

    /**
     * Phase 4: Verifies and previews a promotional deal coupon before usage.
     */
    @GET("api/merchant/deals/redemptions/{code}/verify")
    suspend fun verifyDealCode(
        @Path("code") code: String
    ): DealVerifyResponse

    /**
     * Phase 4: Uses and locks a promotional deal coupon.
     */
    @POST("api/merchant/deals/redemptions/{code}/use")
    suspend fun useDealCode(
        @Path("code") code: String
    ): DealUseResponse
}
