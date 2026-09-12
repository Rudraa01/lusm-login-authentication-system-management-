import 'auth_user.dart';

/// Result returned from auth operations
class AuthResult {
  final bool success;
  final String message;
  final AuthUser? user;
  final String? accessToken;
  final String? refreshToken;

  const AuthResult({
    required this.success,
    required this.message,
    this.user,
    this.accessToken,
    this.refreshToken,
  });

  @override
  String toString() =>
      'AuthResult(success: $success, message: $message, user: $user)';
}

/// Thrown when an AuthEasy API call fails
class AuthEasyException implements Exception {
  final String message;
  final int? statusCode;

  const AuthEasyException(this.message, {this.statusCode});

  @override
  String toString() => 'AuthEasyException: $message (status: $statusCode)';
}
