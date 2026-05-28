package com.jledger.pos.network

import com.google.gson.annotations.SerializedName

// --- Payment DTOs ---

data class TerminalPaymentRequest(
    @SerializedName("amount") val amount: Double,
    @SerializedName("customerToken") val customerToken: String?,
    @SerializedName("currency") val currency: String = "THB"
)

data class TerminalPaymentResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("transactionId") val transactionId: String?,
    @SerializedName("message") val message: String?,
    @SerializedName("reference") val reference: String?
)

// --- Loyalty Points DTOs ---

data class TerminalRedeemRequest(
    @SerializedName("amountPoints") val amountPoints: Int,
    @SerializedName("customerToken") val customerToken: String
)

data class TerminalRedeemResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("referenceId") val referenceId: String?,
    @SerializedName("pointsDeducted") val pointsDeducted: Int?,
    @SerializedName("pointBalance") val pointBalance: Int?,
    @SerializedName("message") val message: String?
)

// --- Deal/Voucher Redemption DTOs ---

data class DealVerifyResponse(
    @SerializedName("isValid") val isValid: Boolean,
    @SerializedName("dealId") val dealId: String?,
    @SerializedName("brandName") val brandName: String?,
    @SerializedName("dealTitle") val dealTitle: String?,
    @SerializedName("dealDescription") val dealDescription: String?,
    @SerializedName("customerName") val customerName: String?,
    @SerializedName("message") val message: String?
)

data class DealUseResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String?,
    @SerializedName("transactionId") val transactionId: String?
)
