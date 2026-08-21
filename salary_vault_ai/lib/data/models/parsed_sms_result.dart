class ParsedSmsResult {
  final bool isTransaction;
  final String merchant;
  final double amount;
  final String currency;
  final bool isIncome;
  final String predictedCategory;
  final double confidence;
  final String? accountNumber;
  final String transactionType; // 'DEBIT', 'CREDIT', 'TRANSFER', 'OTP_IGNORED', 'UNKNOWN'
  final String rawText;
  final Map<String, dynamic> extractedEntities;

  ParsedSmsResult({
    required this.isTransaction,
    required this.merchant,
    required this.amount,
    required this.currency,
    required this.isIncome,
    required this.predictedCategory,
    required this.confidence,
    this.accountNumber,
    required this.transactionType,
    required this.rawText,
    this.extractedEntities = const {},
  });

  factory ParsedSmsResult.nonTransaction(String rawText, {String reason = 'Non-financial text / OTP'}) {
    return ParsedSmsResult(
      isTransaction: false,
      merchant: 'N/A',
      amount: 0.0,
      currency: 'USD',
      isIncome: false,
      predictedCategory: 'None',
      confidence: 0.0,
      transactionType: 'IGNORED',
      rawText: rawText,
      extractedEntities: {'reason': reason},
    );
  }
}
