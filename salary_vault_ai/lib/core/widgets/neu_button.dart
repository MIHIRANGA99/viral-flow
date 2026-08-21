import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'neu_container.dart';
import '../constants/app_colors.dart';

class NeuButton extends StatefulWidget {
  final Widget? child;
  final String? text;
  final IconData? icon;
  final VoidCallback? onPressed;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry padding;
  final double borderRadius;
  final bool isCircle;
  final Gradient? gradient;
  final Color? customColor;
  final Color? textColor;
  final Color? iconColor;
  final Color? glowColor;
  final bool isLoading;

  const NeuButton({
    Key? key,
    this.child,
    this.text,
    this.icon,
    this.onPressed,
    this.width,
    this.height,
    this.padding = const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
    this.borderRadius = 14.0,
    this.isCircle = false,
    this.gradient,
    this.customColor,
    this.textColor,
    this.iconColor,
    this.glowColor,
    this.isLoading = false,
  }) : super(key: key);

  @override
  State<NeuButton> createState() => _NeuButtonState();
}

class _NeuButtonState extends State<NeuButton> {
  bool _isPressed = false;

  void _onTapDown(TapDownDetails details) {
    if (widget.onPressed != null && !widget.isLoading) {
      HapticFeedback.lightImpact();
      setState(() => _isPressed = true);
    }
  }

  void _onTapUp(TapUpDetails details) {
    if (_isPressed) {
      setState(() => _isPressed = false);
    }
  }

  void _onTapCancel() {
    if (_isPressed) {
      setState(() => _isPressed = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final defaultTextColor = widget.gradient != null
        ? Colors.white
        : (isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary);

    Widget content;
    if (widget.isLoading) {
      content = const SizedBox(
        width: 22,
        height: 22,
        child: CircularProgressIndicator(
          strokeWidth: 2.5,
          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
        ),
      );
    } else if (widget.child != null) {
      content = widget.child!;
    } else {
      List<Widget> rowChildren = [];
      if (widget.icon != null) {
        rowChildren.add(
          Icon(
            widget.icon,
            size: 20,
            color: widget.iconColor ?? defaultTextColor,
          ),
        );
        if (widget.text != null && widget.text!.isNotEmpty) {
          rowChildren.add(const SizedBox(width: 8));
        }
      }
      if (widget.text != null && widget.text!.isNotEmpty) {
        rowChildren.add(
          Text(
            widget.text!,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: widget.textColor ?? defaultTextColor,
              letterSpacing: 0.2,
            ),
          ),
        );
      }
      content = Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: rowChildren,
      );
    }

    return GestureDetector(
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      onTap: widget.isLoading ? null : widget.onPressed,
      child: AnimatedScale(
        scale: _isPressed ? 0.96 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: NeuContainer(
          width: widget.width,
          height: widget.height,
          padding: widget.padding,
          borderRadius: widget.borderRadius,
          isCircle: widget.isCircle,
          gradient: widget.gradient,
          customColor: widget.customColor,
          glowColor: widget.glowColor,
          shape: _isPressed ? NeuShape.pressed : NeuShape.flat,
          depth: _isPressed ? 1.5 : 4.0,
          blurRadius: _isPressed ? 4.0 : 8.0,
          child: Center(child: content),
        ),
      ),
    );
  }
}
