import 'dart:async';
import 'package:flutter/services.dart';
import 'ai_notification_parser.dart';
import '../repositories/transaction_repository.dart';

class NativeBridgeService {
  static const MethodChannel _methodChannel =
      MethodChannel('com.salaryvault.ai/bridge');
  static const EventChannel _eventChannel =
      EventChannel('com.salaryvault.ai/events');

  final TransactionRepository _transactionRepository;
  StreamSubscription? _eventSubscription;
  final _onAutoLoggedController = StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get onAutoLoggedStream => _onAutoLoggedController.stream;

  NativeBridgeService(this._transactionRepository);

  void startListening() {
    _eventSubscription?.cancel();
    _eventSubscription = _eventChannel.receiveBroadcastStream().listen(
      (event) async {
        if (event is Map) {
          final rawText = event['text']?.toString() ?? '';
          final source = event['source']?.toString() ?? 'NOTIFICATION';
          final pkg = event['package']?.toString() ?? event['sender']?.toString() ?? 'Unknown';

          if (rawText.isNotEmpty) {
            // Run on-device AI parser
            final parsedResult = AiNotificationParser.parse(rawText);
            if (parsedResult.isTransaction) {
              final tx = await _transactionRepository.addFromAiParsed(parsedResult);
              _onAutoLoggedController.add({
                'transaction': tx,
                'source': source,
                'package': pkg,
                'parsed': parsedResult,
              });

              // Sync Android homescreen widget
              await syncWidget();
            }
          }
        }
      },
      onError: (err) {
        // Logging or handling native stream error
      },
    );
  }

  void stopListening() {
    _eventSubscription?.cancel();
  }

  Future<bool> isNotificationAccessGranted() async {
    try {
      final bool granted =
          await _methodChannel.invokeMethod('isNotificationListenerEnabled') ?? false;
      return granted;
    } catch (e) {
      return false;
    }
  }

  Future<void> openNotificationSettings() async {
    try {
      await _methodChannel.invokeMethod('openNotificationListenerSettings');
    } catch (e) {
      // Ignored
    }
  }

  Future<void> requestSmsPermissions() async {
    try {
      await _methodChannel.invokeMethod('requestSmsPermissions');
    } catch (e) {
      // Ignored
    }
  }

  Future<void> syncWidget() async {
    try {
      final netBalance = _transactionRepository.netVaultBalance;
      final totalIncome = _transactionRepository.totalIncome;
      final totalExpense = _transactionRepository.totalExpense;
      final health = totalIncome > 0
          ? '${(((totalIncome - totalExpense) / totalIncome) * 100).clamp(0, 100).toInt()}%'
          : '100%';

      await _methodChannel.invokeMethod('updateWidget', {
        'balance': '\$${netBalance.toStringAsFixed(2)}',
        'todaySpend': '\$${totalExpense.toStringAsFixed(2)}',
        'health': health,
      });
    } catch (e) {
      // Ignored
    }
  }
}
