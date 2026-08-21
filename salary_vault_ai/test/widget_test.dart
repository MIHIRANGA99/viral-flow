import 'package:flutter_test/flutter_test.dart';
import 'package:salary_vault_ai/core/constants/app_constants.dart';
import 'package:salary_vault_ai/data/models/transaction_model.dart';

void main() {
  test('TransactionModel serialization smoke test', () {
    final tx = TransactionModel(
      id: 'test-1',
      title: 'Coffee Test',
      amount: 4.50,
      currency: 'USD',
      isIncome: false,
      category: 'Food & Dining',
      date: DateTime(2026, 8, 17),
    );

    final json = tx.toJson();
    final restored = TransactionModel.fromJson(json);

    expect(restored.id, equals('test-1'));
    expect(restored.title, equals('Coffee Test'));
    expect(restored.amount, equals(4.50));
    expect(restored.category, equals('Food & Dining'));
  });

  test('AppConstants contains expected default categories', () {
    expect(AppConstants.defaultCategories, isNotEmpty);
    expect(
      AppConstants.defaultCategories.any((c) => c['name'] == 'Salary'),
      isTrue,
    );
    expect(
      AppConstants.defaultCategories.any((c) => c['name'] == 'Food & Dining'),
      isTrue,
    );
  });
}
