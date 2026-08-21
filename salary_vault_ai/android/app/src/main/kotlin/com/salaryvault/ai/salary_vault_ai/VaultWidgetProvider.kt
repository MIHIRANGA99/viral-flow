package com.salaryvault.ai.salary_vault_ai

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class VaultWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId, "$5,420.50", "$14.75", "92%")
        }
    }

    companion object {
        fun updateAllWidgets(context: Context, balance: String, todaySpend: String, health: String) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisWidget = ComponentName(context, VaultWidgetProvider::class.java)
            val allWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget)

            for (widgetId in allWidgetIds) {
                updateAppWidget(context, appWidgetManager, widgetId, balance, todaySpend, health)
            }
        }

        private fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int,
            balance: String,
            todaySpend: String,
            health: String
        ) {
            val views = RemoteViews(context.packageName, R.layout.vault_app_widget)

            views.setTextViewText(R.id.widget_balance, balance)
            views.setTextViewText(R.id.widget_today_spend, "Today Spend: $todaySpend")
            views.setTextViewText(R.id.widget_health, "$health Health")

            // Intent to launch the app when widget is tapped
            val intent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
