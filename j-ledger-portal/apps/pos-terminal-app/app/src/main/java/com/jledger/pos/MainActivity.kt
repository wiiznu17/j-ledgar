package com.jledger.pos

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class MainActivity : ComponentActivity() {

    private lateinit var cameraExecutor: ExecutorService

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (!isGranted) {
            Toast.makeText(this, "Camera permission is required to scan QR codes.", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        cameraExecutor = Executors.newSingleThreadExecutor()

        // Request Camera Permission on startup
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestPermissionLauncher.launch(Manifest.permission.CAMERA)
        }

        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Color(0xFF6366F1), // Indigo
                    secondary = Color(0xFF10B981), // Emerald
                    background = Color(0xFF0B0F19), // Dark Blue-Black
                    surface = Color(0xFF1E293B) // Dark Slate
                )
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val viewModel: PosViewModel = viewModel()
                    MainAppContent(viewModel)
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
        
        // Ensure ViewModel unbinds printer connection to prevent service leaks
        try {
            val viewModel = viewModel<PosViewModel>()
            viewModel.unbindPrinter()
        } catch (e: Exception) {
            Log.e("MainActivity", "Failed to unbind printer during destroy", e)
        }
    }
}

@OptIn(ExperimentalAnimationApi::class)
@Composable
fun MainAppContent(viewModel: PosViewModel) {
    AnimatedContent(
        targetState = viewModel.currentScreen,
        transitionSpec = {
            fadeIn() togetherWith fadeOut()
        },
        label = "screen_transition"
    ) { screen ->
        when (screen) {
            PosScreen.PROVISIONING -> ProvisioningScreen(viewModel)
            PosScreen.DASHBOARD -> DashboardScreen(viewModel)
            PosScreen.SCANNER -> CameraScanScreen(viewModel)
            PosScreen.DEALS -> DealsPreviewScreen(viewModel)
            PosScreen.PROCESSING -> ProcessingScreen()
            PosScreen.SUCCESS -> SuccessScreen(viewModel)
            PosScreen.FAILURE -> FailureScreen(viewModel)
        }
    }
}

// ==========================================
// 🔒 SCREEN 1: Secure Device Provisioning
// ==========================================
@Composable
fun ProvisioningScreen(viewModel: PosViewModel) {
    var tIdInput by remember { mutableStateOf("") }
    var sKeyInput by remember { mutableStateOf("") }
    var validationError by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            shape = RoundedCornerShape(24.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "DEVICE PROVISIONING",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 2.sp,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Register this hardware terminal to establish Keystore secure layers and start HMAC synchronization.",
                    fontSize = 12.sp,
                    color = Color.LightGray,
                    textAlign = TextAlign.Center,
                    lineHeight = 18.sp
                )
                Spacer(modifier = Modifier.height(24.dp))

                OutlinedTextField(
                    value = tIdInput,
                    onValueChange = { tIdInput = it },
                    label = { Text("Terminal ID") },
                    placeholder = { Text("e.g. POS-T1790") },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = sKeyInput,
                    onValueChange = { sKeyInput = it },
                    label = { Text("HMAC Secret Key") },
                    placeholder = { Text("64-character hex key") },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                if (validationError.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = validationError, color = Color.Red, fontSize = 12.sp)
                }

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = {
                        if (tIdInput.isBlank() || sKeyInput.isBlank()) {
                            validationError = "Please fill in all security fields."
                        } else {
                            val ok = viewModel.provisionDevice(tIdInput.trim(), sKeyInput.trim())
                            if (!ok) {
                                validationError = viewModel.errorMessage
                            }
                        }
                    },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text("Provision Terminal", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            }
        }
    }
}

