import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../models/transaction_model.dart';
import '../models/parsed_sms_result.dart';

class TransactionRepository {
  static const String _storageKey = 'salary_vault_transactions_v1';
  final List<TransactionModel> _transactions = [];
  bool _isInitialized = false;

  List<TransactionModel> get transactions => List.unmodifiable(_transactions);

  Future<void> init() async {
    if (_isInitialized) return;
    final prefs = await SharedPreferences.getInstance();
    final rawData = prefs.getString(_storageKey);

    if (rawData != null && rawData.isNotEmpty) {
      try {
        final List<dynamic> decoded = jsonDecode(rawData);
        _transactions.clear();
        for (final item in decoded) {
          _transactions.add(TransactionModel.fromJson(item as Map<String, dynamic>));
        }
      } catch (e) {
        _populateSampleData();
      }
    } else {
      _populateSampleData();
      await _saveToPrefs();
    }
    _isInitialized = true;
  }

  Future<void> addTransaction(TransactionModel tx) async {
    _transactions.insert(0, tx);
    await _saveToPrefs();
  }

  Future<TransactionModel> addFromAiParsed(ParsedSmsResult parsed) async {
    final tx = TransactionModel(
      id: const Uuid().v4(),
      title: parsed.merchant,
      amount: parsed.amount,
      currency: parsed.currency,
      isIncome: parsed.isIncome,
      category: parsed.predictedCategory,
      date: DateTime.now(),
      notes: 'Auto-detected via AI Notification Parser (${parsed.transactionType})',
      isAutoLogged: true,
      rawSourceText: parsed.rawText,
      confidenceScore: parsed.confidence,
      accountName: parsed.accountNumber,
    );
    await addTransaction(tx);
    return tx;
  }

  Future<void> updateTransaction(TransactionModel updatedTx) async {
    final index = _transactions.indexWhere((t) => t.id == updatedTx.id);
    if (index != -1) {
      _transactions[index] = updatedTx;
      await _saveToPrefs();
    }
  }

  Future<void> deleteTransaction(String id) async {
    _transactions.removeWhere((t) => t.id == id);
    await _saveToPrefs();
  }

  Future<void> clearAll() async {
    _transactions.clear();
    await _saveToPrefs();
  }

  Future<void> resetToDemoData() async {
    _transactions.clear();
    _populateSampleData();
    await _saveToPrefs();
  }

  double get totalIncome {
    return _transactions
        .where((t) => t.isIncome)
        .fold(0.0, (sum, t) => sum + t.amount);
  }

  double get totalExpense {
    return _transactions
        .where((t) => !t.isIncome)
        .fold(0.0, (sum, t) => sum + t.amount);
  }

  double get netVaultBalance => totalIncome - totalExpense;

  Map<String, double> get categoryExpenses {
    final Map<String, double> result = {};
    for (final tx in _transactions.where((t) => !t.isIncome)) {
      result[tx.category] = (result[tx.category] ?? 0.0) + tx.amount;
    }
    return result;
  }

  Map<String, double> get categoryIncomes {
    final Map<String, double> result = {};
    for (final tx in _transactions.where((t) => t.isIncome)) {
      result[tx.category] = (result[tx.category] ?? 0.0) + tx.amount;
    }
    return result;
  }

  Future<void> _saveToPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonList = _transactions.map((t) => t.toJson()).toList();
    await prefs.setString(_storageKey, jsonEncode(jsonList));
  }

  void _populateSampleData() {
    final now = DateTime.now();
    _transactions.addAll([
      TransactionModel(
        id: const Uuid().v4(),
        title: 'Tech Corp Monthly Salary',
        amount: 5200.00,
        currency: 'USD',
        isIncome: true,
        category: 'Salary',
        date: now.subtract(const Duration(days: 2, hours: 3)),
        notes: 'Monthly direct payroll deposit',
        isAutoLogged: true,
        confidenceScore: 0.98,
        accountName: '•••• 4291',
      ),
      TransactionModel(
        id: const Uuid().v4(),
        title: 'Starbucks Reserve',
        amount: 14.75,
        currency: 'USD',
        isIncome: false,
        category: 'Food & Dining',
        date: now.subtract(const Duration(hours: 4)),
        notes: 'Coffee & croissant',
        isAutoLogged: true,
        confidenceScore: 0.95,
        accountName: '•••• 4291',
      ),
      TransactionModel(
        id: const Uuid().v4(),
        title: 'Apple Store NYC',
        amount: 249.00,
        currency: 'USD',
        isIncome: false,
        category: 'Shopping & Retail',
        date: now.subtract(const Duration(days: 1, hours: 2)),
        notes: 'AirPods Pro Gen 2',
        isAutoLogged: false,
      ),
      TransactionModel(
        id: const Uuid().v4(),
        title: 'Uber Ride Downtown',
        amount: 32.50,
        currency: 'USD',
        isIncome: false,
        category: 'Transport & Fuel',
        date: now.subtract(const Duration(days: 3, hours: 5)),
        notes: 'Airport transfer ride',
        isAutoLogged: true,
        confidenceScore: 0.94,
        accountName: '•••• 8823',
      ),
      TransactionModel(
        id: const Uuid().v4(),
        title: 'Netflix Premium Ultra HD',
        amount: 19.99,
        currency: 'USD',
        isIncome: false,
        category: 'Entertainment & Subscriptions',
        date: now.subtract(const Duration(days: 4)),
        notes: 'Monthly recurring subscription',
        isAutoLogged: true,
        confidenceScore: 0.96,
      ),
      TransactionModel(
        id: const Uuid().v4(),
        title: 'Upwork Global Client Payout',
        amount: 850.00,
        currency: 'USD',
        isIncome: true,
        category: 'Freelance & Business',
        date: now.subtract(const Duration(days: 5, hours: 8)),
        notes: 'Flutter Mobile App milestone payment',
        isAutoLogged: false,
      ),
      TransactionModel(
        id: const Uuid().v4(),
        title: 'City Power & Electric Bill',
        amount: 112.40,
        currency: 'USD',
        isIncome: false,
        category: 'Bills & Utilities',
        date: now.subtract(const Duration(days: 6)),
        notes: 'Utility bill auto-debit',
        isAutoLogged: true,
        confidenceScore: 0.91,
        accountName: '•••• 4291',
      ),
      TransactionModel(
        id: const Uuid().v4(),
        title: 'Dividend Payout - Vanguard ETF',
        amount: 145.20,
        currency: 'USD',
        isIncome: true,
        category: 'Investment & Dividends',
        date: now.subtract(const Duration(days: 7)),
        notes: 'Q3 dividend distribution',
        isAutoLogged: false,
      ),
    ]);
  }
}
