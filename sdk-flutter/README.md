# autheasy_flutter

> Official Flutter SDK for [AuthEasy](https://autheasy.me) — drop-in authentication for iOS, Android, and Web Flutter apps.

## Installation

Add to your `pubspec.yaml`:

```yaml
dependencies:
  autheasy_flutter: ^1.0.0
```

Then run:
```bash
flutter pub get
```

### Android extra setup
Add to `android/app/src/main/AndroidManifest.xml` (for secure storage):
```xml
<uses-permission android:name="android.permission.INTERNET"/>
```

---

## Quick Start (3 steps)

### Step 1 — Wrap your app

```dart
// main.dart
import 'package:flutter/material.dart';
import 'package:autheasy_flutter/autheasy_flutter.dart';

void main() {
  runApp(
    AuthEasyProvider(
      apiKey: 'ae_live_YOUR_API_KEY_HERE',
      child: MyApp(),
    ),
  );
}
```

> Get your API key: [https://autheasy.me/dashboard](https://autheasy.me/dashboard)

---

### Step 2 — Access auth state anywhere

```dart
import 'package:autheasy_flutter/autheasy_flutter.dart';

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // Watch for changes (rebuilds widget on auth change)
    final auth = AuthEasyProvider.watch(context);

    if (auth.loading) {
      return const CircularProgressIndicator();
    }

    if (!auth.isAuthenticated) {
      return ElevatedButton(
        onPressed: () => showAuthModal(context),
        child: const Text('Sign In'),
      );
    }

    return Column(
      children: [
        Text('Welcome, ${auth.user!.name}!'),
        ElevatedButton(
          onPressed: () => auth.logout(),
          child: const Text('Logout'),
        ),
      ],
    );
  }
}
```

---

### Step 3 (Optional) — Drop-in Auth Modal or Button

```dart
// Show auth modal (login/signup/OTP)
showAuthModal(context, isDark: true);

// Or use the AuthButton widget
AuthButton(
  label: 'Sign In / Register',
  theme: AuthButtonTheme.dark,
)
```

---

## Full API Reference

### `AuthEasyProvider`

| Prop | Type | Description |
|------|------|-------------|
| `apiKey` | `String` | Your AuthEasy project API key |
| `child` | `Widget` | Your app widget |

Access state:
```dart
// Read (won't rebuild)
final auth = AuthEasyProvider.of(context);

// Watch (rebuilds on change)
final auth = AuthEasyProvider.watch(context);
```

---

### `AuthEasyState` methods

| Method | Description |
|--------|-------------|
| `login(email, password)` | Login user, saves session |
| `signup(email, password, name?)` | Register → sends OTP email |
| `verifyOtp(email, otp)` | Verify OTP → auto login |
| `resendOtp(email)` | Resend OTP |
| `logout()` | Clear session |
| `forgotPassword(email)` | Send reset OTP |
| `resetPassword(email, otp, newPassword)` | Reset password |
| `getAccessToken()` | Get JWT `Future<String?>` |

Properties:
- `user` → `AuthUser?` — logged in user
- `isAuthenticated` → `bool`
- `loading` → `bool` (true during session restore)

---

## Custom Login Screen

```dart
class LoginScreen extends StatefulWidget { ... }

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl    = TextEditingController();
  final _passwordCtrl = TextEditingController();
  String _error = '';

  Future<void> _login() async {
    final auth = AuthEasyProvider.of(context);
    try {
      await auth.login(
        email: _emailCtrl.text.trim(),
        password: _passwordCtrl.text,
      );
      // ✅ Logged in — navigate to home
      Navigator.pushReplacementNamed(context, '/home');
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            if (_error.isNotEmpty) Text(_error, style: const TextStyle(color: Colors.red)),
            TextField(controller: _emailCtrl, decoration: const InputDecoration(labelText: 'Email')),
            TextField(controller: _passwordCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'Password')),
            ElevatedButton(onPressed: _login, child: const Text('Login')),
          ],
        ),
      ),
    );
  }
}
```

---

## Making Authenticated API Calls

```dart
import 'package:http/http.dart' as http;

Future<void> fetchMyData(BuildContext context) async {
  final auth  = AuthEasyProvider.of(context);
  final token = await auth.getAccessToken();

  final res = await http.get(
    Uri.parse('https://my-backend.com/api/profile'),
    headers: {'Authorization': 'Bearer $token'},
  );
}
```

---

## Protecting Screens

```dart
class ProtectedScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final auth = AuthEasyProvider.watch(context);

    if (auth.loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (!auth.isAuthenticated) return const LoginScreen();

    return Scaffold(
      body: Center(child: Text('Welcome ${auth.user!.name}!')),
    );
  }
}
```

---

## Password Requirements

- Minimum **8 characters**  
- At least **1 uppercase** + **1 lowercase** + **1 number**  
- Must contain **exactly 1 `@` symbol** (e.g. `MyPass@123`)

---

## License

MIT © [AuthEasy](https://autheasy.me)
