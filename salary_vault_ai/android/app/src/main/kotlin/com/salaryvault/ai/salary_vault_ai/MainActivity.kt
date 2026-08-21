package com.salaryvault.ai.salary_vault_ai

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import androidx.core.app.ActivityCompat
import android.Manifest
import android.content.pm.PackageManager
import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterFragmentActivity() {

    private val METHOD_CHANNEL = "com.salaryvault.ai/bridge"
    private val EVENT_CHANNEL = "com.salaryvault.ai/events"
    private var eventSink: EventChannel.EventSink? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        // Setup MethodChannel
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, METHOD_CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "isNotificationListenerEnabled" -> {
                    result.success(isNotificationListenerEnabled())
                }
                "openNotificationListenerSettings" -> {
                    startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
                    result.success(true)
                }
                "requestSmsPermissions" -> {
                    requestSmsPermissions()
                    result.success(true)
                }
                "updateWidget" -> {
                    val balance = call.argument<String>("balance") ?: "$0.00"
                    val todaySpend = call.argument<String>("todaySpend") ?: "$0.00"
                    val health = call.argument<String>("health") ?: "100%"
                    VaultWidgetProvider.updateAllWidgets(this, balance, todaySpend, health)
                    result.success(true)
                }
                else -> result.notImplemented()
            }
        }

        // Setup EventChannel for live SMS and Notification streaming
        EventChannel(flutterEngine.dartExecutor.binaryMessenger, EVENT_CHANNEL).setStreamHandler(
            object : EventChannel.StreamHandler {
                override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                    eventSink = events

                    // Bind to Notification Listener
                    SalaryVaultNotificationListener.onNotificationReceived = { payload ->
                        runOnUiThread {
                            eventSink?.success(payload)
                        }
                    }

                    // Bind to SMS Receiver
                    SmsReceiver.onSmsReceived = { payload ->
                        runOnUiThread {
                            eventSink?.success(payload)
                        }
                    }
                }

                override fun onCancel(arguments: Any?) {
                    eventSink = null
                    SalaryVaultNotificationListener.onNotificationReceived = null
                    SmsReceiver.onSmsReceived = null
                }
            }
        )
    }

    private fun isNotificationListenerEnabled(): Boolean {
        val packageName = packageName
        val flat = Settings.Secure.getString(contentResolver, "enabled_notification_listeners")
        if (!TextUtils.isEmpty(flat)) {
            val names = flat.split(":").toTypedArray()
            for (name in names) {
                val cn = ComponentName.unflattenFromString(name)
                if (cn != null) {
                    if (TextUtils.equals(packageName, cn.packageName)) {
                        return true
                    }
                }
            }
        }
        return false
    }

    private fun requestSmsPermissions() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.RECEIVE_SMS) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_SMS),
                101
            )
        }
    }
}
