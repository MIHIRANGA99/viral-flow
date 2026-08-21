import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'neu_container.dart';
import '../constants/app_colors.dart';

class NeuBottomNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const NeuBottomNavBar({
    Key? key,
    required this.currentIndex,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final navItems = [
      {'icon': Icons.dashboard_rounded, 'label': 'Vault'},
      {'icon': Icons.pie_chart_rounded, 'label': 'Analytics'},
      {'icon': Icons.psychology_rounded, 'label': 'AI Detector'},
      {'icon': Icons.tune_rounded, 'label': 'Settings'},
    ];

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 20),
      child: NeuContainer(
        height: 70,
        borderRadius: 24,
        depth: 6,
        blurRadius: 12,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: List.generate(navItems.length, (index) {
            final isSelected = currentIndex == index;
            final item = navItems[index];

            return GestureDetector(
              onTap: () {
                HapticFeedback.selectionClick();
                onTap(index);
              },
              behavior: HitTestBehavior.opaque,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeInOut,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: isSelected
                    ? BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.cyan.withOpacity(0.4),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      )
                    : null,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      item['icon'] as IconData,
                      size: 22,
                      color: isSelected
                          ? Colors.white
                          : (isDark
                              ? AppColors.darkTextSecondary
                              : AppColors.lightTextSecondary),
                    ),
                    if (isSelected) ...[
                      const SizedBox(width: 8),
                      Text(
                        item['label'] as String,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.2,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}
