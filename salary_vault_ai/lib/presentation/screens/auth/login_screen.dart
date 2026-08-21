import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/widgets/neu_container.dart';
import '../../../core/widgets/neu_button.dart';
import '../../../core/widgets/neu_text_field.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _emailController =
      TextEditingController(text: 'alex.sterling@salaryvault.ai');
  final TextEditingController _passwordController =
      TextEditingController(text: '••••••••');
  String _pin = '';
  bool _isPinMode = true;

  void _onPinDigit(String digit) {
    if (_pin.length < 4) {
      HapticFeedback.lightImpact();
      setState(() {
        _pin += digit;
      });
      if (_pin.length == 4) {
        _verifyPin();
      }
    }
  }

  void _onPinBackspace() {
    if (_pin.isNotEmpty) {
      HapticFeedback.lightImpact();
      setState(() {
        _pin = _pin.substring(0, _pin.length - 1);
      });
    }
  }

  void _verifyPin() async {
    final auth = context.read<AuthProvider>();
    final success = await auth.verifyPin(_pin);
    if (!success && mounted) {
      HapticFeedback.heavyImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Incorrect PIN. Default demo PIN is 1234'),
          backgroundColor: AppColors.expenseRed,
        ),
      );
      setState(() => _pin = '');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final auth = context.watch<AuthProvider>();
    final themeProv = context.watch<ThemeProvider>();

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            children: [
              // Top Bar with Theme Toggle
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const NeuContainer(
                    isCircle: true,
                    width: 44,
                    height: 44,
                    child: Icon(
                      Icons.shield_rounded,
                      color: AppColors.cyan,
                      size: 22,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => themeProv.toggleTheme(),
                    child: NeuContainer(
                      isCircle: true,
                      width: 44,
                      height: 44,
                      child: Icon(
                        themeProv.isDarkMode
                            ? Icons.light_mode_rounded
                            : Icons.dark_mode_rounded,
                        color: AppColors.warningAmber,
                        size: 20,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 30),

              // Logo & App Name with Glowing Accents
              Center(
                child: Column(
                  children: [
                    const NeuContainer(
                      isCircle: true,
                      width: 86,
                      height: 86,
                      glowColor: AppColors.cyan,
                      glowSpread: 4,
                      gradient: AppColors.primaryGradient,
                      child: Center(
                        child: Icon(
                          Icons.account_balance_wallet_rounded,
                          size: 42,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    ShaderMask(
                      shaderCallback: (bounds) =>
                          AppColors.primaryGradient.createShader(bounds),
                      child: const Text(
                        AppConstants.appName,
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'AI-Powered Automated Expense Vault',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 36),

              // PIN Mode vs Email Mode Toggle
              NeuContainer(
                borderRadius: 14,
                padding: const EdgeInsets.all(4),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _isPinMode = true),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: _isPinMode
                              ? BoxDecoration(
                                  gradient: AppColors.primaryGradient,
                                  borderRadius: BorderRadius.circular(10),
                                )
                              : null,
                          child: Center(
                            child: Text(
                              'Quick PIN Lock',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: _isPinMode
                                    ? Colors.white
                                    : (isDark
                                        ? AppColors.darkTextSecondary
                                        : AppColors.lightTextSecondary),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _isPinMode = false),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: !_isPinMode
                              ? BoxDecoration(
                                  gradient: AppColors.primaryGradient,
                                  borderRadius: BorderRadius.circular(10),
                                )
                              : null,
                          child: Center(
                            child: Text(
                              'Email / Password',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: !_isPinMode
                                    ? Colors.white
                                    : (isDark
                                        ? AppColors.darkTextSecondary
                                        : AppColors.lightTextSecondary),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              if (_isPinMode) ...[
                // PIN Indicator Dots
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(4, (index) {
                    final isFilled = index < _pin.length;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      margin: const EdgeInsets.symmetric(horizontal: 10),
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: isFilled ? AppColors.primaryGradient : null,
                        color: isFilled
                            ? null
                            : (isDark
                                ? AppColors.darkSurface
                                : AppColors.lightShadowBottom),
                        boxShadow: isFilled
                            ? [
                                BoxShadow(
                                  color: AppColors.cyan.withOpacity(0.5),
                                  blurRadius: 10,
                                  spreadRadius: 2,
                                ),
                              ]
                            : null,
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 30),

                // Neumorphic PIN Keypad
                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 3,
                  mainAxisSpacing: 14,
                  crossAxisSpacing: 18,
                  childAspectRatio: 1.3,
                  children: [
                    ...List.generate(9, (index) {
                      final digit = (index + 1).toString();
                      return NeuButton(
                        text: digit,
                        borderRadius: 16,
                        onPressed: () => _onPinDigit(digit),
                      );
                    }),
                    // Biometrics Button
                    NeuButton(
                      icon: Icons.fingerprint_rounded,
                      iconColor: AppColors.cyan,
                      borderRadius: 16,
                      glowColor: AppColors.cyan,
                      onPressed: () async {
                        HapticFeedback.lightImpact();
                        await auth.unlockWithBiometrics();
                      },
                    ),
                    NeuButton(
                      text: '0',
                      borderRadius: 16,
                      onPressed: () => _onPinDigit('0'),
                    ),
                    NeuButton(
                      icon: Icons.backspace_rounded,
                      iconColor: AppColors.expenseRed,
                      borderRadius: 16,
                      onPressed: _onPinBackspace,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  'Default Demo PIN: 1234 or tap Fingerprint',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark
                        ? AppColors.darkTextSecondary
                        : AppColors.lightTextSecondary,
                  ),
                ),
              ] else ...[
                // Email & Password Fields
                NeuTextField(
                  controller: _emailController,
                  labelText: 'Email Address',
                  prefixIcon: Icons.email_rounded,
                ),
                const SizedBox(height: 16),
                NeuTextField(
                  controller: _passwordController,
                  labelText: 'Password',
                  obscureText: true,
                  prefixIcon: Icons.lock_rounded,
                ),
                const SizedBox(height: 28),
                NeuButton(
                  text: 'Access Secure Vault',
                  gradient: AppColors.primaryGradient,
                  glowColor: AppColors.cyan,
                  isLoading: auth.isLoading,
                  onPressed: () {
                    auth.login(
                      _emailController.text,
                      _passwordController.text,
                    );
                  },
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
