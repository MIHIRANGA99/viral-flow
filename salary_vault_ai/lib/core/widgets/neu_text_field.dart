import 'package:flutter/material.dart';
import 'neu_container.dart';
import '../constants/app_colors.dart';

class NeuTextField extends StatefulWidget {
  final TextEditingController? controller;
  final String? hintText;
  final String? labelText;
  final IconData? prefixIcon;
  final Widget? suffixIcon;
  final bool obscureText;
  final TextInputType keyboardType;
  final ValueChanged<String>? onChanged;
  final FormFieldValidator<String>? validator;
  final int maxLines;
  final bool autofocus;

  const NeuTextField({
    Key? key,
    this.controller,
    this.hintText,
    this.labelText,
    this.prefixIcon,
    this.suffixIcon,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.onChanged,
    this.validator,
    this.maxLines = 1,
    this.autofocus = false,
  }) : super(key: key);

  @override
  State<NeuTextField> createState() => _NeuTextFieldState();
}

class _NeuTextFieldState extends State<NeuTextField> {
  final FocusNode _focusNode = FocusNode();
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() {
      setState(() {
        _isFocused = _focusNode.hasFocus;
      });
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.labelText != null) ...[
          Text(
            widget.labelText!,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              letterSpacing: 0.3,
            ),
          ),
          const SizedBox(height: 8),
        ],
        NeuContainer(
          shape: NeuShape.pressed,
          borderRadius: 14.0,
          depth: 2.5,
          blurRadius: 5.0,
          glowColor: _isFocused ? AppColors.cyan.withOpacity(0.5) : null,
          glowSpread: _isFocused ? 1.0 : 0.0,
          border: _isFocused
              ? Border.all(
                  color: AppColors.cyan.withOpacity(0.8),
                  width: 1.5,
                )
              : null,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          child: Row(
            children: [
              if (widget.prefixIcon != null) ...[
                Icon(
                  widget.prefixIcon,
                  size: 20,
                  color: _isFocused
                      ? AppColors.cyan
                      : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                ),
                const SizedBox(width: 10),
              ],
              Expanded(
                child: TextFormField(
                  controller: widget.controller,
                  focusNode: _focusNode,
                  autofocus: widget.autofocus,
                  obscureText: widget.obscureText,
                  keyboardType: widget.keyboardType,
                  onChanged: widget.onChanged,
                  validator: widget.validator,
                  maxLines: widget.maxLines,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                  ),
                  decoration: InputDecoration(
                    hintText: widget.hintText,
                    hintStyle: TextStyle(
                      fontSize: 14,
                      color: (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary)
                          .withOpacity(0.6),
                    ),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              if (widget.suffixIcon != null) ...[
                const SizedBox(width: 6),
                widget.suffixIcon!,
              ],
            ],
          ),
        ),
      ],
    );
  }
}
