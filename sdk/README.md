# @autheasy/react

> Official React SDK for [AuthEasy](https://autheasy.me) — drop-in authentication in minutes.

[![npm version](https://img.shields.io/npm/v/@autheasy/react.svg)](https://www.npmjs.com/package/@autheasy/react)
[![license](https://img.shields.io/npm/l/@autheasy/react.svg)](./LICENSE)

---

## What is AuthEasy?

AuthEasy is a developer-friendly authentication platform. Create a project in the dashboard, grab your API key, and this SDK handles everything else — signups, OTP verification, login, sessions, password reset, and logout.

**No backend code required in your app.** AuthEasy's servers do the heavy lifting.

---

## Installation

```bash
npm install @autheasy/react
```

---

## Quick Start (3 steps)

### Step 1 — Wrap your app

```jsx
// main.jsx or index.jsx
import { AuthEasyProvider } from '@autheasy/react';

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthEasyProvider apiKey="ae_live_YOUR_API_KEY_HERE">
    <App />
  </AuthEasyProvider>
);
```

> Get your API key from [https://autheasy.me/dashboard](https://autheasy.me/dashboard) → Your Project → API Keys

---

### Step 2 — Use the hook anywhere

```jsx
import { useAuthEasy } from '@autheasy/react';

function Profile() {
  const { user, isAuthenticated, login, logout } = useAuthEasy();

  if (!isAuthenticated) {
    return (
      <button onClick={() => login({ email: 'user@example.com', password: 'Pass@123' })}>
        Login
      </button>
    );
  }

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

### Step 3 (Optional) — Drop-in Auth Modal

If you don't want to build your own login/signup UI:

```jsx
import { AuthButton } from '@autheasy/react';

// Adds a button that opens a complete login/signup modal
<AuthButton theme="dark" buttonText="Sign In / Register" />
```

---

## Full API Reference

### `<AuthEasyProvider>`

Wrap your entire app with this at the root.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `apiKey` | `string` | ✅ | Your AuthEasy project API key |
| `baseUrl` | `string` | ❌ | Override backend URL (for self-hosting) |

---

### `useAuthEasy()` — Hook

Returns an object with state and methods.

#### State

| Property | Type | Description |
|----------|------|-------------|
| `user` | `AuthEasyUser \| null` | Logged in user, or null |
| `isAuthenticated` | `boolean` | True if user is logged in |
| `loading` | `boolean` | True during initial session check |
| `authError` | `string \| null` | Last auth error message |

#### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `signup` | `{ email, password, name?, phone? }` | Promise | Register new user, sends OTP email |
| `verifyOtp` | `{ email, otp }` | Promise | Verify OTP → auto logs in |
| `resendOtp` | `{ email }` | Promise | Resend OTP code |
| `login` | `{ email, password }` | Promise | Login → auto saves session |
| `logout` | — | void | Clear session |
| `forgotPassword` | `{ email }` | Promise | Send password reset OTP |
| `resetPassword` | `{ email, otp, newPassword }` | Promise | Reset password with OTP |
| `getAccessToken` | — | `string \| null` | Get raw JWT for your own API calls |

---

## Usage Examples

### Sign Up + OTP flow

```jsx
import { useState } from 'react';
import { useAuthEasy } from '@autheasy/react';

function SignupFlow() {
  const { signup, verifyOtp } = useAuthEasy();
  const [step, setStep] = useState('register'); // 'register' | 'otp'
  const [email, setEmail] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    const password = e.target.password.value;
    const name = e.target.name.value;

    try {
      await signup({ email, password, name });
      setStep('otp'); // move to OTP step
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOtp = async (e) => {
    e.preventDefault();
    const otp = e.target.otp.value;

    try {
      await verifyOtp({ email, otp });
      // ✅ User is now logged in automatically!
    } catch (err) {
      alert(err.message);
    }
  };

  if (step === 'otp') {
    return (
      <form onSubmit={handleOtp}>
        <input name="otp" placeholder="Enter 6-digit OTP" required />
        <button type="submit">Verify</button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRegister}>
      <input name="name" placeholder="Your name" required />
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">Create Account</button>
    </form>
  );
}
```

---

### Login

```jsx
import { useAuthEasy } from '@autheasy/react';

function LoginForm() {
  const { login, isAuthenticated, user } = useAuthEasy();

  if (isAuthenticated) return <p>Logged in as {user.email}</p>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({
        email: e.target.email.value,
        password: e.target.password.value,
      });
    } catch (err) {
      alert(err.message); // e.g. "Invalid email or password."
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
  );
}
```

---

### Forgot Password

```jsx
import { useAuthEasy } from '@autheasy/react';

function ForgotPasswordFlow() {
  const { forgotPassword, resetPassword } = useAuthEasy();
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    await forgotPassword({ email });
    setStep('reset');
  };

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await resetPassword({
        email,
        otp: e.target.otp.value,
        newPassword: e.target.newPassword.value,
      });
      alert('Password reset! Please login.');
    } catch (err) {
      alert(err.message);
    }
  };

  if (step === 'reset') {
    return (
      <form onSubmit={handleReset}>
        <input name="otp" placeholder="OTP from email" required />
        <input name="newPassword" type="password" placeholder="New password" required />
        <button type="submit">Reset Password</button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequest}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <button type="submit">Send Reset Code</button>
    </form>
  );
}
```

---

### Protected Routes

```jsx
import { Navigate } from 'react-router-dom';
import { useAuthEasy } from '@autheasy/react';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuthEasy();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}

// In your router:
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

---

### Using the token for your own API calls

```jsx
import { useAuthEasy } from '@autheasy/react';

function MyComponent() {
  const { getAccessToken } = useAuthEasy();

  const fetchMyData = async () => {
    const token = getAccessToken();
    const res = await fetch('https://my-backend.com/api/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.json();
  };

  // ...
}
```

---

## Password Requirements

AuthEasy enforces strong passwords:
- Minimum **8 characters**
- At least **1 uppercase** letter
- At least **1 lowercase** letter
- At least **1 number**
- Must include **exactly 1 `@` symbol**
- No other special characters allowed

Example valid password: `MyPass@123`

---

## `<AuthButton>` Props

The drop-in modal UI component:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `'dark' \| 'light'` | `'dark'` | Modal color theme |
| `buttonText` | `string` | `'Sign In'` | Label on the trigger button |
| `className` | `string` | `''` | Extra CSS class on the button |

---

## TypeScript Support

Full TypeScript types are included. No `@types/` package needed.

```typescript
import { useAuthEasy, AuthEasyUser } from '@autheasy/react';

const { user }: { user: AuthEasyUser | null } = useAuthEasy();
```

---

## License

MIT © [AuthEasy](https://autheasy.me)
