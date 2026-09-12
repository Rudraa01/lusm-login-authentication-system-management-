# autheasy-react-native

> Official React Native SDK for [AuthEasy](https://autheasy.me) — drop-in authentication for iOS & Android apps.

---

## Installation

```bash
# Install the SDK
npm install autheasy-react-native

# Install the required peer dependency
npm install @react-native-async-storage/async-storage

# For iOS (after pod install)
npx pod-install
```

---

## Quick Start

### Step 1 — Wrap your app

```jsx
// App.js
import { AuthEasyProvider } from 'autheasy-react-native';

export default function App() {
  return (
    <AuthEasyProvider apiKey="ae_live_YOUR_API_KEY">
      <NavigationContainer>
        {/* your screens */}
      </NavigationContainer>
    </AuthEasyProvider>
  );
}
```

> Get your API key from [https://autheasy.me/dashboard](https://autheasy.me/dashboard)

---

### Step 2 — Use the hook

```jsx
import { useAuthEasy } from 'autheasy-react-native';

function HomeScreen() {
  const { user, isAuthenticated, logout } = useAuthEasy();

  if (!isAuthenticated) {
    return <Text>Please login</Text>;
  }

  return (
    <View>
      <Text>Welcome, {user.name}!</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
```

---

### Step 3 (Optional) — Drop-in Auth Modal

```jsx
import { useState } from 'react';
import { AuthModal } from 'autheasy-react-native';

function LoginScreen() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <View>
      <Button title="Sign In" onPress={() => setShowAuth(true)} />
      
      <AuthModal
        visible={showAuth}
        onClose={() => setShowAuth(false)}
        theme="dark"
      />
    </View>
  );
}
```

---

## Full API

### `<AuthEasyProvider>`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `apiKey` | `string` | ✅ | Your project API key |

---

### `useAuthEasy()` — Hook

| Property/Method | Type | Description |
|---|---|---|
| `user` | `object \| null` | Current user |
| `isAuthenticated` | `boolean` | Login status |
| `loading` | `boolean` | Session restore in progress |
| `login({ email, password })` | `async fn` | Login user |
| `signup({ email, password, name? })` | `async fn` | Register → sends OTP |
| `verifyOtp({ email, otp })` | `async fn` | Verify OTP → auto login |
| `resendOtp({ email })` | `async fn` | Resend OTP |
| `logout()` | `async fn` | Clear session |
| `forgotPassword({ email })` | `async fn` | Send reset OTP |
| `resetPassword({ email, otp, newPassword })` | `async fn` | Reset password |
| `getAccessToken()` | `async fn` | Get JWT token `Promise<string\|null>` |

---

### `<AuthModal>` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | — | Show/hide modal |
| `onClose` | `() => void` | — | Called on dismiss or success |
| `theme` | `'dark' \| 'light'` | `'dark'` | Color theme |

---

## Custom Login Screen (Manual Flow)

```jsx
import { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { useAuthEasy } from 'autheasy-react-native';

function MyLoginScreen({ navigation }) {
  const { login } = useAuthEasy();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      await login({ email, password });
      navigation.replace('Home');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <View>
      {!!error && <Text style={{ color: 'red' }}>{error}</Text>}
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}
```

---

## Making Authenticated API Calls

```jsx
import { useAuthEasy } from 'autheasy-react-native';

function ProfileScreen() {
  const { getAccessToken } = useAuthEasy();

  const fetchProfile = async () => {
    const token = await getAccessToken(); // Note: async in RN (uses AsyncStorage)
    const res = await fetch('https://my-backend.com/api/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  };
}
```

> ⚠️ Note: `getAccessToken()` is **async** in React Native (returns a Promise), unlike the web SDK.

---

## Expo Support

Works with Expo managed workflow:
```bash
npx expo install @react-native-async-storage/async-storage
npm install autheasy-react-native
```

---

## Password Requirements

- Minimum **8 characters**
- At least **1 uppercase** + **1 lowercase** + **1 number**
- Must have **exactly 1 `@` symbol** (e.g. `MyPass@123`)

---

## License

MIT © [AuthEasy](https://autheasy.me)