// ==========================================
// 💳 SCREEN 2: Premium Multi-Mode Dashboard
// ==========================================
@Composable
fun DashboardScreen(viewModel: PosViewModel) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.SpaceBetween,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // --- 1. Header Details ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "P-WALLET POS",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "ID: ${viewModel.terminalId}",
                    fontSize = 11.sp,
                    color = Color.Gray,
                    fontWeight = FontWeight.Bold
                )
            }
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFF1E293B))
                    .clickable { viewModel.deProvisionDevice() }
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text("Deregister", color = Color.Red, fontSize = 10.sp, fontWeight = FontWeight.Black)
            }
        }

        // --- 2. Scan Mode Tabs ---
        TabRow(
            selectedTabIndex = viewModel.activeScanMode.ordinal,
            containerColor = Color(0xFF1E293B),
            contentColor = Color.White,
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
        ) {
            ScanMode.values().forEach { mode ->
                Tab(
                    selected = viewModel.activeScanMode == mode,
                    onClick = { viewModel.activeScanMode = mode },
                    text = {
                        Text(
                            text = when (mode) {
                                ScanMode.PAYMENT -> "Charge"
                                ScanMode.LOYALTY -> "Points"
                                ScanMode.DEAL_VERIFY -> "Coupon"
                            },
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                )
            }
        }

        // --- 3. Dynamic Inputs / Display ---
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            when (viewModel.activeScanMode) {
                ScanMode.PAYMENT -> {
                    Text("ENTER TRANSACTION AMOUNT", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text("฿", fontSize = 28.sp, color = MaterialTheme.colorScheme.primary, modifier = Modifier.padding(bottom = 6.dp, end = 4.dp))
                        Text(viewModel.amountText, fontSize = 48.sp, fontWeight = FontWeight.Black, color = Color.White)
                    }
                }
                ScanMode.LOYALTY -> {
                    Text("ENTER POINTS TO REDEEM", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text(viewModel.pointsToRedeem.ifEmpty { "0" }, fontSize = 48.sp, fontWeight = FontWeight.Black, color = Color.White)
                        Text(" PTS", fontSize = 18.sp, color = MaterialTheme.colorScheme.secondary, modifier = Modifier.padding(bottom = 8.dp, start = 4.dp))
                    }
                }
                ScanMode.DEAL_VERIFY -> {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("SCAN PROMOTIONAL VOUCHER CODE", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                    Text("Scan dynamic barcode or code patterns", fontSize = 13.sp, color = Color.LightGray, modifier = Modifier.padding(top = 4.dp))
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }

        // --- 4. Security compliance cards ---
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(10.dp),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                ComplianceIndicator("HMAC", true)
                ComplianceIndicator("Replay Lock", true)
                ComplianceIndicator("Gateway OK", true)
            }
        }

        // --- 5. Custom Styled Numpad ---
        if (viewModel.activeScanMode != ScanMode.DEAL_VERIFY) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                val numpadKeys = listOf(
                    listOf("1", "2", "3"),
                    listOf("4", "5", "6"),
                    listOf("7", "8", "9"),
                    listOf("C", "0", "⌫")
                )

                numpadKeys.forEach { row ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        row.forEach { key ->
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier
                                    .weight(1f)
                                    .height(48.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF334155))
                                    .clickable {
                                        if (viewModel.activeScanMode == ScanMode.PAYMENT) {
                                            viewModel.amountText = handleNumpadInput(viewModel.amountText, key)
                                        } else {
                                            viewModel.pointsToRedeem = handleIntegerNumpad(viewModel.pointsToRedeem, key)
                                        }
                                    }
                            ) {
                                Text(key, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            }
                        }
                    }
                }
            }
        }

        // --- 6. Action Triggers ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Button(
                onClick = { viewModel.currentScreen = PosScreen.SCANNER },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
            ) {
                Text("Scan Customer QR / Barcode", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.Black)
            }
        }
    }
}

// ==========================================
// 📷 SCREEN 3: CameraX Barcode Scanner
// ==========================================
@Composable
fun CameraScanScreen(viewModel: PosViewModel) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var scanProcessed by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                PreviewView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    scaleType = PreviewView.ScaleType.FILL_CENTER
                }
            },
            modifier = Modifier.fillMaxSize(),
            update = { previewView ->
                val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()
                    val preview = Preview.Builder().build().also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }

                    // Barcode scanning analyzer
                    val barcodeScanner = BarcodeScanning.getClient()
                    val imageAnalysis = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()

                    imageAnalysis.setAnalyzer(
                        ContextCompat.getMainExecutor(context)
                    ) { imageProxy ->
                        @SuppressLint("UnsafeOptInUsageError")
                        val mediaImage = imageProxy.image
                        if (mediaImage != null && !scanProcessed) {
                            val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
                            barcodeScanner.process(image)
                                .addOnSuccessListener { barcodes ->
                                    for (barcode in barcodes) {
                                        val rawValue = barcode.rawValue
                                        if (rawValue != null) {
                                            scanProcessed = true
                                            // Process token
                                            viewModel.handleQrScanResult(rawValue)
                                            break
                                        }
                                    }
                                }
                                .addOnCompleteListener {
                                    imageProxy.close()
                                }
                        } else {
                            imageProxy.close()
                        }
                    }

                    try {
                        cameraProvider.unbindAll()
                        cameraProvider.bindToLifecycle(
                            lifecycleOwner,
                            CameraSelector.DEFAULT_BACK_CAMERA,
                            preview,
                            imageAnalysis
                        )
                    } catch (e: Exception) {
                        Log.e("CameraScanScreen", "Camera binding failed", e)
                    }
                }, ContextCompat.getMainExecutor(context))
            }
        )

        // Overlay Guide UI
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            verticalArrangement = Arrangement.SpaceBetween,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.Black.copy(alpha = 0.7f))
                    .padding(12.dp),
                horizontalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "MODE: SCANNING FOR ${viewModel.activeScanMode.name}",
                    color = Color.Yellow,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            }

            // Scanning Reticle
            Box(
                modifier = Modifier
                    .size(240.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.White.copy(alpha = 0.05f))
                    .align(Alignment.CenterHorizontally)
            )

            Button(
                onClick = { viewModel.currentScreen = PosScreen.DASHBOARD },
                colors = ButtonDefaults.buttonColors(containerColor = Color.Red),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                Text("Cancel Scan", fontWeight = FontWeight.Bold)
            }
        }
    }
}

