import 'package:flutter/foundation.dart';
import '../autheasy_client.dart';
import '../models/auth_user.dart';

/// State notifier that wraps [AuthEasyClient].
/// Use with [AuthEasyProvider] widget.
class AuthEasyState extends ChangeNotifier {
  final AuthEasyClient client;

  bool _loading = true;

  AuthEasyState({required String apiKey})
      : client = AuthEasyClient(apiKey: apiKey);

  /// True during initial session restore
  bool get loading => _loading;

  /// True if user is logged in
  bool get isAuthenticated => client.isAuthenticated;

  /// Currently logged in user
  AuthUser? get user => client.currentUser;

  /// Initialize and restore session
  Future<void> init() async {
    _loading = true;
    notifyListeners();
    await client.init();
    _loading = false;
    notifyListeners();
  }

  Future<void> login({required String email, required String password}) async {
    await client.login(email: email, password: password);
    notifyListeners();
  }

  Future<void> signup({
    required String email,
    required String password,
    String name = '',
    String phone = '',
  }) async {
    await client.signup(email: email, password: password, name: name, phone: phone);
    notifyListeners();
  }

  Future<void> verifyOtp({required String email, required String otp}) async {
    await client.verifyOtp(email: email, otp: otp);
    notifyListeners();
  }

  Future<void> resendOtp({required String email}) async {
    await client.resendOtp(email: email);
  }

  Future<void> logout() async {
    await client.logout();
    notifyListeners();
  }

  Future<void> forgotPassword({required String email}) async {
    await client.forgotPassword(email: email);
  }

  Future<void> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    await client.resetPassword(email: email, otp: otp, newPassword: newPassword);
    notifyListeners();
  }

  Future<String?> getAccessToken() => client.getAccessToken();
}
