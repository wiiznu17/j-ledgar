package com.jledger.notification.channels

interface NotificationChannel {
    fun send(recipient: String, subject: String, content: String): Boolean
}

data class SmsNotification(
    val phoneNumber: String,
    val message: String
)

data class EmailNotification(
    val to: String,
    val subject: String,
    val htmlContent: String
)

data class PushNotification(
    val deviceToken: String,
    val title: String,
    val body: String,
    val data: Map<String, String> = emptyMap()
)