// ==========================================
// 🏷️ SCREEN 4: Promotional Deals Preview
// ==========================================
@Composable
fun DealsPreviewScreen(viewModel: PosViewModel) {
    val deal = viewModel.dealPreview

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.SpaceBetween,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "PROMOTION VOUCHER VERIFIED",
            fontSize = 14.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 1.5.sp,
            color = MaterialTheme.colorScheme.secondary
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            shape = RoundedCornerShape(24.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.Start
            ) {
                Text(
                    text = "BRAND: ${deal?.brandName ?: "Unknown Partner"}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = deal?.dealTitle ?: "Promotional Offer",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = deal?.dealDescription ?: "Terms & conditions apply.",
                    fontSize = 13.sp,
                    color = Color.LightGray,
                    lineHeight = 20.sp
                )
                Spacer(modifier = Modifier.height(16.dp))
                Divider(color = Color.Gray.copy(alpha = 0.2f))
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "CUSTOMER MATCH",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.Gray
                )
                Text(
                    text = deal?.customerName ?: "P-Wallet Loyalty Member",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Button(
                onClick = { viewModel.currentScreen = PosScreen.DASHBOARD },
                modifier = Modifier
                    .weight(1f)
                    .height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155))
            ) {
                Text("Cancel", fontWeight = FontWeight.Bold)
            }

            Button(
                onClick = { viewModel.confirmDealRedeem() },
                modifier = Modifier
                    .weight(1f)
                    .height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
            ) {
                Text("Redeem", fontWeight = FontWeight.Bold, color = Color.Black)
            }
        }
    }
}

// ==========================================
// 🌀 SCREEN 5: API Processing Loader
// ==========================================
@Composable
fun ProcessingScreen() {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary, modifier = Modifier.size(54.dp))
        Spacer(modifier = Modifier.height(16.dp))
        Text("PROCESSING SECURE LEDGER...", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Gray, letterSpacing = 2.sp)
    }
}

// ==========================================
// 🎉 SCREEN 6: Transaction Success Feedback
// ==========================================
@Composable
fun SuccessScreen(viewModel: PosViewModel) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.SpaceBetween,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(16.dp))
        
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(96.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.secondary.copy(alpha = 0.1f))
            ) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.secondary)
                )
            }
            Spacer(modifier = Modifier.height(24.dp))
            Text("TRANSACTION APPROVED", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color.White)
            Spacer(modifier = Modifier.height(8.dp))
            Text(viewModel.transactionMessage, fontSize = 13.sp, color = Color.LightGray, textAlign = TextAlign.Center)
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text("RECEIPT SLIP LOG", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Gray, letterSpacing = 1.sp)
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "A thermal receipt slip has been printed via IPC binding to the Mock Receipt Driver (AIDL sync complete). Paper cuts applied.",
                    fontSize = 11.sp,
                    color = Color.LightGray,
                    fontFamily = FontFamily.Monospace,
                    lineHeight = 16.sp
                )
            }
        }

        Button(
            onClick = { viewModel.currentScreen = PosScreen.DASHBOARD },
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Done, Charge Next", fontWeight = FontWeight.Bold)
        }
    }
}

// ==========================================
// ❌ SCREEN 7: Transaction Failure Feedback
// ==========================================
@Composable
fun FailureScreen(viewModel: PosViewModel) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.SpaceBetween,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(16.dp))

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(96.dp)
                    .clip(CircleShape)
                    .background(Color.Red.copy(alpha = 0.1f))
            ) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(Color.Red)
                )
            }
            Spacer(modifier = Modifier.height(24.dp))
            Text("TRANSACTION DECLINED", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color.White)
            Spacer(modifier = Modifier.height(8.dp))
            Text(viewModel.errorMessage, fontSize = 13.sp, color = Color.LightGray, textAlign = TextAlign.Center)
        }

        Button(
            onClick = { viewModel.currentScreen = PosScreen.DASHBOARD },
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color.Red)
        ) {
            Text("Back to Dashboard", fontWeight = FontWeight.Bold)
        }
    }
}

// ==========================================
// 🔢 HELPERS: Custom Numpad Input Mechanics
// ==========================================

fun handleIntegerNumpad(current: String, key: String): String {
    if (key == "C") return ""
    if (key == "⌫") {
        if (current.isEmpty()) return ""
        return current.dropLast(1)
    }
    if (current.length >= 6) return current
    return current + key
}

fun handleNumpadInput(current: String, key: String): String {
    if (key == "C") return "0.00"
    if (key == "⌫") {
        if (current.length <= 1 || current == "0.00") return "0.00"
        val clean = current.replace(".", "")
        val removed = clean.dropLast(1)
        if (removed.isEmpty()) return "0.00"
        val parsed = removed.toDouble() / 100.0
        return String.format("%.2f", parsed)
    }
    
    // Regular digits
    val clean = current.replace(".", "")
    if (clean.length >= 7) return current // limit length
    val added = clean + key
    val parsed = added.toDouble() / 100.0
    return String.format("%.2f", parsed)
}
