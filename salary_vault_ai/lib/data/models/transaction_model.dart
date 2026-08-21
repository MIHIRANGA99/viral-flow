class TransactionModel {
  final String id;
  final String title;
  final double amount;
  final String currency;
  final bool isIncome;
  final String category;
  final DateTime date;
  final String? notes;
  final bool isAutoLogged;
  final String? rawSourceText;
  final double? confidenceScore;
  final String? accountName;

  TransactionModel({
    required this.id,
    required this.title,
    required this.amount,
    this.currency = 'USD',
    required this.isIncome,
    required this.category,
    required this.date,
    this.notes,
    this.isAutoLogged = false,
    this.rawSourceText,
    this.confidenceScore,
    this.accountName,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'amount': amount,
      'currency': currency,
      'isIncome': isIncome,
      'category': category,
      'date': date.toIso8601String(),
      'notes': notes,
      'isAutoLogged': isAutoLogged,
      'rawSourceText': rawSourceText,
      'confidenceScore': confidenceScore,
      'accountName': accountName,
    };
  }

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['id'] as String,
      title: json['title'] as String,
      amount: (json['amount'] as num).toDouble(),
      currency: json['currency'] as String? ?? 'USD',
      isIncome: json['isIncome'] as bool? ?? false,
      category: json['category'] as String? ?? 'Others',
      date: DateTime.parse(json['date'] as String),
      notes: json['notes'] as String?,
      isAutoLogged: json['isAutoLogged'] as bool? ?? false,
      rawSourceText: json['rawSourceText'] as String?,
      confidenceScore: (json['confidenceScore'] as num?)?.toDouble(),
      accountName: json['accountName'] as String?,
    );
  }

  TransactionModel copyWith({
    String? id,
    String? title,
    double? amount,
    String? currency,
    bool? isIncome,
    String? category,
    DateTime? date,
    String? notes,
    bool? isAutoLogged,
    String? rawSourceText,
    double? confidenceScore,
    String? accountName,
  }) {
    return TransactionModel(
      id: id ?? this.id,
      title: title ?? this.title,
      amount: amount ?? this.amount,
      currency: currency ?? this.currency,
      isIncome: isIncome ?? this.isIncome,
      category: category ?? this.category,
      date: date ?? this.date,
      notes: notes ?? this.notes,
      isAutoLogged: isAutoLogged ?? this.isAutoLogged,
      rawSourceText: rawSourceText ?? this.rawSourceText,
      confidenceScore: confidenceScore ?? this.confidenceScore,
      accountName: accountName ?? this.accountName,
    );
  }
}
