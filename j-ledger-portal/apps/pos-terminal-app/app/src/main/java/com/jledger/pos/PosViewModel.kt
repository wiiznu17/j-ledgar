package com.jledger.pos

import android.app.Application
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import android.util.Log
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.jledger.pos.network.*
import com.jledger.pos.security.SecureStorage
import com.jledger.pos.service.PrinterMockDriverService
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Screen states representing navigation pages inside the Jetpack Compose UI.
 */
enum class PosScreen {
    PROVISIONING,
    DASHBOARD,
    SCANNER,
    DEALS,
    PROCESSING,
    SUCCESS,
    FAILURE
}

/**
 * Modes specifying how the scanned barcode/QR payload should be processed.
 */
enum class ScanMode {
    PAYMENT,       // Scanning dynamic customer pay token
    LOYALTY,       // Scanning customer identity QR to deduct/redeem points
    DEAL_VERIFY    // Scanning deal coupon code to preview/verify
}

class PosViewModel(application: Application) : AndroidViewModel(application) {

    private val TAG = "PosViewModel"
    private val secureStorage = SecureStorage(application)
    
    // --- Compose-backed Screen States ---
    var currentScreen by mutableStateOf(PosScreen.PROVISIONING)
    var activeScanMode by mutableStateOf(ScanMode.PAYMENT)
    var isProvisioned by mutableStateOf(false)
    
    // Amount & Points inputs
    var amountText by mutableStateOf("0.00")
    var pointsToRedeem by mutableStateOf("")
    
    // Loaded merchant terminal details
    var terminalId by mutableStateOf("")
    
    // API results
    var transactionReference by mutableStateOf("")
    var transactionMessage by mutableStateOf("")
    var pointBalanceDeducted by mutableStateOf(0)
    var remainingPointsBalance by mutableStateOf(0)
    
    // Deal Verify Preview States
    var dealCode by mutableStateOf("")
    var dealPreview by mutableStateOf<DealVerifyResponse?>(null)
    
    // Processing loaders & errors
    var loadingState by mutableStateOf(false)
    var errorMessage by mutableStateOf("")

    // --- IPC Thermal Printer Service Binding ---
    private var printerService: IPrinterService? = null
    private var isPrinterBound = false

