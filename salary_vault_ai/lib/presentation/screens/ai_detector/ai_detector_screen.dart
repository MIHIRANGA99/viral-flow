import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/neu_container.dart';
import '../../../core/widgets/neu_card.dart';
import '../../../core/widgets/neu_button.dart';
import '../../../core/widgets/neu_badge.dart';
import '../../providers/ai_detector_provider.dart';
import '../../providers/transaction_provider.dart';

class AiDetectorScreen extends StatefulWidget {
  const AiDetectorScreen({Key? key}) : super(key: key);

  @override
  State<AiDetectorScreen> createState() => _AiDetectorScreenState();
}

class _AiDetectorScreenState extends State<AiDetectorScreen> {
  final TextEditingController _textController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final detector = context.read<AiDetectorProvider>();
    if (detector.currentInput.isEmpty) {
      detector.loadSample(0);
      _textController.text = detector.currentInput;
    } else {
      _textController.text = detector.currentInput;
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final detector = context.watch<AiDetectorProvider>();
    final txProv = context.watch<TransactionProvider>();
    final lastResult = detector.lastResult;

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Detector Sandbox'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header description banner
              NeuContainer(
                borderRadius: 20,
                padding: const EdgeInsets.all(16),
                glowColor: AppColors.cyan,
                gradient: isDark
                    ? const LinearGradient(
                        colors: [Color(0xFF1E222A), Color(0xFF13151A)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                child: Row(
                  children: [
                    const NeuContainer(
                      isCircle: true,
                      width: 48,
                      height: 48,
                      glowColor: AppColors.cyan,
                      gradient: AppColors.primaryGradient,
                      child: Center(
                        child: Icon(Icons.psychology_rounded,
                            color: Colors.white, size: 26),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'AI Notification Parser Engine',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: AppColors.cyan,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            'Test NLP extraction, category classification, and confidence scoring on SMS or notifications.',
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
              const SizedBox(height: 20),

              // Preset Samples
              Text(
                'PRESET SAMPLE ALERTS',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.0,
                  color: isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 40,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: AiDetectorProvider.sampleSmsAlerts.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final sample = AiDetectorProvider.sampleSmsAlerts[index];
                    return GestureDetector(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        detector.loadSample(index);
                        _textController.text = detector.currentInput;
                      },
                      child: NeuContainer(
                        borderRadius: 14,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        child: Center(
                          child: Text(
                            sample['title']!,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: isDark
                                  ? AppColors.darkTextPrimary
                                  : AppColors.lightTextPrimary,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 18),

              // SMS Input Box
              Text(
                'INPUT SMS / NOTIFICATION TEXT',
                style: TextStyle(
                  fontSize: 11,
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
                padding: const EdgeInsets.all(14),
                child: TextField(
                  controller: _textController,
                  maxLines: 4,
                  onChanged: (val) => detector.setInput(val),
                  style: TextStyle(
                    fontSize: 13,
                    height: 1.4,
                    color: isDark
                        ? AppColors.darkTextPrimary
                        : AppColors.lightTextPrimary,
                  ),
                  decoration: const InputDecoration(
                    hintText: 'Paste any banking alert or SMS text here...',
                    border: InputBorder.none,
                    isDense: true,
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Action Buttons Row (Parse & Clear)
              Row(
                children: [
                  Expanded(
                    child: NeuButton(
                      text: 'Execute AI Parser',
                      icon: Icons.bolt_rounded,
                      gradient: AppColors.primaryGradient,
                      glowColor: AppColors.cyan,
                      isLoading: detector.isParsing,
                      onPressed: () {
                        detector.setInput(_textController.text);
                        detector.parseCurrent();
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  NeuButton(
                    icon: Icons.cleaning_services_rounded,
                    customColor: isDark
                        ? AppColors.darkSurface
                        : AppColors.lightSurface,
                    onPressed: () {
                      _textController.clear();
                      detector.clear();
                    },
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Parsing Results Card
              if (lastResult != null) ...[
                Text(
                  'EXTRACTION ANALYSIS & CONFIDENCE',
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

                if (!lastResult.isTransaction) ...[
                  // Ignored Non-transaction Card
                  NeuCard(
                    glowColor: AppColors.warningAmber,
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppColors.warningAmber.withOpacity(0.2),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.shield_outlined,
                                color: AppColors.warningAmber,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            const Expanded(
                              child: Text(
                                'Non-Financial Alert Filtered',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.warningAmber,
                                ),
                              ),
                            ),
                            const NeuBadge(
                              label: 'IGNORED',
                              color: AppColors.warningAmber,
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'The AI parser identified this notification as a security OTP or general alert. No financial debit or credit was logged to prevent false transactions.',
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
                ] else ...[
                  // Successful Extraction Card
                  NeuCard(
                    glowColor: lastResult.isIncome
                        ? AppColors.incomeGreen
                        : AppColors.cyan,
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Status & Confidence Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            NeuBadge(
                              label: lastResult.isIncome
                                  ? 'CREDIT DETECTED'
                                  : 'DEBIT DETECTED',
                              icon: lastResult.isIncome
                                  ? Icons.arrow_downward_rounded
                                  : Icons.arrow_upward_rounded,
                              color: lastResult.isIncome
                                  ? AppColors.incomeGreen
                                  : AppColors.expenseRed,
                            ),
                            NeuBadge(
                              label:
                                  '${(lastResult.confidence * 100).toInt()}% CONFIDENCE',
                              icon: Icons.auto_awesome_rounded,
                              color: AppColors.cyan,
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Confidence Progress Bar
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: LinearProgressIndicator(
                            value: lastResult.confidence,
                            minHeight: 6,
                            backgroundColor: isDark
                                ? AppColors.darkSurface
                                : AppColors.lightShadowBottom,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              lastResult.confidence > 0.85
                                  ? AppColors.incomeGreen
                                  : AppColors.warningAmber,
                            ),
                          ),
                        ),
                        const SizedBox(height: 18),

                        // Main Amount
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'EXTRACTED AMOUNT',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: isDark
                                        ? AppColors.darkTextSecondary
                                        : AppColors.lightTextSecondary,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${lastResult.isIncome ? '+' : '-'}${Formatters.formatCurrency(lastResult.amount, currency: lastResult.currency)}',
                                  style: TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.w900,
                                    color: lastResult.isIncome
                                        ? AppColors.incomeGreen
                                        : AppColors.expenseRed,
                                  ),
                                ),
                              ],
                            ),
                            NeuContainer(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 8),
                              borderRadius: 12,
                              child: Text(
                                lastResult.currency,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.cyan,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        const Divider(height: 1),
                        const SizedBox(height: 14),

                        // Extracted Entities
                        _buildEntityRow(
                          'Merchant / Source',
                          lastResult.merchant,
                          Icons.store_rounded,
                          isDark,
                        ),
                        const SizedBox(height: 8),
                        _buildEntityRow(
                          'Predicted Category',
                          lastResult.predictedCategory,
                          Icons.category_rounded,
                          isDark,
                          highlightColor: AppColors.cyan,
                        ),
                        if (lastResult.accountNumber != null) ...[
                          const SizedBox(height: 8),
                          _buildEntityRow(
                            'Account Reference',
                            lastResult.accountNumber!,
                            Icons.credit_card_rounded,
                            isDark,
                          ),
                        ],
                        const SizedBox(height: 20),

                        // Auto-Log Action Button
                        NeuButton(
                          text: 'Auto-Log to Vault',
                          icon: Icons.cloud_upload_rounded,
                          gradient: AppColors.successGradient,
                          glowColor: AppColors.incomeGreen,
                          onPressed: () async {
                            HapticFeedback.heavyImpact();
                            final tx = await txProv.addFromAi(lastResult);
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                      'Successfully logged "${tx.title}" to Vault!'),
                                  backgroundColor: AppColors.incomeGreen,
                                ),
                              );
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ],
              const SizedBox(height: 90),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEntityRow(
    String label,
    String value,
    IconData icon,
    bool isDark, {
    Color? highlightColor,
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
            fontSize: 12,
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
            color: highlightColor ??
                (isDark
                    ? AppColors.darkTextPrimary
                    : AppColors.lightTextPrimary),
          ),
        ),
      ],
    );
  }
}
