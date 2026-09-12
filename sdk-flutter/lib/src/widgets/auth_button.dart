import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../provider/autheasy_state.dart';
import 'auth_modal.dart';

/// Drop-in button that opens the AuthModal on tap.
/// Shows user info + logout when already logged in.
///
/// ```dart
/// AuthButton(
///   theme: AuthButtonTheme.dark,
///   label: 'Sign In / Register',
/// )
/// ```
enum AuthButtonTheme { dark, light }

class AuthButton extends StatelessWidget {
  final AuthButtonTheme theme;
  final String label;
  final String loggedInLabel;

  const AuthButton({
    super.key,
    this.theme = AuthButtonTheme.dark,
    this.label = 'Sign In',
    this.loggedInLabel = 'Logout',
  });

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthEasyState>();

    if (auth.isAuthenticated) {
      return ElevatedButton.icon(
        onPressed: () => auth.logout(),
        icon: const Icon(Icons.logout_rounded, size: 16),
        label: Text('${auth.user?.name ?? ''} — $loggedInLabel'),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.red.shade700,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          elevation: 0,
        ),
      );
    }

    return ElevatedButton(
      onPressed: () => showAuthModal(context, isDark: theme == AuthButtonTheme.dark),
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFFC7A872),
        foregroundColor: const Color(0xFF0F172A),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      ),
      child: Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
    );
  }
}
