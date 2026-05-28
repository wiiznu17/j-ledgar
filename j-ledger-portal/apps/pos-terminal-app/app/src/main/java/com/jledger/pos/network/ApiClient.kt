package com.jledger.pos.network

import android.content.Context
import com.jledger.pos.security.HmacInterceptor
import com.jledger.pos.security.SecureStorage
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Singleton configuration layer that instantiates the Retrofit 2 Client.
 * Automatically wires OkHttpClient with HMAC security credentials.
 */
object ApiClient {

    private const val BASE_URL = "https://api.potayyr.site/"

    private var posApiService: PosApiService? = null

    /**
     * Initializes the API Client wiring the SecureStorage and HmacInterceptor.
     */
    fun initialize(context: Context) {
        if (posApiService != null) return

        val secureStorage = SecureStorage(context)
        val hmacInterceptor = HmacInterceptor(secureStorage)

        // Standard logging interceptor to view transaction network payloads
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        // OkHttpClient with 10s connection and 30s read/write timeouts (matching Nginx global limits)
        val okHttpClient = OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(hmacInterceptor)
            .addInterceptor(loggingInterceptor)
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        posApiService = retrofit.create(PosApiService::class.java)
    }

    /**
     * Returns the initialized API service instance.
     */
    fun getService(): PosApiService {
        return posApiService ?: throw IllegalStateException("ApiClient not initialized. Call initialize(context) first.")
    }
}
