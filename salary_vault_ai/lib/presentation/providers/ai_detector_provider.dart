import 'package:flutter/material.dart';
import '../../data/models/parsed_sms_result.dart';
import '../../data/services/ai_notification_parser.dart';

class AiDetectorProvider with ChangeNotifier {
  String _currentInput = '';
  ParsedSmsResult? _lastResult;
  bool _isParsing = false;
  final List<ParsedSmsResult> _history = [];

  String get currentInput => _currentInput;
  ParsedSmsResult? get lastResult => _lastResult;
  bool get isParsing => _isParsing;
  List<ParsedSmsResult> get history => List.unmodifiable(_history);

  // Preset Sample SMS alerts for instant testing
  static const List<Map<String, String>> sampleSmsAlerts = [
    {
      'title': 'Starbucks Coffee Debit',
      'text': 'Your Card ending 4291 was debited with USD 14.75 at Starbucks Reserve on 17-Aug. Avl Bal: USD 3,420.50.',
    },
    {
      'title': 'Salary Direct Deposit',
      'text': 'Dear Alex, your A/C ending with 4291 has been credited with USD 5,200.00 towards Monthly Salary from Tech Corp Inc. Ref: TX99482.',
    },
    {
      'title': 'Uber Ride Debit',
      'text': 'Payment of USD 32.50 to Uber Ride Downtown successful via Visa ending 8823. Thank you for riding!',
    },
    {
      'title': 'Amazon Shopping Order',
      'text': 'Purchase alert: USD 189.99 spent on your Chase Card at Amazon US Store on Aug 17. Avl Credit: USD 4,810.00.',
    },
    {
      'title': 'Utility Power Bill',
      'text': 'USD 112.40 debited from A/C 4291 for City Power & Electric Bill payment. Reference: EP-882341.',
    },
    {
      'title': 'Upwork Client Freelance Payout',
      'text': 'Wire transfer received: USD 850.00 from Upwork Global Escrow has been credited into your checking account.',
    },
    {
      'title': 'Security Verification OTP (Ignored)',
      'text': 'Your one-time password (OTP) is 849201. Valid for 5 mins. Do not share this secret code with anyone.',
    },
  ];

  void setInput(String text) {
    _currentInput = text;
    notifyListeners();
  }

  void loadSample(int index) {
    if (index >= 0 && index < sampleSmsAlerts.length) {
      _currentInput = sampleSmsAlerts[index]['text'] ?? '';
      parseCurrent();
    }
  }

  void parseCurrent() {
    if (_currentInput.trim().isEmpty) return;
    _isParsing = true;
    notifyListeners();

    // Fast NLP & Regex parsing
    final result = AiNotificationParser.parse(_currentInput);
    _lastResult = result;
    if (result.isTransaction) {
      _history.insert(0, result);
    }
    _isParsing = false;
    notifyListeners();
  }

  void clear() {
    _currentInput = '';
    _lastResult = null;
    notifyListeners();
  }
}
