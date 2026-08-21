import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/widgets/neu_container.dart';
import '../../../core/widgets/neu_card.dart';
import '../../../core/widgets/neu_button.dart';
import '../../../core/widgets/neu_badge.dart';
import '../../../data/services/native_bridge_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/transaction_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _isNotificationGranted = false;

  @override
  void initState() {
    super.initState();
    _checkNativePermissions();
  }

  Future<void> _checkNativePermissions() async {
    final nativeBridge = context.read<NativeBridgeService>();
    final isGranted = await nativeBridge.isNotificationAccessGranted();
    if (mounted) {
      setState(() {
        _isNotificationGranted = isGranted;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final themeProv = context.watch<ThemeProvider>();
    final auth = context.watch<AuthProvider>();
    final txProv = context.watch<TransactionProvider>();
    final nativeBridge = context.read<NativeBridgeService>();
    final user = auth.currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings & Preferences'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // User Profile Banner
              NeuCard(
                glowColor: AppColors.purple,
                padding: const EdgeInsets.all(18),
                child: Row(
                  children: [
                    NeuContainer(
                      isCircle: true,
                      width: 52,
                      height: 52,
                      gradient: AppColors.primaryGradient,
                      child: Center(
                        child: Text(
                          (user?.name.isNotEmpty ?? false)
                              ? user!.name[0].toUpperCase()
                              : 'A',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.name ?? 'Alex Sterling',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: isDark
                                  ? AppColors.darkTextPrimary
                                  : AppColors.lightTextPrimary,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            user?.email ?? 'alex.sterling@salaryvault.ai',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const NeuBadge(
                      label: 'PRO VAULT',
                      color: AppColors.purple,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Native Android Permissions & Live Interception Setup
              _buildSectionHeader('REAL-TIME HARDWARE & OS PERMISSIONS', isDark),
              const SizedBox(height: 8),
              NeuCard(
                glowColor: _isNotificationGranted ? AppColors.incomeGreen : AppColors.cyan,
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.security_update_good_rounded,
                                color: AppColors.cyan, size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Notification Listener Access',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppColors.cyan,
                              ),
                            ),
                          ],
                        ),
                        NeuBadge(
                          label: _isNotificationGranted ? 'ACTIVE' : 'SETUP REQUIRED',
                          color: _isNotificationGranted
                              ? AppColors.incomeGreen
                              : AppColors.warningAmber,
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      _isNotificationGranted
                          ? 'Android NotificationListenerService is active and capturing banking alerts in real-time.'
                          : 'Grant system Notification Access in Android Settings to intercept real incoming banking push notifications.',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.lightTextSecondary,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: NeuButton(
                            text: _isNotificationGranted
                                ? 'Recheck Access'
                                : 'Grant Access in Android Settings',
                            icon: Icons.open_in_new_rounded,
                            gradient: _isNotificationGranted
                                ? null
                                : AppColors.primaryGradient,
                            glowColor: AppColors.cyan,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 10),
                            onPressed: () async {
                              if (!_isNotificationGranted) {
                                await nativeBridge.openNotificationSettings();
                              }
                              await _checkNativePermissions();
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    NeuButton(
                      text: 'Request SMS Permission',
                      icon: Icons.sms_rounded,
                      customColor: isDark
                          ? AppColors.darkSurface
                          : AppColors.lightSurface,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                      onPressed: () async {
                        await nativeBridge.requestSmsPermissions();
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Requested SMS runtime permission'),
                              backgroundColor: AppColors.cyan,
                            ),
                          );
                        }
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Appearance Section
              _buildSectionHeader('APPEARANCE & THEME', isDark),
              const SizedBox(height: 8),
              NeuContainer(
                borderRadius: 18,
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.warningAmber.withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        themeProv.isDarkMode
                            ? Icons.dark_mode_rounded
                            : Icons.light_mode_rounded,
                        color: AppColors.warningAmber,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Dark Mode Theme',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: isDark
                                  ? AppColors.darkTextPrimary
                                  : AppColors.lightTextPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            themeProv.isDarkMode
                                ? 'Deep Slate Soft UI (#111317)'
                                : 'Soft Grey Neumorphic (#F0F2F5)',
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
                    Switch(
                      value: themeProv.isDarkMode,
                      activeColor: AppColors.cyan,
                      onChanged: (val) => themeProv.toggleTheme(),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Currency Selection
              _buildSectionHeader('VAULT CURRENCY', isDark),
              const SizedBox(height: 8),
              NeuContainer(
                borderRadius: 18,
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: user?.defaultCurrency ?? 'USD',
                    isExpanded: true,
                    dropdownColor: isDark
                        ? AppColors.darkSurface
                        : AppColors.lightSurface,
                    items: AppConstants.supportedCurrencies.map((curr) {
                      final sym = AppConstants.currencySymbols[curr] ?? '';
                      return DropdownMenuItem<String>(
                        value: curr,
                        child: Row(
                          children: [
                            Text(
                              sym,
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                color: AppColors.cyan,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              curr,
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: isDark
                                    ? AppColors.darkTextPrimary
                                    : AppColors.lightTextPrimary,
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        auth.updateCurrency(val);
                      }
                    },
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Monitored Apps & Packages Configuration
              _buildSectionHeader('MONITORED NOTIFICATION APPS', isDark),
              const SizedBox(height: 8),
              NeuContainer(
                borderRadius: 18,
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: AppConstants.defaultMonitoredPackages.map((pkg) {
                    final isMonitored = user?.monitoredPackages
                            .contains(pkg['packageName']) ??
                        true;

                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.cyan.withOpacity(0.12),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.notifications_active_rounded,
                              size: 16,
                              color: AppColors.cyan,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  pkg['appName']!,
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: isDark
                                        ? AppColors.darkTextPrimary
                                        : AppColors.lightTextPrimary,
                                  ),
                                ),
                                Text(
                                  pkg['desc']!,
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
                          Checkbox(
                            value: isMonitored,
                            activeColor: AppColors.cyan,
                            onChanged: (checked) {
                              final currentList = List<String>.from(
                                  user?.monitoredPackages ?? []);
                              if (checked == true) {
                                currentList.add(pkg['packageName']!);
                              } else {
                                currentList.remove(pkg['packageName']);
                              }
                              auth.updateMonitoredPackages(currentList);
                            },
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 20),

              // Android Homescreen Widget Configuration
              _buildSectionHeader('ANDROID HOMESCREEN WIDGET', isDark),
              const SizedBox(height: 8),
              NeuCard(
                glowColor: AppColors.incomeGreen,
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.widgets_rounded,
                            color: AppColors.incomeGreen, size: 20),
                        SizedBox(width: 10),
                        Text(
                          'Salary Vault Mini Widget',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.incomeGreen,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Shows live net balance, today\'s spend, and 1-tap quick action buttons on your Android launcher screen.',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.lightTextSecondary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    NeuButton(
                      text: 'Sync Homescreen Widget Now',
                      icon: Icons.sync_rounded,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      onPressed: () async {
                        await nativeBridge.syncWidget();
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                  'Native Homescreen Widget state refreshed successfully!'),
                              backgroundColor: AppColors.incomeGreen,
                            ),
                          );
                        }
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Data Management & Reset
              _buildSectionHeader('VAULT DATA MANAGEMENT', isDark),
              const SizedBox(height: 8),
              NeuButton(
                text: 'Reset Demo Transactions',
                icon: Icons.restore_rounded,
                customColor: isDark
                    ? AppColors.darkSurface
                    : AppColors.lightSurface,
                onPressed: () async {
                  final messenger = ScaffoldMessenger.of(context);
                  await txProv.resetDemoData();
                  await nativeBridge.syncWidget();
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text('Vault reset to demo transaction data.'),
                      backgroundColor: AppColors.cyan,
                    ),
                  );
                },
              ),
              const SizedBox(height: 14),

              NeuButton(
                text: 'Sign Out / Lock Vault',
                icon: Icons.lock_outline_rounded,
                customColor: AppColors.expenseRed.withOpacity(0.12),
                textColor: AppColors.expenseRed,
                iconColor: AppColors.expenseRed,
                onPressed: () async {
                  await auth.logout();
                },
              ),
              const SizedBox(height: 90),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, bool isDark) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.0,
        color: isDark
            ? AppColors.darkTextSecondary
            : AppColors.lightTextSecondary,
      ),
    );
  }
}
