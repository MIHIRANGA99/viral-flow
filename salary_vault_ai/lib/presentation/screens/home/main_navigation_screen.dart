import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/widgets/neu_bottom_nav_bar.dart';
import '../../../core/widgets/neu_button.dart';
import '../dashboard/dashboard_screen.dart';
import '../analytics/analytics_screen.dart';
import '../ai_detector/ai_detector_screen.dart';
import '../settings/settings_screen.dart';
import '../dashboard/widgets/quick_action_sheet.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({Key? key}) : super(key: key);

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    DashboardScreen(),
    AnalyticsScreen(),
    AiDetectorScreen(),
    SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 30),
        child: NeuButton(
          isCircle: true,
          width: 58,
          height: 58,
          gradient: AppColors.primaryGradient,
          glowColor: AppColors.cyan,
          icon: Icons.add_rounded,
          iconColor: Colors.white,
          onPressed: () => QuickActionSheet.show(context),
        ),
      ),
      bottomNavigationBar: NeuBottomNavBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
      ),
    );
  }
}
