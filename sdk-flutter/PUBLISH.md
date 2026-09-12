# autheasy_flutter — Publish to pub.dev

## Steps to Publish

### 1. Flutter/Dart install check
```bash
flutter --version
dart --version
```

### 2. Validate the package
```bash
cd sdk-flutter
dart pub publish --dry-run
```
Yeh sirf check karega (actually publish nahi karega).

### 3. Publish to pub.dev
```bash
dart pub publish
```
- First time mein browser mein Google account se login karega
- pub.dev pe package live ho jayega

---

## Package link after publish:
https://pub.dev/packages/autheasy_flutter

---

## Flutter developer kaise use karega:

```yaml
# pubspec.yaml
dependencies:
  autheasy_flutter: ^1.0.0
```

```bash
flutter pub get
```

```dart
// main.dart
import 'package:autheasy_flutter/autheasy_flutter.dart';

void main() {
  runApp(
    AuthEasyProvider(
      apiKey: 'ae_live_xxxx',
      child: MyApp(),
    ),
  );
}
```
