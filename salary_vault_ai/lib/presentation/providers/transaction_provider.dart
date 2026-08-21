import 'package:flutter/material.dart';
import '../../data/models/transaction_model.dart';
import '../../data/models/parsed_sms_result.dart';
import '../../data/repositories/transaction_repository.dart';

class TransactionProvider with ChangeNotifier {
  final TransactionRepository _repository;

  bool _isLoading = false;
  String _searchQuery = '';
  String? _selectedCategory;
  String _filterType = 'ALL'; // 'ALL', 'INCOME', 'EXPENSE'

  TransactionProvider(this._repository);

  bool get isLoading => _isLoading;
  String get searchQuery => _searchQuery;
  String? get selectedCategory => _selectedCategory;
  String get filterType => _filterType;

  List<TransactionModel> get allTransactions => _repository.transactions;

  List<TransactionModel> get filteredTransactions {
    return _repository.transactions.where((tx) {
      // Type filter
      if (_filterType == 'INCOME' && !tx.isIncome) return false;
      if (_filterType == 'EXPENSE' && tx.isIncome) return false;

      // Category filter
      if (_selectedCategory != null && _selectedCategory != 'All') {
        if (tx.category != _selectedCategory) return false;
      }

      // Search query filter
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final matchesTitle = tx.title.toLowerCase().contains(query);
        final matchesCategory = tx.category.toLowerCase().contains(query);
        final matchesNotes = tx.notes?.toLowerCase().contains(query) ?? false;
        if (!matchesTitle && !matchesCategory && !matchesNotes) return false;
      }

      return true;
    }).toList();
  }

  double get netVaultBalance => _repository.netVaultBalance;
  double get totalIncome => _repository.totalIncome;
  double get totalExpense => _repository.totalExpense;
  Map<String, double> get categoryExpenses => _repository.categoryExpenses;
  Map<String, double> get categoryIncomes => _repository.categoryIncomes;

  Future<void> init() async {
    _isLoading = true;
    notifyListeners();
    await _repository.init();
    _isLoading = false;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void setSelectedCategory(String? category) {
    _selectedCategory = category;
    notifyListeners();
  }

  void setFilterType(String type) {
    _filterType = type;
    notifyListeners();
  }

  Future<void> addTransaction(TransactionModel tx) async {
    await _repository.addTransaction(tx);
    notifyListeners();
  }

  Future<TransactionModel> addFromAi(ParsedSmsResult parsed) async {
    final tx = await _repository.addFromAiParsed(parsed);
    notifyListeners();
    return tx;
  }

  Future<void> updateTransaction(TransactionModel tx) async {
    await _repository.updateTransaction(tx);
    notifyListeners();
  }

  Future<void> deleteTransaction(String id) async {
    await _repository.deleteTransaction(id);
    notifyListeners();
  }

  Future<void> resetDemoData() async {
    await _repository.resetToDemoData();
    notifyListeners();
  }
}
