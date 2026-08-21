import 'dart:math';
import '../models/parsed_sms_result.dart';

class AiNotificationParser {
  static const List<String> _otpKeywords = [
    'otp', 'one time password', 'verification code', 'security code',
    'secret code', 'do not share', 'valid for', 'login code'
  ];

  static const List<String> _incomeKeywords = [
    'credited', 'received', 'deposited', 'salary', 'refund', 'refunded',
    'cashback', 'added to your account', 'incoming transfer', 'payout'
  ];

  static const List<String> _expenseKeywords = [
    'debited', 'spent', 'paid', 'purchase', 'sent', 'withdrawn', 'charge',
    'deducted', 'transaction on', 'swiped', 'order placed', 'payment of'
  ];

  static final Map<String, List<String>> _categoryKeywords = {
    'Food & Dining': [
      'starbucks', 'mcdonald', 'kfc', 'subway', 'burger', 'pizza', 'restaurant',
      'cafe', 'coffee', 'dining', 'food', 'bistro', 'bakery', 'uber eats', 'doordash', 'grubhub'
    ],
    'Transport & Fuel': [
      'uber', 'lyft', 'taxi', 'fuel', 'gas', 'petrol', 'diesel', 'shell',
      'chevron', 'bp gas', 'metro', 'train', 'bus', 'parking', 'toll'
    ],
    'Shopping & Retail': [
      'amazon', 'walmart', 'target', 'ebay', 'aliexpress', 'zara', 'h&m',
      'nike', 'adidas', 'apple store', 'best buy', 'supermarket', 'groceries', 'ikea'
    ],
    'Bills & Utilities': [
      'electricity', 'water bill', 'power', 'internet', 'wifi', 'utility',
      'telecom', 'verizon', 'at&t', 't-mobile', 'broadband', 'gas bill', 'bill payment'
    ],
    'Entertainment & Subscriptions': [
      'netflix', 'spotify', 'disney', 'hulu', 'prime video', 'youtube',
      'cinema', 'theatre', 'steam', 'playstation', 'xbox', 'game', 'itunes'
    ],
    'Health & Medical': [
      'pharmacy', 'hospital', 'clinic', 'doctor', 'medicine', 'dental',
      'walgreens', 'cvs', 'healthcare', 'laboratory', 'optics'
    ],
    'Salary': [
      'salary', 'payroll', 'wages', 'monthly salary', 'employer', 'direct deposit salary'
    ],
    'Freelance & Business': [
      'upwork', 'fiverr', 'freelance', 'stripe payout', 'consulting',
      'client payment', 'wire transfer from', 'invoice'
    ],
    'Investment & Dividends': [
      'dividend', 'robinhood', 'binance', 'crypto', 'vanguard', 'etrade',
      'fidelity', 'stock purchase', 'mutual fund', 'deposit into trading'
    ],
  };

