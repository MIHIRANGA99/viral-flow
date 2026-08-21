import 'package:flutter_test/flutter_test.dart';
import 'package:salary_vault_ai/data/services/ai_notification_parser.dart';

void main() {
  group('AiNotificationParser Test Suite', () {
    test('Correctly parses Starbucks debit notification', () {
      const sms =
          'Your Card ending 4291 was debited with USD 14.75 at Starbucks Reserve on 17-Aug. Avl Bal: USD 3,420.50.';
      final result = AiNotificationParser.parse(sms);

      expect(result.isTransaction, isTrue);
      expect(result.isIncome, isFalse);
      expect(result.amount, equals(14.75));
      expect(result.currency, equals('USD'));
      expect(result.predictedCategory, equals('Food & Dining'));
      expect(result.transactionType, equals('DEBIT'));
      expect(result.confidence, greaterThan(0.85));
    });

    test('Correctly parses Salary Credit notification', () {
      const sms =
          'Dear Alex, your A/C ending with 4291 has been credited with USD 5,200.00 towards Monthly Salary from Tech Corp Inc.';
      final result = AiNotificationParser.parse(sms);

      expect(result.isTransaction, isTrue);
      expect(result.isIncome, isTrue);
      expect(result.amount, equals(5200.00));
      expect(result.currency, equals('USD'));
      expect(result.predictedCategory, equals('Salary'));
      expect(result.transactionType, equals('CREDIT'));
      expect(result.confidence, greaterThan(0.90));
    });

    test('Correctly categorizes Uber rides as Transport & Fuel', () {
      const sms =
          'Payment of USD 32.50 to Uber Ride Downtown successful via Visa ending 8823.';
      final result = AiNotificationParser.parse(sms);

      expect(result.isTransaction, isTrue);
      expect(result.isIncome, isFalse);
      expect(result.amount, equals(32.50));
      expect(result.predictedCategory, equals('Transport & Fuel'));
    });

    test('Filters out non-financial OTP messages', () {
      const sms =
          'Your one-time password (OTP) is 849201. Valid for 5 mins. Do not share this secret code with anyone.';
      final result = AiNotificationParser.parse(sms);

      expect(result.isTransaction, isFalse);
      expect(result.transactionType, equals('IGNORED'));
    });

    test('Correctly parses Freelance Payout as Income', () {
      const sms =
          'Wire transfer received: USD 850.00 from Upwork Global Escrow has been credited into your checking account.';
      final result = AiNotificationParser.parse(sms);

      expect(result.isTransaction, isTrue);
      expect(result.isIncome, isTrue);
      expect(result.amount, equals(850.00));
      expect(result.predictedCategory, equals('Freelance & Business'));
    });
  });
}
