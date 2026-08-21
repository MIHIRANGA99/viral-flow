import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/neu_button.dart';
import '../../transactions/add_transaction_screen.dart';

class QuickActionSheet extends StatelessWidget {
  const QuickActionSheet({Key? key}) : super(key: key);

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => const QuickActionSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 34),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkDivider : AppColors.lightDivider,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),

          Text(
            'Quick Vault Action',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: isDark
                  ? AppColors.darkTextPrimary
                  : AppColors.lightTextPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Choose transaction type to manually record',
            style: TextStyle(
              fontSize: 13,
              color: isDark
                  ? AppColors.darkTextSecondary
                  : AppColors.lightTextSecondary,
            ),
          ),
          const SizedBox(height: 24),

          Row(
            children: [
              Expanded(
                child: NeuButton(
                  gradient: AppColors.successGradient,
                  glowColor: AppColors.incomeGreen,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  onPressed: () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const AddTransactionScreen(
                          initialIsIncome: true,
                        ),
                      ),
                    );
                  },
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.arrow_downward_rounded,
                          color: Colors.white, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'Add Income',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: NeuButton(
                  gradient: AppColors.dangerGradient,
                  glowColor: AppColors.expenseRed,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  onPressed: () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const AddTransactionScreen(
                          initialIsIncome: false,
                        ),
                      ),
                    );
                  },
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.arrow_upward_rounded,
                          color: Colors.white, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'Add Expense',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