  /// Parses a raw SMS or notification string and returns structured financial data
  static ParsedSmsResult parse(String rawText) {
    if (rawText.trim().isEmpty) {
      return ParsedSmsResult.nonTransaction(rawText, reason: 'Empty string');
    }

    final lower = rawText.toLowerCase();

    // 1. Check for pure OTP notifications without financial charges
    final isOtp = _otpKeywords.any((keyword) => lower.contains(keyword));
    final hasFinancialMovement = lower.contains('debited') ||
        lower.contains('credited') ||
        lower.contains('spent') ||
        lower.contains('paid') ||
        lower.contains('deposited');

    if (isOtp && !hasFinancialMovement) {
      return ParsedSmsResult.nonTransaction(rawText, reason: 'Security verification OTP (No financial change)');
    }

    // 2. Extract Amount and Currency
    final amountData = _extractAmountAndCurrency(rawText);
    final double amount = amountData['amount'] as double;
    final String currency = amountData['currency'] as String;

    if (amount <= 0) {
      return ParsedSmsResult.nonTransaction(rawText, reason: 'No valid monetary amount detected');
    }

    // 3. Determine Income vs Expense
    bool isIncome = false;
    String transactionType = 'DEBIT';

    int incomeScore = 0;
    int expenseScore = 0;

    for (final kw in _incomeKeywords) {
      if (lower.contains(kw)) incomeScore += 2;
    }
    for (final kw in _expenseKeywords) {
      if (lower.contains(kw)) expenseScore += 2;
    }

    if (incomeScore > expenseScore) {
      isIncome = true;
      transactionType = 'CREDIT';
    } else {
      isIncome = false;
      transactionType = 'DEBIT';
    }

    // 4. Extract Merchant / Beneficiary / Source
    final merchant = _extractMerchant(rawText, isIncome);

    // 5. Account Number extraction (e.g. A/C ending 4589 or card ending 1234)
    final accountNum = _extractAccountEnding(rawText);

    // 6. Predict Category & Calculate AI Confidence Score
    final categoryResult = _predictCategory(rawText, merchant, isIncome);
    final String category = categoryResult['category'] as String;
    final double baseConfidence = categoryResult['confidence'] as double;

    // Adjust overall confidence based on entity completeness
    double confidence = baseConfidence;
    if (amount > 0) confidence += 0.15;
    if (merchant != 'Unknown Merchant' && merchant != 'Direct Deposit') confidence += 0.15;
    if (accountNum != null) confidence += 0.05;
    confidence = min(0.99, max(0.65, confidence));

    return ParsedSmsResult(
      isTransaction: true,
      merchant: merchant,
      amount: amount,
      currency: currency,
      isIncome: isIncome,
      predictedCategory: category,
      confidence: confidence,
      accountNumber: accountNum,
      transactionType: transactionType,
      rawText: rawText,
      extractedEntities: {
        'amount': amount,
        'currency': currency,
        'merchant': merchant,
        'account': accountNum ?? 'N/A',
        'type': transactionType,
        'category': category,
        'confidencePct': '${(confidence * 100).toInt()}%',
      },
    );
  }

  static Map<String, dynamic> _extractAmountAndCurrency(String text) {
    // Regex for amounts like: USD 120.50, $45.00, Rs. 15,000.00, EUR 49.99, LKR 5,000, INR 1200
    final regexes = [
      // Standard symbols: $100.50, €50, £25.00, ₹1500
      RegExp(r'([$€£₹])\s*([0-9,]+(\.[0-9]{1,2})?)', caseSensitive: false),
      // Currency codes prefix: USD 100.50, LKR 5000, EUR 45.00, Rs. 1200, Rs 500
      RegExp(r'(USD|EUR|GBP|LKR|INR|AUD|CAD|SGD|AED|Rs\.?|INR)\s*:?\s*([0-9,]+(\.[0-9]{1,2})?)', caseSensitive: false),
      // Number followed by currency: 150.00 USD, 50 EUR
      RegExp(r'([0-9,]+(\.[0-9]{1,2})?)\s*(USD|EUR|GBP|LKR|INR|AUD|CAD|SGD|AED|Rs\.?)', caseSensitive: false),
      // Debited by/for amount
      RegExp(r'(?:debited|credited|spent|paid|amount of|sum of)\s*(?:by|for|of|is)?\s*([0-9,]+(\.[0-9]{1,2})?)', caseSensitive: false),
    ];

    for (final reg in regexes) {
      final match = reg.firstMatch(text);
      if (match != null) {
        String rawCurr = 'USD';
        String rawVal = '0';

        if (match.groupCount >= 2) {
          final g1 = match.group(1) ?? '';
          final g2 = match.group(2) ?? '';

          // Determine which group is currency vs number
          if (double.tryParse(g1.replaceAll(',', '')) != null) {
            rawVal = g1;
            rawCurr = match.group(3) ?? 'USD';
          } else {
            rawCurr = g1;
            rawVal = g2;
          }
        } else if (match.groupCount == 1) {
          rawVal = match.group(1) ?? '0';
        }

        rawVal = rawVal.replaceAll(',', '').trim();
        final double? parsedVal = double.tryParse(rawVal);

        if (parsedVal != null && parsedVal > 0) {
          String normalizedCurr = 'USD';
          final currUpper = rawCurr.toUpperCase().replaceAll('.', '').trim();
          if (currUpper == r'$') {
            normalizedCurr = 'USD';
          } else if (currUpper == '€') {
            normalizedCurr = 'EUR';
          } else if (currUpper == '£') {
            normalizedCurr = 'GBP';
          } else if (currUpper == '₹' || currUpper == 'RS' || currUpper == 'INR') {
            normalizedCurr = 'INR';
          } else if (currUpper.contains('LKR')) {
            normalizedCurr = 'LKR';
          } else if (currUpper.contains('EUR')) {
            normalizedCurr = 'EUR';
          } else if (currUpper.contains('GBP')) {
            normalizedCurr = 'GBP';
          } else if (currUpper.contains('USD')) {
            normalizedCurr = 'USD';
          } else if (currUpper.contains('AED')) {
            normalizedCurr = 'AED';
          } else if (currUpper.contains('SGD')) {
            normalizedCurr = 'SGD';
          }

          return {'amount': parsedVal, 'currency': normalizedCurr};
        }
      }
    }

    return {'amount': 0.0, 'currency': 'USD'};
  }

