package com.salaryvault.ai.salary_vault_ai

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony

class SmsReceiver : BroadcastReceiver() {

    companion object {
        var onSmsReceived: ((Map<String, Any?>) -> Unit)? = null
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            for (sms in messages) {
                val sender = sms.originatingAddress ?: "Unknown"
                val body = sms.messageBody ?: ""

                if (body.trim().isNotEmpty()) {
                    val payload = mapOf<String, Any?>(
                        "source" to "SMS",
                        "sender" to sender,
                        "text" to body,
                        "timestamp" to System.currentTimeMillis()
                    )

                    onSmsReceived?.invoke(payload)
                }
            }
        }
    }
}
