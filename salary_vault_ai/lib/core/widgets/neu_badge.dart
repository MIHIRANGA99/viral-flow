import 'package:flutter/material.dart';
import 'neu_container.dart';
import '../constants/app_colors.dart';

class NeuBadge extends StatelessWidget {
  final String label;
  final IconData? icon;
  final Color color;
  final bool hasGlow;
  final bool isFilled;

  const NeuBadge({
    Key? key,
    required this.label,
    this.icon,
    this.color = AppColors.cyan,
    this.hasGlow = true,
    this.isFilled = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return NeuContainer(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      borderRadius: 20,
      depth: 2.0,
      blurRadius: 4.0,
      glowColor: hasGlow ? color.withOpacity(0.3) : null,
      customColor: isFilled ? color.withOpacity(0.15) : null,
      border: Border.all(
        color: color.withOpacity(0.4),
        width: 1.0,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: color.withOpacity(0.8),
                  blurRadius: 4,
                  spreadRadius: 1,
                ),
              ],
            ),
          ),
          if (icon != null) ...[
            const SizedBox(width: 5),
            Icon(icon, size: 12, color: color),
          ],
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: color,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}
