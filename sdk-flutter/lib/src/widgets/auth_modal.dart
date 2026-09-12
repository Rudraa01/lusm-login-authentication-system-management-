import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../provider/autheasy_state.dart';

/// Drop-in login/signup bottom sheet modal for Flutter.
///
/// ```dart
/// // Show the auth modal
/// showAuthModal(context);
/// ```
///
/// Or embed inline:
/// ```dart
/// AuthModal(onSuccess: () => Navigator.pop(context))
/// ```
void showAuthModal(BuildContext context, {bool isDark = true}) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => AuthModal(isDark: isDark),
  );
}

class AuthModal extends StatefulWidget {
  final bool isDark;
  final VoidCallback? onSuccess;

  const AuthModal({super.key, this.isDark = true, this.onSuccess});

  @override
  State<AuthModal> createState() => _AuthModalState();
}

class _AuthModalState extends State<AuthModal> {
  String _mode = 'login'; // 'login' | 'signup' | 'otp'

  final _emailCtrl    = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _nameCtrl     = TextEditingController();
  final _otpCtrl      = TextEditingController();

  bool   _loading = false;
  String _error   = '';
  String _success = '';

  static const _accent = Color(0xFFC7A872);

  Color get _bg       => widget.isDark ? const Color(0xFF111827) : Colors.white;
  Color get _border   => widget.isDark ? const Color(0xFF1F2937) : const Color(0xFFE5E7EB);
  Color get _inputBg  => widget.isDark ? const Color(0xFF1E293B) : const Color(0xFFF9FAFB);
  Color get _inputBdr => widget.isDark ? const Color(0xFF334155) : const Color(0xFFD1D5DB);
  Color get _textMain => widget.isDark ? const Color(0xFFF8FAFC) : const Color(0xFF111827);
  Color get _textMute => widget.isDark ? const Color(0xFF94A3B8) : const Color(0xFF9CA3AF);

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _nameCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  void _setStatus({bool loading = false, String error = '', String success = ''}) {
    setState(() {
      _loading = loading;
      _error   = error;
      _success = success;
    });
  }

  Future<void> _handleLogin() async {
    _setStatus(loading: true);
    try {
      final auth = context.read<AuthEasyState>();
      await auth.login(email: _emailCtrl.text.trim(), password: _passwordCtrl.text);
      if (mounted) {
        Navigator.pop(context);
        widget.onSuccess?.call();
      }
    } catch (e) {
      _setStatus(error: e.toString().replaceFirst('AuthEasyException: ', ''));
    }
  }

  Future<void> _handleSignup() async {
    _setStatus(loading: true);
    try {
      final auth = context.read<AuthEasyState>();
      await auth.signup(
        email: _emailCtrl.text.trim(),
        password: _passwordCtrl.text,
        name: _nameCtrl.text.trim(),
      );
      _setStatus(success: 'OTP bheja gaya! Email check karo.');
      setState(() => _mode = 'otp');
    } catch (e) {
      _setStatus(error: e.toString().replaceFirst('AuthEasyException: ', ''));
    }
  }

  Future<void> _handleOtp() async {
    _setStatus(loading: true);
    try {
      final auth = context.read<AuthEasyState>();
      await auth.verifyOtp(email: _emailCtrl.text.trim(), otp: _otpCtrl.text.trim());
      if (mounted) {
        Navigator.pop(context);
        widget.onSuccess?.call();
      }
    } catch (e) {
      _setStatus(error: e.toString().replaceFirst('AuthEasyException: ', ''));
    }
  }

