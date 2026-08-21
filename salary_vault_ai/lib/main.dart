import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'core/constants/app_theme.dart';
import 'data/repositories/auth_repository.dart';
import 'data/repositories/transaction_repository.dart';
import 'data/services/native_bridge_service.dart';
import 'presentation/providers/auth_provider.dart';
import 'presentation/providers/theme_provider.dart';
import 'presentation/providers/transaction_provider.dart';
import 'presentation/providers/ai_detector_provider.dart';
import 'presentation/screens/auth/login_screen.dart';
import 'presentation/screens/home/main_navigation_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );

  final authRepo = AuthRepository();
  final txRepo = TransactionRepository();

  await authRepo.init();
  await txRepo.init();

  final nativeBridge = NativeBridgeService(txRepo);
  nativeBridge.startListening();
  await nativeBridge.syncWidget();

  runApp(
    MultiProvider(
      providers: [
        Provider<NativeBridgeService>.value(value: nativeBridge),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider(authRepo)),
        ChangeNotifierProvider(create: (_) => TransactionProvider(txRepo)),
        ChangeNotifierProvider(create: (_) => AiDetectorProvider()),
      ],
      child: const SalaryVaultAiApp(),
    ),
  );
}

class SalaryVaultAiApp extends StatelessWidget {
  const SalaryVaultAiApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final themeProv = context.watch<ThemeProvider>();
    final authProv = context.watch<AuthProvider>();

    return MaterialApp(
      title: 'Salary Vault AI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeProv.themeMode,
      home: authProv.isAuthenticated
          ? const MainNavigationScreen()
          : const LoginScreen(),
    );
  }
}