  static String _extractMerchant(String text, bool isIncome) {
    // Patterns like: "at Uber", "at Starbucks", "to Walmart", "from Client", "for Netflix"
    final merchantPatterns = [
      RegExp(r"(?:at|to|in|for|towards|merchant:?)\s+([A-Za-z0-9\s&.'\-]+?)(?:\s+on|\s+ref|\s+using|\s+avl|\s+balance|\s+date|\.|$)", caseSensitive: false),
      RegExp(r"(?:from|by)\s+([A-Za-z0-9\s&.'\-]+?)(?:\s+on|\s+into|\s+account|\s+avl|\.|$)", caseSensitive: false),
      RegExp(r"paid to\s+([A-Za-z0-9\s&.'\-]+?)(?:\s+for|\.|$)", caseSensitive: false),
    ];

    for (final reg in merchantPatterns) {
      final match = reg.firstMatch(text);
      if (match != null) {
        String candidate = match.group(1)?.trim() ?? '';
        candidate = candidate.replaceAll(RegExp(r'[\.,]$'), '').trim();
        // Remove trailing filler words
        candidate = candidate.replaceAll(RegExp(r'\s+(card|ac|account|balance|via|using)$', caseSensitive: false), '');
        if (candidate.length >= 2 && candidate.length <= 40) {
          return _capitalize(candidate);
        }
      }
    }

    // Direct keyword scans for famous merchants
    for (final entry in _categoryKeywords.entries) {
      for (final kw in entry.value) {
        if (text.toLowerCase().contains(kw)) {
          return _capitalize(kw);
        }
      }
    }

    return isIncome ? 'Direct Deposit / Transfer' : 'Unknown Merchant';
  }

  static String? _extractAccountEnding(String text) {
    final match = RegExp(r'(?:a/c|acct|card|ending with|ending in|xx|x{2,}|a/c no\.?)\s*(?:no\.?)?\s*([0-9]{3,4})', caseSensitive: false).firstMatch(text);
    if (match != null) {
      return '•••• ${match.group(1)}';
    }
    return null;
  }

  static Map<String, dynamic> _predictCategory(String text, String merchant, bool isIncome) {
    final combined = '${text.toLowerCase()} ${merchant.toLowerCase()}';

    if (isIncome) {
      if (combined.contains('salary') || combined.contains('payroll') || combined.contains('wages')) {
        return {'category': 'Salary', 'confidence': 0.95};
      }
      if (combined.contains('dividend') || combined.contains('crypto') || combined.contains('stock')) {
        return {'category': 'Investment & Dividends', 'confidence': 0.88};
      }
      if (combined.contains('upwork') || combined.contains('freelance') || combined.contains('client')) {
        return {'category': 'Freelance & Business', 'confidence': 0.92};
      }
      return {'category': 'Salary', 'confidence': 0.78};
    }

    for (final entry in _categoryKeywords.entries) {
      for (final keyword in entry.value) {
        if (combined.contains(keyword)) {
          return {'category': entry.key, 'confidence': 0.94};
        }
      }
    }

    return {'category': 'Others', 'confidence': 0.65};
  }

  static String _capitalize(String s) {
    if (s.isEmpty) return s;
    return s.split(' ').map((word) {
      if (word.isEmpty) return word;
      return word[0].toUpperCase() + word.substring(1);
    }).join(' ');
  }
}
