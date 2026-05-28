package com.jledger.pos.security

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys

/**
 * Handles hardware-level secure storage using Android Keystore and EncryptedSharedPreferences.
 * Used to store sensitive device credentials like the Terminal ID and HMAC secret key.
 */
class SecureStorage(context: Context) {

    private val sharedPrefs: SharedPreferences

    init {
        // Retrieve or create the primary master key backed by Android Keystore
        val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
        
        sharedPrefs = EncryptedSharedPreferences.create(
            "secure_pos_prefs",
            masterKeyAlias,
            context,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    /**
     * Saves the provisioned terminal credentials to secure storage.
     */
    fun saveCredentials(terminalId: String, secretKey: String) {
        sharedPrefs.edit().apply {
            putString(KEY_TERMINAL_ID, terminalId)
            putString(KEY_SECRET_KEY, secretKey)
            apply()
        }
    }

    /**
     * Retrieves the stored Terminal ID.
     */
    fun getTerminalId(): String? {
        return sharedPrefs.getString(KEY_TERMINAL_ID, null)
    }

    /**
     * Retrieves the stored HMAC Secret Key.
     */
    fun getSecretKey(): String? {
        return sharedPrefs.getString(KEY_SECRET_KEY, null)
    }

    /**
     * Returns true if both Terminal ID and Secret Key are provisioned.
     */
    fun isProvisioned(): Boolean {
        return getTerminalId() != null && getSecretKey() != null
    }

    /**
     * Clears credentials from secure storage (e.g. for de-provisioning).
     */
    fun clearCredentials() {
        sharedPrefs.edit().apply {
            remove(KEY_TERMINAL_ID)
            remove(KEY_SECRET_KEY)
            apply()
        }
    }

    companion object {
        private const val KEY_TERMINAL_ID = "terminal_id"
        private const val KEY_SECRET_KEY = "secret_key"
    }
}
