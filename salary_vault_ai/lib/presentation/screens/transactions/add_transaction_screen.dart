import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/neu_container.dart';
import '../../../core/widgets/neu_button.dart';
import '../../../core/widgets/neu_text_field.dart';
import '../../../data/models/transaction_model.dart';
import '../../providers/transaction_provider.dart';
import '../../providers/auth_provider.dart';

class AddTransactionScreen extends StatefulWidget {
  final bool initialIsIncome;

  const AddTransactionScreen({
    Key? key,
    this.initialIsIncome = false,
  }) : super(key: key);

  @override
  State<AddTransactionScreen> createState() => _AddTransactionScreenState();
}

class _AddTransactionScreenState extends State<AddTransactionScreen> {
  late bool _isIncome;
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();
  String _selectedCategory = 'Food & Dining';
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _isIncome = widget.initialIsIncome;
    _selectedCategory = _isIncome ? 'Salary' : 'Food & Dining';
  }

  void _saveTransaction() {
    final rawAmount = _amountController.text.replaceAll(',', '').trim();
    final amount = double.tryParse(rawAmount);

    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid monetary amount'),
          backgroundColor: AppColors.expenseRed,
        ),
      );
      return;
    }

    final title = _titleController.text.trim().isEmpty
        ? _selectedCategory
        : _titleController.text.trim();

    final userCurrency =
        context.read<AuthProvider>().currentUser?.defaultCurrency ?? 'USD';

    final newTx = TransactionModel(
      id: const Uuid().v4(),
      title: title,
      amount: amount,
      currency: userCurrency,
      isIncome: _isIncome,
      category: _selectedCategory,
      date: _selectedDate,
      notes: _notesController.text.trim().isEmpty
          ? null
          : _notesController.text.trim(),
      isAutoLogged: false,
    );

    context.read<TransactionProvider>().addTransaction(newTx);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currency =
        context.watch<AuthProvider>().currentUser?.defaultCurrency ?? 'USD';
    final symbol = AppConstants.currencySymbols[currency] ?? '$currency ';

    final availableCategories = AppConstants.defaultCategories
        .where((cat) => (cat['isIncome'] as bool) == _isIncome)
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(_isIncome ? 'Add Income Entry' : 'Add Expense Entry'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Income / Expense Toggle
              NeuContainer(
                borderRadius: 16,
                padding: const EdgeInsets.all(4),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _isIncome = false;
                            _selectedCategory = 'Food & Dining';
                          });
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: !_isIncome
                              ? BoxDecoration(
                                  gradient: AppColors.dangerGradient,
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.expenseRed.withOpacity(0.4),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                )
                              : null,
                          child: const Center(
                            child: Text(
                              'Expense',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _isIncome = true;
                            _selectedCategory = 'Salary';
                          });
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: _isIncome
                              ? BoxDecoration(
                                  gradient: AppColors.successGradient,
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.incomeGreen.withOpacity(0.4),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                )
                              : null,
                          child: const Center(
                            child: Text(
                              'Income',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Large Amount Input with Currency Symbol
              Text(
                'AMOUNT ($currency)',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.0,
                  color: isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
                ),
              ),
              const SizedBox(height: 8),
              NeuContainer(
                shape: NeuShape.pressed,
                borderRadius: 18,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  children: [
                    Text(
                      symbol,
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: _isIncome
                            ? AppColors.incomeGreen
                            : AppColors.expenseRed,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _amountController,
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        autofocus: true,
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                        ),
                        decoration: const InputDecoration(
                          hintText: '0.00',
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Title / Merchant Field
              NeuTextField(
                controller: _titleController,
                labelText: 'TITLE / MERCHANT NAME',
                hintText: _isIncome
                    ? 'e.g. Tech Corp Monthly Salary'
                    : 'e.g. Starbucks, Uber, Walmart',
                prefixIcon: Icons.storefront_rounded,
              ),
              const SizedBox(height: 20),

              // Category Selector Grid
              Text(
                'SELECT CATEGORY',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.0,
                  color: isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
                ),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: availableCategories.map((cat) {
                  final name = cat['name'] as String;
                  final icon = cat['icon'] as IconData;
                  final color = Color(cat['color'] as int);
                  final isSelected = _selectedCategory == name;

                  return GestureDetector(
                    onTap: () => setState(() => _selectedCategory = name),
                    child: NeuContainer(
                      borderRadius: 14,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 8),
                      customColor: isSelected ? color.withOpacity(0.18) : null,
                      border: isSelected
                          ? Border.all(color: color, width: 1.5)
                          : null,
                      glowColor: isSelected ? color : null,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(icon, size: 16, color: color),
                          const SizedBox(width: 6),
                          Text(
                            name,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                              color: isSelected
                                  ? color
                                  : (isDark
                                      ? AppColors.darkTextPrimary
                                      : AppColors.lightTextPrimary),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),

              // Date Picker
              Text(
                'TRANSACTION DATE',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.0,
                  color: isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
                ),
              ),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _selectedDate,
                    firstDate: DateTime(2020),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (picked != null) {
                    setState(() => _selectedDate = picked);
                  }
                },
                child: NeuContainer(
                  borderRadius: 14,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_today_rounded,
                          size: 18, color: AppColors.cyan),
                      const SizedBox(width: 12),
                      Text(
                        Formatters.formatShortDate(_selectedDate),
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? AppColors.darkTextPrimary
                              : AppColors.lightTextPrimary,
                        ),
                      ),
                      const Spacer(),
                      const Icon(Icons.edit_calendar_rounded,
                          size: 16, color: AppColors.cyan),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Notes Input
              NeuTextField(
                controller: _notesController,
                labelText: 'NOTES (OPTIONAL)',
                hintText: 'Add extra details or tag...',
                prefixIcon: Icons.edit_note_rounded,
                maxLines: 2,
              ),
              const SizedBox(height: 32),

              // Save Button
              NeuButton(
                text: _isIncome ? 'Save Income Entry' : 'Save Expense Entry',
                gradient: _isIncome
                    ? AppColors.successGradient
                    : AppColors.dangerGradient,
                glowColor:
                    _isIncome ? AppColors.incomeGreen : AppColors.expenseRed,
                height: 54,
                onPressed: _saveTransaction,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
