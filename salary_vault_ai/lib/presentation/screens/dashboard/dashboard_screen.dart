import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/neu_container.dart';
import '../../../core/widgets/neu_card.dart';
import '../../../core/widgets/neu_badge.dart';
import '../../providers/auth_provider.dart';
import '../../providers/transaction_provider.dart';
import 'widgets/vault_balance_card.dart';
import 'widgets/quick_stat_badge.dart';
import '../transactions/transaction_list_screen.dart';
import '../transactions/transaction_detail_dialog.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final auth = context.watch<AuthProvider>();
    final txProv = context.watch<TransactionProvider>();
    final user = auth.currentUser;
    final currency = user?.defaultCurrency ?? 'USD';

    final recentTransactions = txProv.allTransactions.take(6).toList();

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await txProv.init();
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        NeuContainer(
                          isCircle: true,
                          width: 46,
                          height: 46,
                          glowColor: AppColors.cyan,
                          gradient: AppColors.primaryGradient,
                          child: Center(
                            child: Text(
                              (user?.name.isNotEmpty ?? false)
                                  ? user!.name[0].toUpperCase()
                                  : 'A',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 18,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'WELCOME BACK,',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.0,
                                color: isDark
                                    ? AppColors.darkTextSecondary
                                    : AppColors.lightTextSecondary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              user?.name ?? 'Alex Sterling',
                              style: TextStyle(
                                fontSize: 18,
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

                    // Active AI Shield Indicator
                    const NeuContainer(
                      isCircle: true,
                      width: 44,
                      height: 44,
                      glowColor: AppColors.incomeGreen,
                      child: Center(
                        child: Icon(
                          Icons.radar_rounded,
                          color: AppColors.incomeGreen,
                          size: 22,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Vault Balance Hero Card
                VaultBalanceCard(
                  netBalance: txProv.netVaultBalance,
                  totalIncome: txProv.totalIncome,
                  totalExpense: txProv.totalExpense,
                  currency: currency,
                  monthlyBudget: user?.monthlyBudget ?? 5000.0,
                ),
                const SizedBox(height: 20),

                // Quick Stat Badges
                Row(
                  children: [
                    Expanded(
                      child: QuickStatBadge(
                        label: 'Auto-Logged',
                        value: '${txProv.allTransactions.where((t) => t.isAutoLogged).length} txns',
                        icon: Icons.auto_fix_high_rounded,
                        color: AppColors.cyan,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: QuickStatBadge(
                        label: 'Savings Ratio',
                        value: txProv.totalIncome > 0
                            ? '${(((txProv.totalIncome - txProv.totalExpense) / txProv.totalIncome) * 100).clamp(0, 100).toStringAsFixed(1)}%'
                            : '100%',
                        icon: Icons.savings_rounded,
                        color: AppColors.incomeGreen,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // AI Active Monitor Banner
                NeuContainer(
                  borderRadius: 18,
                  padding: const EdgeInsets.all(16),
                  customColor: AppColors.cyan.withOpacity(0.08),
                  border: Border.all(
                    color: AppColors.cyan.withOpacity(0.3),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.cyan.withOpacity(0.15),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.smart_toy_rounded,
                          color: AppColors.cyan,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'AI Listener Active',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppColors.cyan,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Monitoring ${user?.monitoredPackages.length ?? 4} financial channels for automatic parsing',
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
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Recent Vault Activity Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Recent Vault Activity',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: isDark
                            ? AppColors.darkTextPrimary
                            : AppColors.lightTextPrimary,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const TransactionListScreen(),
                          ),
                        );
                      },
                      child: Row(
                        children: const [
                          Text(
                            'View All',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.cyan,
                            ),
                          ),
                          SizedBox(width: 4),
                          Icon(Icons.arrow_forward_ios_rounded,
                              size: 12, color: AppColors.cyan),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Recent Transactions List
                if (recentTransactions.isEmpty)
                  NeuContainer(
                    borderRadius: 18,
                    padding: const EdgeInsets.all(32),
                    child: Center(
                      child: Column(
                        children: [
                          Icon(
                            Icons.receipt_long_rounded,
                            size: 48,
                            color: isDark
                                ? AppColors.darkTextSecondary
                                : AppColors.lightTextSecondary,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'No transactions recorded yet',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: recentTransactions.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final tx = recentTransactions[index];
                      final catInfo = AppConstants.defaultCategories.firstWhere(
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
                        onTap: () => TransactionDetailDialog.show(context, tx),
                        child: Row(
                          children: [
                            // Category Icon
                            NeuContainer(
                              isCircle: true,
                              width: 42,
                              height: 42,
                              customColor: catColor.withOpacity(0.15),
                              border:
                                  Border.all(color: catColor.withOpacity(0.3)),
                              child: Center(
                                child: Icon(catInfo['icon'] as IconData,
                                    size: 20, color: catColor),
                              ),
                            ),
                            const SizedBox(width: 14),

                            // Title & Date
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

                            // Amount
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
                const SizedBox(height: 90), // Space for bottom bar & fab
              ],
            ),
          ),
        ),
      ),
    );
  }
}
