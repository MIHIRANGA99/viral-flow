import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/neu_container.dart';
import '../../../core/widgets/neu_card.dart';
import '../../../core/widgets/neu_text_field.dart';
import '../../../core/widgets/neu_badge.dart';
import '../../providers/transaction_provider.dart';
import 'transaction_detail_dialog.dart';
import 'add_transaction_screen.dart';

class TransactionListScreen extends StatefulWidget {
  const TransactionListScreen({Key? key}) : super(key: key);

  @override
  State<TransactionListScreen> createState() => _TransactionListScreenState();
}

class _TransactionListScreenState extends State<TransactionListScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final txProv = context.watch<TransactionProvider>();
    final transactions = txProv.filteredTransactions;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Vault Transactions'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded,
                color: AppColors.cyan, size: 26),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const AddTransactionScreen(),
                ),
              );
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Search Input
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: NeuTextField(
                controller: _searchController,
                hintText: 'Search merchant, category, notes...',
                prefixIcon: Icons.search_rounded,
                onChanged: (val) => txProv.setSearchQuery(val),
              ),
            ),

            // Filter Tabs (All / Income / Expense)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: NeuContainer(
                borderRadius: 14,
                padding: const EdgeInsets.all(4),
                child: Row(
                  children: [
                    _buildFilterTab('ALL', 'All'),
                    _buildFilterTab('INCOME', 'Income'),
                    _buildFilterTab('EXPENSE', 'Expense'),
                  ],
                ),
              ),
            ),

            // Category Chips Horizontal Scroll
            SizedBox(
              height: 48,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                children: [
                  _buildCategoryChip(null, 'All Categories'),
                  ...AppConstants.defaultCategories.map((c) {
                    final name = c['name'] as String;
                    return _buildCategoryChip(name, name);
                  }),
                ],
              ),
            ),
            const SizedBox(height: 6),

            // Transactions Count
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${transactions.length} entries found',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isDark
                          ? AppColors.darkTextSecondary
                          : AppColors.lightTextSecondary,
                    ),
                  ),
                  if (txProv.searchQuery.isNotEmpty ||
                      txProv.selectedCategory != null)
                    GestureDetector(
                      onTap: () {
                        _searchController.clear();
                        txProv.setSearchQuery('');
                        txProv.setSelectedCategory(null);
                        txProv.setFilterType('ALL');
                      },
                      child: const Text(
                        'Reset Filters',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.cyan,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Transactions List
            Expanded(
              child: transactions.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.search_off_rounded,
                            size: 54,
                            color: isDark
                                ? AppColors.darkTextSecondary
                                : AppColors.lightTextSecondary,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'No matching transactions',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 10),
                      itemCount: transactions.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final tx = transactions[index];
                        final catInfo =
                            AppConstants.defaultCategories.firstWhere(
                          (c) => c['name'] == tx.category,
                          orElse: () => {
                            'icon': Icons.category_rounded,
                            'color': 0xFF78909C,
                          },
                        );
                        final catColor = Color(catInfo['color'] as int);

                        return NeuCard(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 14),
                          borderRadius: 18,
                          onTap: () =>
                              TransactionDetailDialog.show(context, tx),
                          child: Row(
                            children: [
                              NeuContainer(
                                isCircle: true,
                                width: 42,
                                height: 42,
                                customColor: catColor.withOpacity(0.15),
                                border: Border.all(
                                    color: catColor.withOpacity(0.3)),
                                child: Center(
                                  child: Icon(catInfo['icon'] as IconData,
                                      size: 20, color: catColor),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            tx.title,
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w700,
                                              color: isDark
                                                  ? AppColors.darkTextPrimary
                                                  : AppColors.lightTextPrimary,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        if (tx.isAutoLogged) ...[
                                          const SizedBox(width: 6),
                                          const NeuBadge(
                                            label: 'AI',
                                            color: AppColors.cyan,
                                          ),
                                        ],
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${tx.category} • ${Formatters.formatDate(tx.date)}',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: isDark
                                            ? AppColors.darkTextSecondary
                                            : AppColors.lightTextSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                '${tx.isIncome ? '+' : '-'}${Formatters.formatCurrency(tx.amount, currency: tx.currency)}',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: tx.isIncome
                                      ? AppColors.incomeGreen
                                      : AppColors.expenseRed,
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterTab(String type, String label) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final txProv = context.watch<TransactionProvider>();
    final isSelected = txProv.filterType == type;

    return Expanded(
      child: GestureDetector(
        onTap: () => txProv.setFilterType(type),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: isSelected
              ? BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(10),
                )
              : null,
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isSelected
                    ? Colors.white
                    : (isDark
                        ? AppColors.darkTextSecondary
                        : AppColors.lightTextSecondary),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryChip(String? category, String label) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final txProv = context.watch<TransactionProvider>();
    final isSelected = txProv.selectedCategory == category;

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () => txProv.setSelectedCategory(category),
        child: NeuContainer(
          borderRadius: 20,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          customColor: isSelected ? AppColors.cyan.withOpacity(0.18) : null,
          border: isSelected
              ? Border.all(color: AppColors.cyan, width: 1.2)
              : null,
          glowColor: isSelected ? AppColors.cyan : null,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected
                  ? AppColors.cyan
                  : (isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary),
            ),
          ),
        ),
      ),
    );
  }
}
