import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

enum NeuShape { flat, convex, concave, pressed }

class NeuContainer extends StatelessWidget {
  final Widget? child;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final NeuShape shape;
  final Color? customColor;
  final Gradient? gradient;
  final double depth;
  final double blurRadius;
  final bool isCircle;
  final Border? border;
  final Color? glowColor;
  final double glowSpread;

  const NeuContainer({
    Key? key,
    this.child,
    this.width,
    this.height,
    this.padding,
    this.margin,
    this.borderRadius = 16.0,
    this.shape = NeuShape.flat,
    this.customColor,
    this.gradient,
    this.depth = 4.0,
    this.blurRadius = 8.0,
    this.isCircle = false,
    this.border,
    this.glowColor,
    this.glowSpread = 0.0,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final baseColor = customColor ?? (isDark ? AppColors.darkSurface : AppColors.lightSurface);
    final topShadowColor = isDark ? AppColors.darkShadowTop : AppColors.lightShadowTop;
    final bottomShadowColor = isDark ? AppColors.darkShadowBottom : AppColors.lightShadowBottom;

    List<BoxShadow> shadows = [];

    if (glowColor != null) {
      shadows.add(
        BoxShadow(
          color: glowColor!.withOpacity(0.4),
          blurRadius: 16.0,
          spreadRadius: glowSpread > 0 ? glowSpread : 2.0,
          offset: const Offset(0, 0),
        ),
      );
    }

    if (shape == NeuShape.pressed) {
      // Pressed / Debossed simulated styling
      shadows.addAll([
        BoxShadow(
          color: bottomShadowColor.withOpacity(0.6),
          offset: Offset(depth * 0.7, depth * 0.7),
          blurRadius: blurRadius * 0.8,
        ),
        BoxShadow(
          color: topShadowColor.withOpacity(0.4),
          offset: Offset(-depth * 0.7, -depth * 0.7),
          blurRadius: blurRadius * 0.8,
        ),
      ]);
    } else {
      // Extruded standard Neumorphism
      shadows.addAll([
        BoxShadow(
          color: topShadowColor.withOpacity(isDark ? 0.35 : 0.8),
          offset: Offset(-depth, -depth),
          blurRadius: blurRadius,
        ),
        BoxShadow(
          color: bottomShadowColor.withOpacity(isDark ? 0.7 : 0.5),
          offset: Offset(depth, depth),
          blurRadius: blurRadius,
        ),
      ]);
    }

    final boxDecoration = BoxDecoration(
      color: gradient == null ? baseColor : null,
      gradient: gradient,
      shape: isCircle ? BoxShape.circle : BoxShape.rectangle,
      borderRadius: isCircle ? null : BorderRadius.circular(borderRadius),
      boxShadow: shadows,
      border: border,
    );

    return Container(
      width: width,
      height: height,
      margin: margin,
      padding: padding,
      decoration: boxDecoration,
      child: child,
    );
  }
}
