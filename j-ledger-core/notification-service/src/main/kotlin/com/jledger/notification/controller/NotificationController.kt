package com.jledger.notification.controller

import com.jledger.notification.model.Notification
import com.jledger.notification.model.NotificationType
import com.jledger.notification.service.NotificationService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notification API", description = "Endpoints for user notifications")
class NotificationController(private val notificationService: NotificationService) {

    @GetMapping("/{userId}")
    @Operation(summary = "Get notifications by user ID", description = "Returns all notifications for a specific user")
    fun getNotificationsByUserId(@PathVariable userId: String): ResponseEntity<List<Notification>> {
        val notifications = notificationService.getNotificationsByUserId(userId)
        return ResponseEntity.ok(notifications)
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "Mark notification as read", description = "Marks a specific notification as read")
    fun markAsRead(@PathVariable id: Long): ResponseEntity<Notification?> {
        val notification = notificationService.markAsRead(id)
        return if (notification != null) ResponseEntity.ok(notification) else ResponseEntity.notFound().build()
    }

    @GetMapping("/{userId}/unread")
    @Operation(summary = "Get unread notifications", description = "Returns unread notifications for a specific user")
    fun getUnreadNotifications(@PathVariable userId: String): ResponseEntity<List<Notification>> {
        val notifications = notificationService.getUnreadNotificationsByUserId(userId)
        return ResponseEntity.ok(notifications)
    }
}
