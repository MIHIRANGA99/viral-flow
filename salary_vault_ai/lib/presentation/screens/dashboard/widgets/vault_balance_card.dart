import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/neu_container.dart';

class VaultBalanceCard extends StatelessWidget {
  final double netBalance;
  final double totalIncome;
  final double totalExpense;
  final String currency;
  final double monthlyBudget;

  const VaultBalanceCard({
    Key? key,
    required this.netBalance,
    required this.totalIncome,
    required this.totalExpense,
    this.currency = 'USD',
    this.monthlyBudget = 5000.0,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final expenseRatio = totalIncome > 0
        ? (totalExpense / totalIncome).clamp(0.0, 1.0)
        : 0.0;
    final savingsRatio = (1.0 - expenseRatio).clamp(0.0, 1.0);

    return NeuContainer(
      borderRadius: 24,
      depth: 6,
      blurRadius: 14,
      glowColor: AppColors.cyan,
      glowSpread: 1,
      border: Border.all(
        color: AppColors.cyan.withOpacity(0.3),
        width: 1.2,
      ),
      gradient: isDark
          ? const LinearGradient(
              colors: [Color(0xFF1F232B), Color(0xFF14161C)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            )
          : null,
      customColor: isDark ? null : AppColors.lightSurface,
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: AppColors.cyan,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.cyan,
                          blurRadius: 6,
                          spreadRadius: 1.5,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'TOTAL VAULT BALANCE',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.1,
                      color: isDark
                          ? AppColors.darkTextSecondary
                          : AppColors.lightTextSecondary,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.incomeGreen.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppColors.incomeGreen.withOpacity(0.4),
                    width: 1,
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.verified_user_rounded,
                      size: 13,
                      color: AppColors.incomeGreen,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${(savingsRatio * 100).toInt()}% Health',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.incomeGreen,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Main Glowing Net Balance
          ShaderMask(
            shaderCallback: (bounds) =>
                AppColors.primaryGradient.createShader(bounds),
            child: Text(
              Formatters.formatCurrency(netBalance, currency: currency),
              style: const TextStyle(
                fontSize: 34,
                fontWeight: FontWeight.w900,
                color: Colors.white,
                letterSpacing: -0.5,
              ),
            ),
          ),
          const SizedBox(height: 18),

          // Divider
          Container(
            height: 1,
            color: isDark ? AppColors.darkDivider : AppColors.lightDivider,
          ),
          const SizedBox(height: 18),

          // Income vs Expense row
          Row(
            children: [
              // Income
              Expanded(
                child: Row(
                  children: [
                    NeuContainer(
                      isCircle: true,
                      width: 36,
                      height: 36,
                      customColor: AppColors.incomeGreen.withOpacity(0.15),
                      border: Border.all(
                        color: AppColors.incomeGreen.withOpacity(0.4),
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.arrow_downward_rounded,
                          color: AppColors.incomeGreen,
                          size: 18,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Income',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            Formatters.formatCurrency(totalIncome,
                                currency: currency),
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.incomeGreen,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Expense
              Expanded(
                child: Row(
                  children: [
                    NeuContainer(
                      isCircle: true,
                      width: 36,
                      height: 36,
                      customColor: AppColors.expenseRed.withOpacity(0.15),
                      border: Border.all(
                        color: AppColors.expenseRed.withOpacity(0.4),
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.arrow_upward_rounded,
                          color: AppColors.expenseRed,
                          size: 18,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Expense',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            Formatters.formatCurrency(totalExpense,
                                currency: currency),
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.expenseRed,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
