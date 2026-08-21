import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/neu_container.dart';
import '../../../core/widgets/neu_button.dart';
import '../../../core/widgets/neu_badge.dart';
import '../../../data/models/transaction_model.dart';
import '../../providers/transaction_provider.dart';

class TransactionDetailDialog extends StatelessWidget {
  final TransactionModel transaction;

  const TransactionDetailDialog({Key? key, required this.transaction})
      : super(key: key);

  static void show(BuildContext context, TransactionModel tx) {
    showDialog(
      context: context,
      builder: (ctx) => TransactionDetailDialog(transaction: tx),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final catInfo = AppConstants.defaultCategories.firstWhere(
      (c) => c['name'] == transaction.category,
      orElse: () => {
        'icon': Icons.category_rounded,
        'color': 0xFF78909C,
      },
    );
    final catColor = Color(catInfo['color'] as int);

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: NeuContainer(
        borderRadius: 24,
        padding: const EdgeInsets.all(22),
        glowColor: transaction.isIncome ? AppColors.incomeGreen : AppColors.cyan,
        depth: 6,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  NeuContainer(
                    isCircle: true,
                    width: 44,
                    height: 44,
                    customColor: catColor.withOpacity(0.18),
                    border: Border.all(color: catColor.withOpacity(0.4)),
                    child: Center(
                      child: Icon(catInfo['icon'] as IconData,
                          color: catColor, size: 22),
                    ),
                  ),
                  if (transaction.isAutoLogged)
                    const NeuBadge(
                      label: 'AI PARSED',
                      icon: Icons.psychology_rounded,
                      color: AppColors.cyan,
                    )
                  else
                    NeuBadge(
                      label: 'MANUAL ENTRY',
                      icon: Icons.edit_note_rounded,
                      color: isDark
                          ? AppColors.darkTextSecondary
                          : AppColors.lightTextSecondary,
                    ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Title
              Text(
                transaction.title,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: isDark
                      ? AppColors.darkTextPrimary
                      : AppColors.lightTextPrimary,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                Formatters.formatDate(transaction.date),
                style: TextStyle(
                  fontSize: 12,
                  color: isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
                ),
              ),
              const SizedBox(height: 16),

              // Amount Card
              NeuContainer(
                shape: NeuShape.pressed,
                borderRadius: 16,
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      transaction.isIncome ? 'Total Credited' : 'Total Debited',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.lightTextSecondary,
                      ),
                    ),
                    Text(
                      '${transaction.isIncome ? '+' : '-'}${Formatters.formatCurrency(transaction.amount, currency: transaction.currency)}',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: transaction.isIncome
                            ? AppColors.incomeGreen
                            : AppColors.expenseRed,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // Details List
              _buildDetailItem(
                context,
                'Category',
                transaction.category,
                icon: Icons.folder_open_rounded,
                isDark: isDark,
              ),
              if (transaction.accountName != null) ...[
                const SizedBox(height: 10),
                _buildDetailItem(
                  context,
                  'Account / Card',
                  transaction.accountName!,
                  icon: Icons.credit_card_rounded,
                  isDark: isDark,
                ),
              ],
              if (transaction.confidenceScore != null) ...[
                const SizedBox(height: 10),
                _buildDetailItem(
                  context,
                  'AI Confidence',
                  '${(transaction.confidenceScore! * 100).toInt()}% Match',
                  icon: Icons.auto_awesome_rounded,
                  valueColor: AppColors.cyan,
                  isDark: isDark,
                ),
              ],
              if (transaction.notes != null &&
                  transaction.notes!.isNotEmpty) ...[
                const SizedBox(height: 10),
                _buildDetailItem(
                  context,
                  'Notes',
                  transaction.notes!,
                  icon: Icons.notes_rounded,
                  isDark: isDark,
                ),
              ],

              // Raw SMS Preview if present
              if (transaction.rawSourceText != null &&
                  transaction.rawSourceText!.isNotEmpty) ...[
                const SizedBox(height: 14),
                Text(
                  'RAW SMS / NOTIFICATION TEXT',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                    color: isDark
                        ? AppColors.darkTextSecondary
                        : AppColors.lightTextSecondary,
                  ),
                ),
                const SizedBox(height: 6),
                NeuContainer(
                  shape: NeuShape.pressed,
                  borderRadius: 12,
                  padding: const EdgeInsets.all(12),
                  child: Text(
                    transaction.rawSourceText!,
                    style: TextStyle(
                      fontSize: 12,
                      fontFamily: 'monospace',
                      color: isDark
                          ? AppColors.darkTextPrimary
                          : AppColors.lightTextPrimary,
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 24),

              // Delete Button
              NeuButton(
                text: 'Delete Transaction',
                icon: Icons.delete_outline_rounded,
                customColor: AppColors.expenseRed.withOpacity(0.15),
                textColor: AppColors.expenseRed,
                iconColor: AppColors.expenseRed,
                onPressed: () {
                  context
                      .read<TransactionProvider>()
                      .deleteTransaction(transaction.id);
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailItem(
    BuildContext context,
    String label,
    String value, {
    required IconData icon,
    Color? valueColor,
    required bool isDark,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          size: 16,
          color: isDark
              ? AppColors.darkTextSecondary
              : AppColors.lightTextSecondary,
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: isDark
                ? AppColors.darkTextSecondary
                : AppColors.lightTextSecondary,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: valueColor ??
                (isDark
                    ? AppColors.darkTextPrimary
                    : AppColors.lightTextPrimary),
          ),
        ),
      ],
    );
  }
}
