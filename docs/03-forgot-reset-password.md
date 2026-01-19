# 🔑 Forgot Password Documentation

## Overview
Fitur forgot password memungkinkan user untuk reset password jika lupa. Flow dimulai dari request email → receive token → reset password.

---

## 📁 File Structure
```
src/app/features/auth/forgot-password/
├── forgot-password.component.ts
├── forgot-password.component.html
└── forgot-password.component.css

src/app/features/auth/reset-password/
├── reset-password.component.ts
├── reset-password.component.html
└── reset-password.component.css
```

---

## 🔄 Complete Flow
```mermaid
flowchart TD
    A[User Click 'Forgot Password'] --> B[/forgot-password Page]
    B --> C[Enter Email Address]
    C --> D[Submit Request]
    D --> E[Backend Send Email with Token]
    E --> F[User Check Email]
    F --> G[Click Reset Link in Email]
    G --> H[/reset-password?token=xxx]
    H --> I[Validate Token]
    I --> J{Token Valid?}
    J -->|Yes| K[Show Password Form]
    J -->|No| L[Show Error + Request New Link]
    K --> M[Enter New Password]
    M --> N[Submit Reset]
    N --> O[Password Changed!]
    O --> P[Redirect to Login]
```

---

## 📧 STEP 1: Forgot Password Page

### Component State
```typescript
email = '';
isLoading = signal(false);
isSuccess = signal(false);
errorMessage = signal('');
successMessage = signal('');
```

### Submit Handler
```typescript
onSubmit() {
    this.isLoading.set(true);
    
    this.authService.forgotPassword(this.email).subscribe({
        next: (response) => {
            this.isSuccess.set(true);
            this.successMessage.set('Reset link sent to your email');
        },
        error: (error) => {
            this.errorMessage.set(error.error?.message || 'Failed');
        }
    });
}
```

---

## 🔐 STEP 2: Reset Password Page

### Token dari URL
```typescript
ngOnInit() {
    this.route.queryParams.subscribe(params => {
        this.token = params['token'] || '';
        if (this.token) {
            this.validateToken();
        }
    });
}
```

### Validate Token
```typescript
validateToken() {
    this.authService.validateResetToken(this.token).subscribe({
        next: () => {
            this.isTokenValid.set(true);
        },
        error: () => {
            this.errorMessage.set('Token invalid or expired');
        }
    });
}
```

### Reset Password
```typescript
onSubmit() {
    // Validasi
    if (this.newPassword !== this.confirmPassword) {
        this.errorMessage.set('Passwords do not match');
        return;
    }

    this.authService.resetPassword(this.token, this.newPassword)
        .subscribe({
            next: () => {
                this.isSuccess.set(true);
            }
        });
}
```

---

## 📡 API Endpoints

| Step | Method | Endpoint | Request |
|------|--------|----------|---------|
| 1. Request Reset | POST | `/api/auth/forgot-password` | `{ email }` |
| 2. Validate Token | GET | `/api/auth/validate-token?token=xxx` | Query param |
| 3. Reset Password | POST | `/api/auth/reset-password` | `{ token, newPassword }` |

---

## 🔗 AuthService Methods

```typescript
// 1. Request password reset email
forgotPassword(email: string): Observable<any> {
    return this.http.post(`/api/auth/forgot-password`, { email });
}

// 2. Validate reset token
validateResetToken(token: string): Observable<any> {
    return this.http.get(`/api/auth/validate-token`, {
        params: { token }
    });
}

// 3. Reset password with token
resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`/api/auth/reset-password`, {
        token,
        newPassword
    });
}
```

---

## 🎨 UI States

### Forgot Password Page
| State | Display |
|-------|---------|
| Initial | Email input form |
| Loading | Spinner + "Sending..." |
| Success | Check icon + "Check your email" |
| Error | Red alert message |

### Reset Password Page
| State | Display |
|-------|---------|
| Validating | Spinner + "Validating..." |
| Token Invalid | Error icon + "Request new link" button |
| Token Valid | Password form |
| Success | Check icon + "Go to Login" button |

---

## ⚠️ Important Notes

1. **Token Expiry**: Backend biasanya set token expire dalam 1 jam
2. **Email Format**: Link di email harus mengarah ke: `http://yoursite.com/reset-password?token=xxx`
3. **Password Validation**: Minimum 8 karakter (validasi di frontend & backend)
4. **Security**: Token hanya bisa digunakan sekali
