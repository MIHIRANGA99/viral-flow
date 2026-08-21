import 'package:flutter/material.dart';
import '../../data/models/user_model.dart';
import '../../data/repositories/auth_repository.dart';

class AuthProvider with ChangeNotifier {
  final AuthRepository _authRepository;

  bool _isLoading = false;
  String? _errorMessage;

  AuthProvider(this._authRepository);

  bool get isAuthenticated => _authRepository.isAuthenticated;
  UserModel? get currentUser => _authRepository.currentUser;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> init() async {
    _isLoading = true;
    notifyListeners();
    await _authRepository.init();
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final success = await _authRepository.login(email, password);
      _isLoading = false;
      notifyListeners();
      return success;
    } catch (e) {
      _errorMessage = 'Invalid login credentials.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> verifyPin(String pin) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final success = await _authRepository.verifyPin(pin);
    if (!success) {
      _errorMessage = 'Incorrect Security PIN';
    }
    _isLoading = false;
    notifyListeners();
    return success;
  }

  Future<bool> unlockWithBiometrics() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final success = await _authRepository.authenticateWithBiometrics();
    _isLoading = false;
    notifyListeners();
    return success;
  }

  Future<void> logout() async {
    await _authRepository.logout();
    notifyListeners();
  }

  Future<void> updateUser(UserModel updated) async {
    await _authRepository.saveUser(updated);
    notifyListeners();
  }

  Future<void> updateMonitoredPackages(List<String> packages) async {
    if (_authRepository.currentUser != null) {
      final updated = _authRepository.currentUser!.copyWith(
        monitoredPackages: packages,
      );
      await updateUser(updated);
    }
  }

  Future<void> updateCurrency(String currency) async {
    if (_authRepository.currentUser != null) {
      final updated = _authRepository.currentUser!.copyWith(
        defaultCurrency: currency,
      );
      await updateUser(updated);
    }
  }
}
