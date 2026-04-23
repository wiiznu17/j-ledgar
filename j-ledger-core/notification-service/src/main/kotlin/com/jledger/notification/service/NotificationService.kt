package com.jledger.notification.service

import com.jledger.notification.model.Notification
import com.jledger.notification.model.NotificationType
import com.jledger.notification.repository.NotificationRepository
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class NotificationService(private val notificationRepository: NotificationRepository) {

    fun createNotification(userId: String, type: NotificationType, title: String, message: String): Notification {
        val notification = Notification(
            userId = userId,
            type = type,
            title = title,
            message = message
        )
        return notificationRepository.save(notification)
    }

    fun getNotificationsByUserId(userId: String): List<Notification> {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
    }

    fun getUnreadNotificationsByUserId(userId: String): List<Notification> {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
    }

    fun markAsRead(notificationId: Long): Notification? {
        val notification = notificationRepository.findById(notificationId).orElse(null) ?: return null
        val updatedNotification = notification.copy(isRead = true, readAt = LocalDateTime.now())
        return notificationRepository.save(updatedNotification)
    }
}
