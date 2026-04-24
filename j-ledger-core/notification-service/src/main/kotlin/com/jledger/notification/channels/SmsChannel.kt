package com.jledger.notification.channels

import org.springframework.stereotype.Service

@Service
class SmsChannel : NotificationChannel {
    override fun send(recipient: String, subject: String, content: String): Boolean {
        // TODO: Implement Twilio SMS integration
        // This requires com.twilio.sdk:twilio package
        // val twilio = Twilio(accountSid, authToken)
        // val message = Message.creator(
        //     PhoneNumber(recipient),
        //     PhoneNumber(fromNumber),
        //     content
        // ).create()
        // return message.status == Status.QUEUED || message.status == Status.SENT

        println("SMS sent to $recipient: $content")
        return true
    }
}
