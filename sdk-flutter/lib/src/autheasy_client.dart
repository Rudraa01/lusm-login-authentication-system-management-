import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'models/auth_user.dart';
import 'models/auth_result.dart';

/// Core AuthEasy API client.
/// Handles all HTTP calls and secure token storage.
///
/// Typically you won't use this directly — use [AuthEasyProvider] instead.
/// But you can use it standalone if you prefer manual state management.
///
/// ```dart
/// final client = AuthEasyClient(apiKey: 'ae_live_xxxxxxxxxxxx');
/// await client.init(); // restore session
///
/// final result = await client.login(email: 'user@example.com', password: 'Pass@123');
/// print(result.user?.name);
/// ```
class AuthEasyClient {
  static const String _baseUrl = 'https://autheasy.me/api/v1/auth';

  static const String _keyToken   = 'autheasy_access_token';
  static const String _keyRefresh = 'autheasy_refresh_token';
  static const String _keyUser    = 'autheasy_user';

  final String apiKey;
  final _storage = const FlutterSecureStorage();

  AuthUser? _currentUser;
  String?   _accessToken;

  /// Currently logged-in user (null if not authenticated)
  AuthUser? get currentUser => _currentUser;

  /// True if user is logged in
  bool get isAuthenticated => _currentUser != null && _accessToken != null;

  /// The current JWT access token
  String? get accessToken => _accessToken;

  AuthEasyClient({required this.apiKey});

  // ── init ───────────────────────────────────────────────────────────────────
  /// Call this once at app startup to restore saved session.
  ///
  /// ```dart
  /// await client.init();
  /// if (client.isAuthenticated) {
  ///   // go to home screen
  /// }
  /// ```
  Future<void> init() async {
    try {
      final token    = await _storage.read(key: _keyToken);
      final userJson = await _storage.read(key: _keyUser);

      if (token != null && userJson != null) {
        _accessToken  = token;
        _currentUser  = AuthUser.fromJson(jsonDecode(userJson));
      }
    } catch (_) {
      await _clearSession();
    }
  }

  // ── signup ─────────────────────────────────────────────────────────────────
  /// Register a new user. Sends OTP to their email.
  /// After this call verifyOtp() to complete registration.
  ///
  /// ```dart
  /// await client.signup(email: 'user@example.com', password: 'Pass@123', name: 'John');
  /// ```
  ///
  /// Throws [AuthEasyException] on failure.
  Future<AuthResult> signup({
    required String email,
    required String password,
    String name = '',
    String phone = '',
  }) async {
    final data = await _post('/register', {
      'email':    email,
      'password': password,
      'name':     name,
      'phone':    phone,
    });
    return AuthResult(
      success: true,
      message: data['message'] as String? ?? 'OTP sent to email.',
    );
  }

  // ── verifyOtp ──────────────────────────────────────────────────────────────
  /// Verify OTP after signup. Auto-logs in user on success.
  ///
  /// ```dart
  /// final result = await client.verifyOtp(email: 'user@example.com', otp: '123456');
  /// print(result.user?.name); // "John"
  /// ```
  Future<AuthResult> verifyOtp({
    required String email,
    required String otp,
  }) async {
    final data = await _post('/verify-otp', {'email': email, 'otp': otp});
    return _handleAuthResponse(data);
  }

  // ── resendOtp ──────────────────────────────────────────────────────────────
  /// Resend OTP to user's email.
  Future<AuthResult> resendOtp({required String email}) async {
    final data = await _post('/resend-otp', {'email': email});
    return AuthResult(
      success: true,
      message: data['message'] as String? ?? 'OTP resent.',
    );
  }

  // ── login ──────────────────────────────────────────────────────────────────
  /// Login with email and password. Session saved automatically.
  ///
  /// ```dart
  /// final result = await client.login(email: 'user@example.com', password: 'Pass@123');
  /// if (result.success) {
  ///   print('Logged in as ${result.user?.name}');
  /// }
  /// ```
  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    final data = await _post('/login', {'email': email, 'password': password});
    return _handleAuthResponse(data);
  }

  // ── logout ─────────────────────────────────────────────────────────────────
  /// Log out and clear saved session.
  ///
  /// ```dart
  /// await client.logout();
  /// ```
  Future<void> logout() async {
    await _clearSession();
  }

  // ── forgotPassword ─────────────────────────────────────────────────────────
  /// Send a password reset OTP to user's email.
  ///
  /// ```dart
  /// await client.forgotPassword(email: 'user@example.com');
  /// ```
  Future<AuthResult> forgotPassword({required String email}) async {
    final data = await _post('/forgot-password', {'email': email});
    return AuthResult(
      success: true,
      message: data['message'] as String? ?? 'OTP sent.',
    );
  }

  // ── resetPassword ──────────────────────────────────────────────────────────
  /// Reset password using OTP.
  ///
  /// ```dart
  /// await client.resetPassword(
  ///   email: 'user@example.com',
  ///   otp: '123456',
  ///   newPassword: 'NewPass@456',
  /// );
  /// ```
  Future<AuthResult> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    final data = await _post('/reset-password', {
      'email':       email,
      'otp':         otp,
      'newPassword': newPassword,
    });
    return AuthResult(
      success: true,
      message: data['message'] as String? ?? 'Password reset successfully.',
    );
  }

  // ── getAccessToken ─────────────────────────────────────────────────────────
  /// Get raw JWT for your own authenticated API calls.
  ///
  /// ```dart
  /// final token = await client.getAccessToken();
  /// final res = await http.get(
  ///   Uri.parse('https://my-backend.com/api/profile'),
  ///   headers: {'Authorization': 'Bearer $token'},
  /// );
  /// ```
  Future<String?> getAccessToken() async {
    return _storage.read(key: _keyToken);
  }

  // ── Private helpers ────────────────────────────────────────────────────────
  Future<AuthResult> _handleAuthResponse(Map<String, dynamic> data) async {
    final inner = data['data'] as Map<String, dynamic>?;
    if (inner == null) {
      throw const AuthEasyException('Invalid response from server.');
    }

    final user         = AuthUser.fromJson(inner['user'] as Map<String, dynamic>);
    final accessToken  = inner['accessToken'] as String;
    final refreshToken = inner['refreshToken'] as String?;

    await _saveSession(user, accessToken, refreshToken);

    return AuthResult(
      success:      true,
      message:      data['message'] as String? ?? 'Success.',
      user:         user,
      accessToken:  accessToken,
      refreshToken: refreshToken,
    );
  }

  Future<void> _saveSession(AuthUser user, String token, String? refresh) async {
    _currentUser = user;
    _accessToken = token;
    await _storage.write(key: _keyToken, value: token);
    await _storage.write(key: _keyUser,  value: jsonEncode(user.toJson()));
    if (refresh != null) {
      await _storage.write(key: _keyRefresh, value: refresh);
    }
  }

  Future<void> _clearSession() async {
    _currentUser = null;
    _accessToken = null;
    await _storage.deleteAll();
  }

  Future<Map<String, dynamic>> _post(
    String endpoint,
    Map<String, dynamic> body,
  ) async {
    final uri = Uri.parse('$_baseUrl$endpoint');
    final res = await http.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key':    apiKey,
        // No Origin header needed for mobile apps
      },
      body: jsonEncode(body),
    );

    final decoded = jsonDecode(res.body) as Map<String, dynamic>;

    if (res.statusCode < 200 || res.statusCode >= 300) {
      final msg = decoded['message'] as String? ?? 'AuthEasy error';
      throw AuthEasyException(msg, statusCode: res.statusCode);
    }

    return decoded;
  }
}
