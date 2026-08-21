import 'package:flutter/material.dart';

class AppColors {
  // Brand Gradients & Accents
  static const Color cyan = Color(0xFF00E5FF);
  static const Color purple = Color(0xFF9D50BB);
  static const Color deepPurple = Color(0xFF6E48AA);
  
  // Semantic Colors
  static const Color incomeGreen = Color(0xFF00E676);
  static const Color expenseRed = Color(0xFFFF5252);
  static const Color warningAmber = Color(0xFFFFB300);
  static const Color infoBlue = Color(0xFF2979FF);

  // Light Mode Neumorphism
  static const Color lightBg = Color(0xFFF0F2F5);
  static const Color lightSurface = Color(0xFFF0F2F5);
  static const Color lightShadowTop = Color(0xFFFFFFFF);
  static const Color lightShadowBottom = Color(0xFFD1D9E6);
  static const Color lightTextPrimary = Color(0xFF151C24);
  static const Color lightTextSecondary = Color(0xFF6C7A89);
  static const Color lightDivider = Color(0xFFE2E8F0);

  // Dark Mode Neumorphism
  static const Color darkBg = Color(0xFF111317);
  static const Color darkSurface = Color(0xFF181A1F);
  static const Color darkCardBg = Color(0xFF1A1C22);
  static const Color darkShadowTop = Color(0xFF262B34);
  static const Color darkShadowBottom = Color(0xFF0A0C0E);
  static const Color darkTextPrimary = Color(0xFFE2E2E8);
  static const Color darkTextSecondary = Color(0xFF8E9BAE);
  static const Color darkDivider = Color(0xFF22262E);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [cyan, purple],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient successGradient = LinearGradient(
    colors: [incomeGreen, cyan],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient dangerGradient = LinearGradient(
    colors: [expenseRed, Color(0xFFFF7676)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient darkCardGradient = LinearGradient(
    colors: [Color(0xFF1E2128), Color(0xFF14161B)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
