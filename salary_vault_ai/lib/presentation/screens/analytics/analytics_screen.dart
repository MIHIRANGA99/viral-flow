import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/neu_container.dart';
import '../../../core/widgets/neu_card.dart';
import '../../../core/widgets/neu_badge.dart';
import '../../providers/transaction_provider.dart';
import '../../providers/auth_provider.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({Key? key}) : super(key: key);

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  int _touchedIndex = -1;
  bool _isExpenseMode = true;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final txProv = context.watch<TransactionProvider>();
    final currency =
        context.watch<AuthProvider>().currentUser?.defaultCurrency ?? 'USD';

    final categoryData =
        _isExpenseMode ? txProv.categoryExpenses : txProv.categoryIncomes;
    final totalAmount =
        _isExpenseMode ? txProv.totalExpense : txProv.totalIncome;

    final sortedEntries = categoryData.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Financial Analytics & AI Insights'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Income / Expense Mode Switcher
              NeuContainer(
                borderRadius: 14,
                padding: const EdgeInsets.all(4),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() {
                          _isExpenseMode = true;
                          _touchedIndex = -1;
                        }),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: _isExpenseMode
                              ? BoxDecoration(
                                  gradient: AppColors.dangerGradient,
                                  borderRadius: BorderRadius.circular(10),
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
                              'Expense Breakdown',
                              style: TextStyle(
                                fontSize: 13,
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
                        onTap: () => setState(() {
                          _isExpenseMode = false;
                          _touchedIndex = -1;
                        }),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: !_isExpenseMode
                              ? BoxDecoration(
                                  gradient: AppColors.successGradient,
                                  borderRadius: BorderRadius.circular(10),
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
                              'Income Streams',
                              style: TextStyle(
                                fontSize: 13,
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
              const SizedBox(height: 20),

              // Interactive Donut Chart Card
              NeuCard(
                glowColor: _isExpenseMode ? AppColors.cyan : AppColors.incomeGreen,
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _isExpenseMode ? 'Spending by Category' : 'Income by Stream',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: isDark
                                ? AppColors.darkTextPrimary
                                : AppColors.lightTextPrimary,
                          ),
                        ),
                        NeuBadge(
                          label: Formatters.formatCurrency(totalAmount,
                              currency: currency),
                          color: _isExpenseMode
                              ? AppColors.expenseRed
                              : AppColors.incomeGreen,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    if (sortedEntries.isEmpty || totalAmount <= 0)
                      SizedBox(
                        height: 200,
                        child: Center(
                          child: Text(
                            'No transactions recorded for this breakdown',
                            style: TextStyle(
                              fontSize: 13,
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
                            ),
                          ),
                        ),
                      )
                    else
                      SizedBox(
                        height: 220,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            PieChart(
                              PieChartData(
                                pieTouchData: PieTouchData(
                                  touchCallback:
                                      (FlTouchEvent event, pieTouchResponse) {
                                    setState(() {
                                      if (!event.isInterestedForInteractions ||
                                          pieTouchResponse == null ||
                                          pieTouchResponse
                                                  .touchedSection ==
                                              null) {
                                        _touchedIndex = -1;
                                        return;
                                      }
                                      _touchedIndex = pieTouchResponse
                                          .touchedSection!
                                          .touchedSectionIndex;
                                    });
                                  },
                                ),
                                borderData: FlBorderData(show: false),
                                sectionsSpace: 3,
                                centerSpaceRadius: 60,
                                sections: _generateSections(
                                    sortedEntries, totalAmount),
                              ),
                            ),
                            Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  _touchedIndex >= 0 &&
                                          _touchedIndex < sortedEntries.length
                                      ? sortedEntries[_touchedIndex].key
                                      : 'Total',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: isDark
                                        ? AppColors.darkTextSecondary
                                        : AppColors.lightTextSecondary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  _touchedIndex >= 0 &&
                                          _touchedIndex < sortedEntries.length
                                      ? Formatters.formatCurrency(
                                          sortedEntries[_touchedIndex].value,
                                          currency: currency)
                                      : Formatters.formatCurrency(totalAmount,
                                          currency: currency),
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: isDark
                                        ? AppColors.darkTextPrimary
                                        : AppColors.lightTextPrimary,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // AI Financial Insights Cards
              Text(
                'AI FINANCIAL INSIGHTS',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.0,
                  color: isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
                ),
              ),
              const SizedBox(height: 10),

              _buildAiInsightCard(
                icon: Icons.auto_awesome_rounded,
                title: 'Spending Pattern Alert',
                description: sortedEntries.isNotEmpty
                    ? 'Your largest outflow is in "${sortedEntries.first.key}" representing ${((sortedEntries.first.value / totalAmount) * 100).toStringAsFixed(1)}% of your expenses.'
                    : 'Log transactions to enable predictive spending pattern analysis.',
                color: AppColors.cyan,
                isDark: isDark,
              ),
              const SizedBox(height: 12),

              _buildAiInsightCard(
                icon: Icons.savings_rounded,
                title: 'Vault Optimization',
                description:
                    'Automated SMS notifications listener has tracked ${txProv.allTransactions.where((t) => t.isAutoLogged).length} receipts with zero manual intervention.',
                color: AppColors.incomeGreen,
                isDark: isDark,
              ),
              const SizedBox(height: 24),

              // Category Breakdown List
              Text(
                'CATEGORY DETAILS',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.0,
                  color: isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
                ),
              ),
              const SizedBox(height: 10),

              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: sortedEntries.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final item = sortedEntries[index];
                  final pct = totalAmount > 0 ? (item.value / totalAmount) : 0.0;
                  final catInfo = AppConstants.defaultCategories.firstWhere(
                    (c) => c['name'] == item.key,
                    orElse: () => {
                      'icon': Icons.category_rounded,
                      'color': 0xFF78909C,
                    },
                  );
                  final catColor = Color(catInfo['color'] as int);

                  return NeuContainer(
                    borderRadius: 16,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            NeuContainer(
                              isCircle: true,
                              width: 36,
                              height: 36,
                              customColor: catColor.withOpacity(0.15),
                              border: Border.all(
                                  color: catColor.withOpacity(0.3)),
                              child: Center(
                                child: Icon(catInfo['icon'] as IconData,
                                    size: 18, color: catColor),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.key,
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: isDark
                                          ? AppColors.darkTextPrimary
                                          : AppColors.lightTextPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${(pct * 100).toStringAsFixed(1)}% of total',
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
                            Text(
                              Formatters.formatCurrency(item.value,
                                  currency: currency),
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: isDark
                                    ? AppColors.darkTextPrimary
                                    : AppColors.lightTextPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: pct,
                            minHeight: 5,
                            backgroundColor: isDark
                                ? AppColors.darkSurface
                                : AppColors.lightShadowBottom,
                            valueColor: AlwaysStoppedAnimation<Color>(catColor),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
              const SizedBox(height: 90),
            ],
          ),
        ),
      ),
    );
  }

  List<PieChartSectionData> _generateSections(
      List<MapEntry<String, double>> entries, double total) {
    return List.generate(entries.length, (i) {
      final isTouched = i == _touchedIndex;
      final fontSize = isTouched ? 14.0 : 11.0;
      final radius = isTouched ? 55.0 : 45.0;
      final entry = entries[i];
      final pct = (entry.value / total) * 100;

      final catInfo = AppConstants.defaultCategories.firstWhere(
        (c) => c['name'] == entry.key,
        orElse: () => {
          'color': 0xFF78909C,
        },
      );
      final catColor = Color(catInfo['color'] as int);

      return PieChartSectionData(
        color: catColor,
        value: entry.value,
        title: pct >= 5 ? '${pct.toStringAsFixed(0)}%' : '',
        radius: radius,
        titleStyle: TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      );
    });
  }

  Widget _buildAiInsightCard({
    required IconData icon,
    required String title,
    required String description,
    required Color color,
    required bool isDark,
  }) {
    return NeuContainer(
      borderRadius: 18,
      padding: const EdgeInsets.all(16),
      border: Border.all(color: color.withOpacity(0.3)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: color,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.4,
                    color: isDark
                        ? AppColors.darkTextSecondary
                        : AppColors.lightTextSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
