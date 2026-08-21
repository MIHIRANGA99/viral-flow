import 'package:intl/intl.dart';
import '../constants/app_constants.dart';

class Formatters {
  static String formatCurrency(double amount, {String currency = 'USD'}) {
    final symbol = AppConstants.currencySymbols[currency] ?? '$currency ';
    final formatter = NumberFormat('#,##0.00', 'en_US');
    return '$symbol${formatter.format(amount)}';
  }

  static String formatCompactNumber(double amount) {
    final formatter = NumberFormat.compact(locale: 'en_US');
    return formatter.format(amount);
  }

  static String formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final aDate = DateTime(date.year, date.month, date.day);

    if (aDate == today) {
      return 'Today, ${DateFormat('hh:mm a').format(date)}';
    } else if (aDate == today.subtract(const Duration(days: 1))) {
      return 'Yesterday, ${DateFormat('hh:mm a').format(date)}';
    } else {
      return DateFormat('MMM dd, yyyy • hh:mm a').format(date);
    }
  }

  static String formatShortDate(DateTime date) {
    return DateFormat('MMM dd, yyyy').format(date);
  }

  static String formatTime(DateTime date) {
    return DateFormat('hh:mm a').format(date);
  }
}
