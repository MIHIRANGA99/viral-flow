import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/neu_container.dart';

class QuickStatBadge extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const QuickStatBadge({
    Key? key,
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return NeuContainer(
      borderRadius: 18,
      padding: const EdgeInsets.all(14),
      depth: 3.5,
      blurRadius: 7,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 16, color: color),
              ),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: isDark
                  ? AppColors.darkTextPrimary
                  : AppColors.lightTextPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