    private val printerConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            Log.i(TAG, "IPC: Thermal Printer Driver bound successfully.")
            printerService = IPrinterService.Stub.asInterface(service)
            isPrinterBound = true
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            Log.w(TAG, "IPC: Thermal Printer Driver disconnected.")
            printerService = null
            isPrinterBound = false
        }
    }

    init {
        // Initialize network client
        ApiClient.initialize(application)
        
        // Check Keystore Provisioning Status
        isProvisioned = secureStorage.isProvisioned()
        terminalId = secureStorage.getTerminalId() ?: ""
        
        currentScreen = if (isProvisioned) PosScreen.DASHBOARD else PosScreen.PROVISIONING
        
        // Bind to background printer service IPC
        bindPrinterService()
    }

    private fun bindPrinterService() {
        val intent = Intent(getApplication(), PrinterMockDriverService::class.java)
        getApplication<Application>().bindService(intent, printerConnection, Context.BIND_AUTO_CREATE)
    }

    fun unbindPrinter() {
        if (isPrinterBound) {
            getApplication<Application>().unbindService(printerConnection)
            isPrinterBound = false
        }
    }

    // --- Device Provisioning Operations ---
    
    fun provisionDevice(tId: String, sKey: String): Boolean {
        if (tId.isBlank() || sKey.isBlank()) {
            errorMessage = "Terminal ID and Secret Key cannot be empty."
            return false
        }
        
        secureStorage.saveCredentials(tId, sKey)
        terminalId = tId
        isProvisioned = true
        errorMessage = ""
        currentScreen = PosScreen.DASHBOARD
        return true
    }

    fun deProvisionDevice() {
        secureStorage.clearCredentials()
        terminalId = ""
        isProvisioned = false
        amountText = "0.00"
        pointsToRedeem = ""
        currentScreen = PosScreen.PROVISIONING
    }

    // --- Financial POS API Operations ---

    fun handleQrScanResult(qrPayload: String) {
        viewModelScope.launch {
            currentScreen = PosScreen.PROCESSING
            errorMessage = ""
            
            try {
                val service = ApiClient.getService()
                
                when (activeScanMode) {
                    ScanMode.PAYMENT -> {
                        val amount = amountText.toDoubleOrNull() ?: 0.0
                        if (amount <= 0) {
                            throw IllegalArgumentException("Invalid charge amount.")
                        }
                        
                        val response = service.processPayment(
                            TerminalPaymentRequest(amount = amount, customerToken = qrPayload)
                        )
                        
                        if (response.success) {
                            transactionReference = response.transactionId ?: response.reference ?: "REF-N/A"
                            transactionMessage = response.message ?: "Payment Charged Successfully."
                            currentScreen = PosScreen.SUCCESS
                            
                            // Trigger receipt printer!
                            printReceipt(
                                title = "SALE SLIP (SUCCESS)",
                                details = listOf(
                                    "REF ID: $transactionReference",
                                    "AMOUNT: ฿${String.format("%.2f", amount)}",
                                    "STATUS: COMPLIANT CARD APPROVED"
                                )
                            )
                        } else {
                            errorMessage = response.message ?: "Payment Declined by Bank Gateway."
                            currentScreen = PosScreen.FAILURE
                        }
                    }
                    
                    ScanMode.LOYALTY -> {
                        val points = pointsToRedeem.toIntOrNull() ?: 0
                        if (points <= 0) {
                            throw IllegalArgumentException("Invalid loyalty points amount.")
                        }
                        
                        val response = service.processRedemption(
                            TerminalRedeemRequest(amountPoints = points, customerToken = qrPayload)
                        )
                        
                        if (response.success) {
                            transactionReference = response.referenceId ?: "REF-N/A"
                            pointBalanceDeducted = response.pointsDeducted ?: points
                            remainingPointsBalance = response.pointBalance ?: 0
                            transactionMessage = "Redeemed $pointBalanceDeducted points."
                            currentScreen = PosScreen.SUCCESS
                            
                            printReceipt(
                                title = "LOYALTY REDEMPTION",
                                details = listOf(
                                    "REF ID: $transactionReference",
                                    "REDEEMED: $pointBalanceDeducted POINTS",
                                    "REMAINING BAL: $remainingPointsBalance POINTS"
                                )
                            )
                        } else {
                            errorMessage = response.message ?: "Redemption Rejected (Insufficient Points)."
                            currentScreen = PosScreen.FAILURE
                        }
                    }
                    
                    ScanMode.DEAL_VERIFY -> {
                        dealCode = qrPayload
                        val response = service.verifyDealCode(qrPayload)
                        
                        if (response.isValid) {
                            dealPreview = response
                            currentScreen = PosScreen.DEALS // Navigate to deal verification/preview screen
                        } else {
                            errorMessage = response.message ?: "Invalid or Expired Deal Voucher."
                            currentScreen = PosScreen.FAILURE
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "API Transaction Failed", e)
                errorMessage = e.message ?: "Network Gateway Connection Refused."
                currentScreen = PosScreen.FAILURE
            }
        }
    }

    /**
     * Confirms the locked voucher redemption on the backend.
     */
    fun confirmDealRedeem() {
        if (dealCode.isBlank()) return
        
        viewModelScope.launch {
            currentScreen = PosScreen.PROCESSING
            errorMessage = ""
            
            try {
                val service = ApiClient.getService()
                val response = service.useDealCode(dealCode)
                
                if (response.success) {
                    transactionReference = response.transactionId ?: "DEAL-N/A"
                    transactionMessage = response.message ?: "Voucher code applied successfully."
                    currentScreen = PosScreen.SUCCESS
                    
                    // Trigger thermal printer IPC
                    printReceipt(
                        title = "COUPON VOUCHER REDEEMED",
                        details = listOf(
                            "REF ID: $transactionReference",
                            "BRAND: ${dealPreview?.brandName ?: "N/A"}",
                            "TITLE: ${dealPreview?.dealTitle ?: "N/A"}",
                            "CUSTOMER: ${dealPreview?.customerName ?: "N/A"}"
                        )
                    )
                } else {
                    errorMessage = response.message ?: "Voucher code usage rejected."
                    currentScreen = PosScreen.FAILURE
                }
            } catch (e: Exception) {
                Log.e(TAG, "Coupon usage failed", e)
                errorMessage = e.message ?: "Network connection refused."
                currentScreen = PosScreen.FAILURE
            }
        }
    }

    // --- IPC Thermal Print Formatting Engine ---
    
    private fun printReceipt(title: String, details: List<String>) {
        if (!isPrinterBound || printerService == null) {
            Log.e(TAG, "IPC Error: Cannot print receipt. Printer driver service is not bound.")
            return
        }

        try {
            val status = printerService!!.printerStatus
            if (status != 0) {
                Log.w(TAG, "Printer warning: Driver returned status $status. Print job may fail.")
            }

            val format = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
            val dateStr = format.format(Date())

            val receipt = StringBuilder()
            receipt.append("================================\n")
            receipt.append("        J-LEDGER FINTECH        \n")
            receipt.append("      SMART POS TRANSACTION     \n")
            receipt.append("================================\n")
            receipt.append("DATE: $dateStr\n")
            receipt.append("TERMINAL ID: $terminalId\n")
            receipt.append("RECEIPT TYPE: $title\n")
            receipt.append("--------------------------------\n")
            for (line in details) {
                receipt.append("$line\n")
            }
            receipt.append("--------------------------------\n")
            receipt.append("      COMPLIANT LEDGER SYNC      \n")
            receipt.append("   THANK YOU FOR YOUR BUSINESS  \n")
            receipt.append("================================\n\n\n")

            // Send formatted receipt text via IPC Binder
            printerService!!.printText(receipt.toString())
            
            // Cut the receipt paper
            printerService!!.cutPaper()
            
        } catch (e: Exception) {
            Log.e(TAG, "IPC Binder print request failed", e)
        }
    }
}
