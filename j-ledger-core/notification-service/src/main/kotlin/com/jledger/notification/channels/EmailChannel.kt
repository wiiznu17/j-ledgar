package com.jledger.notification.channels

import org.springframework.stereotype.Service

@Service
class EmailChannel : NotificationChannel {
    override fun send(recipient: String, subject: String, content: String): Boolean {
        // TODO: Implement SendGrid/SES email integration
        // This requires com.sendgrid:sendgrid-java or AWS SDK for SES
        // val email = SendGridEmail.builder()
        //     .to(recipient)
        //     .subject(subject)
        //     .htmlContent(content)
        //     .build()
        // val response = sendGrid.send(email)
        // return response.statusCode == 202

        println("Email sent to $recipient: $subject")
        return true
    }
}
