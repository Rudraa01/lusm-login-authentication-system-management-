import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'autheasy_state.dart';

/// Wrap your app's root widget with this.
///
/// ```dart
/// // main.dart
/// void main() {
///   runApp(
///     AuthEasyProvider(
///       apiKey: 'ae_live_xxxxxxxxxxxxxxxx',
///       child: MyApp(),
///     ),
///   );
/// }
/// ```
class AuthEasyProvider extends StatefulWidget {
  final String apiKey;
  final Widget child;

  const AuthEasyProvider({
    super.key,
    required this.apiKey,
    required this.child,
  });

  @override
  State<AuthEasyProvider> createState() => _AuthEasyProviderState();

  /// Access auth state from any widget in the tree
  ///
  /// ```dart
  /// final auth = AuthEasyProvider.of(context);
  /// print(auth.user?.name);
  /// ```
  static AuthEasyState of(BuildContext context) {
    return Provider.of<AuthEasyState>(context, listen: false);
  }

  /// Listen to auth changes (rebuilds widget on change)
  static AuthEasyState watch(BuildContext context) {
    return Provider.of<AuthEasyState>(context);
  }
}

class _AuthEasyProviderState extends State<AuthEasyProvider> {
  late final AuthEasyState _state;

  @override
  void initState() {
    super.initState();
    _state = AuthEasyState(apiKey: widget.apiKey);
    _state.init(); // restore session
  }

  @override
  void dispose() {
    _state.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<AuthEasyState>.value(
      value: _state,
      child: widget.child,
    );
  }
}
