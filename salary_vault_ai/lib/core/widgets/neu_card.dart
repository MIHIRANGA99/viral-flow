import 'package:flutter/material.dart';
import 'neu_container.dart';
import '../constants/app_colors.dart';

class NeuCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final VoidCallback? onTap;
  final Color? glowColor;
  final bool hasGradientBorder;
  final Gradient? gradientBorder;
  final Gradient? backgroundGradient;
  final double depth;

  const NeuCard({
    Key? key,
    required this.child,
    this.padding = const EdgeInsets.all(16.0),
    this.margin,
    this.borderRadius = 20.0,
    this.onTap,
    this.glowColor,
    this.hasGradientBorder = false,
    this.gradientBorder,
    this.backgroundGradient,
    this.depth = 5.0,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    Widget cardContent = NeuContainer(
      margin: margin,
      padding: padding,
      borderRadius: borderRadius,
      depth: depth,
      blurRadius: depth * 2,
      glowColor: glowColor,
      gradient: backgroundGradient,
      customColor: isDark ? AppColors.darkCardBg : AppColors.lightSurface,
      border: hasGradientBorder
          ? Border.all(
              color: (glowColor ?? AppColors.cyan).withOpacity(0.35),
              width: 1.5,
            )
          : null,
      child: child,
    );

    if (onTap != null) {
      return InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(borderRadius),
        child: cardContent,
      );
    }

    return cardContent;
  }
}
