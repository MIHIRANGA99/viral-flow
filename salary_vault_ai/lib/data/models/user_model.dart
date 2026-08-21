class UserModel {
  final String id;
  final String name;
  final String email;
  final String defaultCurrency;
  final double monthlyBudget;
  final bool isBiometricEnabled;
  final bool isDarkMode;
  final List<String> monitoredPackages;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.defaultCurrency = 'USD',
    this.monthlyBudget = 4500.0,
    this.isBiometricEnabled = true,
    this.isDarkMode = true,
    this.monitoredPackages = const [
      'com.google.android.apps.messaging',
      'com.google.android.apps.nbu.paisa.user',
      'com.paypal.android.p2pmobile',
      'com.revolut.revolut',
    ],
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'defaultCurrency': defaultCurrency,
      'monthlyBudget': monthlyBudget,
      'isBiometricEnabled': isBiometricEnabled,
      'isDarkMode': isDarkMode,
      'monitoredPackages': monitoredPackages,
    };
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      defaultCurrency: json['defaultCurrency'] as String? ?? 'USD',
      monthlyBudget: (json['monthlyBudget'] as num?)?.toDouble() ?? 4500.0,
      isBiometricEnabled: json['isBiometricEnabled'] as bool? ?? true,
      isDarkMode: json['isDarkMode'] as bool? ?? true,
      monitoredPackages: (json['monitoredPackages'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
    );
  }

  UserModel copyWith({
    String? id,
    String? name,
    String? email,
    String? defaultCurrency,
    double? monthlyBudget,
    bool? isBiometricEnabled,
    bool? isDarkMode,
    List<String>? monitoredPackages,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      defaultCurrency: defaultCurrency ?? this.defaultCurrency,
      monthlyBudget: monthlyBudget ?? this.monthlyBudget,
      isBiometricEnabled: isBiometricEnabled ?? this.isBiometricEnabled,
      isDarkMode: isDarkMode ?? this.isDarkMode,
      monitoredPackages: monitoredPackages ?? this.monitoredPackages,
    );
  }
}
