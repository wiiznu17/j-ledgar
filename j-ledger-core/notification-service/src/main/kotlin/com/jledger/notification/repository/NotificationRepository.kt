package com.jledger.notification.repository

import com.jledger.notification.model.Notification
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface NotificationRepository : JpaRepository<Notification, Long> {
    fun findByUserIdOrderByCreatedAtDesc(userId: String): List<Notification>
    fun findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId: String): List<Notification>
}