  Future<void> _handleResend() async {
    try {
      final auth = context.read<AuthEasyState>();
      await auth.resendOtp(email: _emailCtrl.text.trim());
      _setStatus(success: 'Code dobara bheja!');
    } catch (e) {
      _setStatus(error: e.toString().replaceFirst('AuthEasyException: ', ''));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: _bg,
        border: Border.all(color: _border),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 36,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                  color: _textMute.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Title
            Text(
              _mode == 'login' ? 'Welcome back' : _mode == 'signup' ? 'Create account' : 'Verify Email',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: _textMain, letterSpacing: -0.5),
            ),
            const SizedBox(height: 4),
            Text(
              _mode == 'otp'
                  ? '${_emailCtrl.text} pe OTP bheja gaya'
                  : _mode == 'login' ? 'Sign in to continue' : 'Sirf kuch seconds lagenge',
              style: TextStyle(fontSize: 13, color: _textMute),
            ),
            const SizedBox(height: 20),

            // Error / Success
            if (_error.isNotEmpty) _AlertBox(msg: _error, isError: true),
            if (_success.isNotEmpty) _AlertBox(msg: _success, isError: false),

            // Login
            if (_mode == 'login') ...[
              _Field(label: 'Email', ctrl: _emailCtrl, type: TextInputType.emailAddress, bg: _inputBg, border: _inputBdr, text: _textMain, mute: _textMute),
              const SizedBox(height: 14),
              _Field(label: 'Password', ctrl: _passwordCtrl, obscure: true, bg: _inputBg, border: _inputBdr, text: _textMain, mute: _textMute),
              const SizedBox(height: 18),
              _PrimaryBtn(loading: _loading, onTap: _handleLogin, label: 'Sign In'),
              const SizedBox(height: 14),
              _SwitchRow(text: "Account nahi hai? ", link: "Sign up", onTap: () => setState(() => _mode = 'signup'), mute: _textMute),
            ],

            // Signup
            if (_mode == 'signup') ...[
              _Field(label: 'Name', ctrl: _nameCtrl, bg: _inputBg, border: _inputBdr, text: _textMain, mute: _textMute),
              const SizedBox(height: 14),
              _Field(label: 'Email', ctrl: _emailCtrl, type: TextInputType.emailAddress, bg: _inputBg, border: _inputBdr, text: _textMain, mute: _textMute),
              const SizedBox(height: 14),
              _Field(label: 'Password', ctrl: _passwordCtrl, obscure: true, bg: _inputBg, border: _inputBdr, text: _textMain, mute: _textMute),
              const SizedBox(height: 18),
              _PrimaryBtn(loading: _loading, onTap: _handleSignup, label: 'Create Account'),
              const SizedBox(height: 14),
              _SwitchRow(text: "Pehle se account hai? ", link: "Sign in", onTap: () => setState(() => _mode = 'login'), mute: _textMute),
            ],

            // OTP
            if (_mode == 'otp') ...[
              TextField(
                controller: _otpCtrl,
                keyboardType: TextInputType.number,
                maxLength: 6,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 28, letterSpacing: 12, color: _textMain),
                decoration: InputDecoration(
                  counterText: '',
                  hintText: '● ● ● ● ● ●',
                  hintStyle: TextStyle(color: _textMute, letterSpacing: 8),
                  filled: true,
                  fillColor: _inputBg,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: _inputBdr)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: _inputBdr)),
                ),
              ),
              const SizedBox(height: 18),
              _PrimaryBtn(loading: _loading, onTap: _handleOtp, label: 'Verify & Login'),
              const SizedBox(height: 14),
              _SwitchRow(text: "Code nahi mila? ", link: "Resend karo", onTap: _handleResend, mute: _textMute),
            ],

            const SizedBox(height: 20),
            Center(
              child: Text.rich(
                TextSpan(
                  text: 'Secured by ',
                  style: TextStyle(fontSize: 11, color: _textMute),
                  children: [
                    TextSpan(text: 'AuthEasy', style: TextStyle(color: _accent, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────
class _Field extends StatelessWidget {
  final String label;
  final TextEditingController ctrl;
  final bool obscure;
  final TextInputType type;
  final Color bg, border, text, mute;

  const _Field({
    required this.label,
    required this.ctrl,
    this.obscure = false,
    this.type = TextInputType.text,
    required this.bg,
    required this.border,
    required this.text,
    required this.mute,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: mute, letterSpacing: 0.6)),
        const SizedBox(height: 6),
        TextField(
          controller: ctrl,
          obscureText: obscure,
          keyboardType: type,
          autocorrect: false,
          style: TextStyle(color: text, fontSize: 14),
          decoration: InputDecoration(
            filled: true,
            fillColor: bg,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: border)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: border)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFC7A872), width: 1.5)),
          ),
        ),
      ],
    );
  }
}

class _PrimaryBtn extends StatelessWidget {
  final bool loading;
  final VoidCallback onTap;
  final String label;

  const _PrimaryBtn({required this.loading, required this.onTap, required this.label});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: loading ? null : onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: loading ? Colors.grey : const Color(0xFFC7A872),
          foregroundColor: const Color(0xFF0F172A),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          elevation: 0,
        ),
        child: loading
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF0F172A)))
            : Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
      ),
    );
  }
}

class _SwitchRow extends StatelessWidget {
  final String text, link;
  final VoidCallback onTap;
  final Color mute;

  const _SwitchRow({required this.text, required this.link, required this.onTap, required this.mute});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: GestureDetector(
        onTap: onTap,
        child: Text.rich(
          TextSpan(
            text: text,
            style: TextStyle(fontSize: 13, color: mute),
            children: [
              TextSpan(text: link, style: const TextStyle(color: Color(0xFFC7A872), fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    );
  }
}

class _AlertBox extends StatelessWidget {
  final String msg;
  final bool isError;

  const _AlertBox({required this.msg, required this.isError});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isError ? const Color(0x1FEF4444) : const Color(0x1F22C55E),
        border: Border.all(color: isError ? const Color(0x4DEF4444) : const Color(0x4D22C55E)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(msg, style: TextStyle(color: isError ? const Color(0xFFF87171) : const Color(0xFF4ADE80), fontSize: 13)),
    );
  }
}
