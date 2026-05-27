package com.jledger.pos.service

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import com.jledger.pos.IPrinterService

/**
 * Background driver service for the thermal receipt printer.
 * Simulates IPC communication (Inter-Process Communication) typical on professional Smart Android POS Terminals (e.g. PAX, Verifone).
 */
class PrinterMockDriverService : Service() {

    private val TAG = "PrinterDriver"

    // Implementation of the AIDL interface
    private val binder = object : IPrinterService.Stub() {
        override fun getPrinterStatus(): Int {
            Log.d(TAG, "getPrinterStatus() called. Status: 0 (OK)")
            return 0 // Status 0 represents: Printer is Ready and OK
        }

        override fun printText(text: String?) {
            Log.d(TAG, "printText() received payload: \n====================\n$text\n====================")
        }

        override fun printBitmap(bitmapData: ByteArray?) {
            val size = bitmapData?.size ?: 0
            Log.d(TAG, "printBitmap() received logo/barcode image of size: $size bytes")
        }

        override fun cutPaper() {
            Log.d(TAG, "cutPaper() triggered. Slip cutter executed successfully.")
        }
    }

    override fun onBind(intent: Intent?): IBinder? {
        Log.i(TAG, "POS Application bound to PrinterMockDriverService")
        return binder
    }
}
