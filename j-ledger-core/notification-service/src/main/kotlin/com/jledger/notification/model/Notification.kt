package com.jledger.notification.model

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "notifications")
data class Notification(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    val userId: String,

    @Column(nullable = false, length = 50)
    val type: NotificationType,

    @Column(nullable = false, length = 200)
    val title: String,

    @Column(nullable = false, length = 1000)
    val message: String,

    @Column(nullable = false)
    val isRead: Boolean = false,

    @Column(nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column
    val readAt: LocalDateTime? = null
)

enum class NotificationType {
    TRANSACTION,
    SECURITY,
    PROMOTION
}
