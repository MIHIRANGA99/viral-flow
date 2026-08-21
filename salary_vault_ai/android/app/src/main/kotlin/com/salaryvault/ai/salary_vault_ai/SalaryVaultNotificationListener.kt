package com.salaryvault.ai.salary_vault_ai

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.content.Intent

class SalaryVaultNotificationListener : NotificationListenerService() {

    companion object {
        var onNotificationReceived: ((Map<String, Any?>) -> Unit)? = null
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null) return

        val packageName = sbn.packageName ?: return
        // Ignore our own notifications
        if (packageName == applicationContext.packageName) return

        val extras = sbn.notification?.extras ?: return
        val title = extras.getString(Notification.EXTRA_TITLE) ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: ""

        val combinedContent = if (bigText.isNotEmpty()) "$title - $bigText" else "$title - $text"

        if (combinedContent.trim().isNotEmpty()) {
            val payload = mapOf<String, Any?>(
                "source" to "NOTIFICATION",
                "package" to packageName,
                "title" to title,
                "text" to combinedContent,
                "timestamp" to System.currentTimeMillis()
            )

            // Stream to Flutter active listeners
            onNotificationReceived?.invoke(payload)

            // Also broadcast locally
            val intent = Intent("com.salaryvault.ai.NOTIFICATION_EVENT")
            intent.putExtra("package", packageName)
            intent.putExtra("text", combinedContent)
            sendBroadcast(intent)
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {}
}
