import 'package:flutter/material.dart';

class AppConstants {
  static const String appName = 'Salary Vault AI';
  static const String appTagline = 'Intelligent AI-Powered Wealth & Expense Vault';

  // Supported Currencies
  static const List<String> supportedCurrencies = [
    'USD', 'EUR', 'GBP', 'LKR', 'INR', 'AUD', 'CAD', 'SGD', 'AED'
  ];

  static const Map<String, String> currencySymbols = {
    'USD': '\$',
    'EUR': '€',
    'GBP': '£',
    'LKR': 'Rs ',
    'INR': '₹',
    'AUD': 'A\$',
    'CAD': 'C\$',
    'SGD': 'S\$',
    'AED': 'AED ',
  };

  // Transaction Categories with Icons and Colors
  static const List<Map<String, dynamic>> defaultCategories = [
    {
      'name': 'Salary',
      'icon': Icons.account_balance_wallet_rounded,
      'color': 0xFF00E676,
      'isIncome': true,
    },
    {
      'name': 'Freelance & Business',
      'icon': Icons.laptop_chromebook_rounded,
      'color': 0xFF00E5FF,
      'isIncome': true,
    },
    {
      'name': 'Investment & Dividends',
      'icon': Icons.trending_up_rounded,
      'color': 0xFF9D50BB,
      'isIncome': true,
    },
    {
      'name': 'Food & Dining',
      'icon': Icons.restaurant_rounded,
      'color': 0xFFFF7043,
      'isIncome': false,
    },
    {
      'name': 'Shopping & Retail',
      'icon': Icons.shopping_bag_rounded,
      'color': 0xFFAB47BC,
      'isIncome': false,
    },
    {
      'name': 'Transport & Fuel',
      'icon': Icons.directions_car_rounded,
      'color': 0xFF42A5F5,
      'isIncome': false,
    },
    {
      'name': 'Bills & Utilities',
      'icon': Icons.receipt_long_rounded,
      'color': 0xFFFFCA28,
      'isIncome': false,
    },
    {
      'name': 'Entertainment & Subscriptions',
      'icon': Icons.movie_filter_rounded,
      'color': 0xFFEC407A,
      'isIncome': false,
    },
    {
      'name': 'Health & Medical',
      'icon': Icons.health_and_safety_rounded,
      'color': 0xFF26A69A,
      'isIncome': false,
    },
    {
      'name': 'Education & Courses',
      'icon': Icons.school_rounded,
      'color': 0xFF5C6BC0,
      'isIncome': false,
    },
    {
      'name': 'Others',
      'icon': Icons.category_rounded,
      'color': 0xFF78909C,
      'isIncome': false,
    },
  ];

  // Default Monitored Banking & Financial Packages
  static const List<Map<String, String>> defaultMonitoredPackages = [
    {
      'packageName': 'com.google.android.apps.messaging',
      'appName': 'Android SMS Messages',
      'desc': 'Bank SMS transaction alert texts'
    },
    {
      'packageName': 'com.google.android.apps.nbu.paisa.user',
      'appName': 'Google Pay',
      'desc': 'UPI and Instant payment notifications'
    },
    {
      'packageName': 'com.paypal.android.p2pmobile',
      'appName': 'PayPal',
      'desc': 'Online wallet transaction alerts'
    },
    {
      'packageName': 'com.revolut.revolut',
      'appName': 'Revolut',
      'desc': 'Digital banking transaction notifications'
    },
    {
      'packageName': 'com.chase.sig.android',
      'appName': 'Chase Mobile',
      'desc': 'Debit and Credit transaction alerts'
    },
    {
      'packageName': 'com.bankofamerica.bofa',
      'appName': 'Bank of America',
      'desc': 'Account balance and expense alerts'
    },
  ];
}
