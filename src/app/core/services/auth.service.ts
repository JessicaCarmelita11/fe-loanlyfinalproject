import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest, AuthResponse } from '../models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'auth_user';

    // Reactive state using signals
    private currentUserSignal = signal<AuthUser | null>(this.getUserFromStorage());
    private isAuthenticatedSignal = signal<boolean>(this.hasValidToken());

    // Public computed signals
    readonly currentUser = computed(() => this.currentUserSignal());
    readonly isAuthenticated = computed(() => this.isAuthenticatedSignal());
    // Roles are already string array from backend
    readonly userRoles = computed(() => this.currentUserSignal()?.roles || []);

    constructor(
        private http: HttpClient,
        private router: Router
    ) { }

    /**
     * Login user with username/email and password
     */
    login(credentials: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
            .pipe(
                tap(response => {
                    if (response.success && response.data) {
                        this.setSession(response.data.accessToken, response.data.user);
                    }
                }),
                catchError(error => {
                    console.error('Login error:', error);
                    return throwError(() => error);
                })
            );
    }

    /**
     * Logout and clear session
     */
    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.currentUserSignal.set(null);
        this.isAuthenticatedSignal.set(false);
        this.router.navigate(['/login']);
    }

    /**
     * Get JWT token
     */
    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Check if user has any of the required roles
     */
    hasRole(requiredRoles: string[]): boolean {
        const userRoles = this.userRoles();
        return requiredRoles.some(role => userRoles.includes(role));
    }

    /**
     * Check if user has specific role
     */
    hasSpecificRole(role: string): boolean {
        return this.userRoles().includes(role);
    }

    /**
     * Get primary role (first role)
     */
    getPrimaryRole(): string | null {
        const roles = this.userRoles();
        return roles.length > 0 ? roles[0] : null;
    }

    // Private methods
    private setSession(token: string, user: AuthUser): void {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUserSignal.set(user);
        this.isAuthenticatedSignal.set(true);
    }

    private getUserFromStorage(): AuthUser | null {
        const userStr = localStorage.getItem(this.USER_KEY);
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }
        return null;
    }

    private hasValidToken(): boolean {
        const token = this.getToken();
        if (!token) return false;

        // Basic JWT expiry check
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiry = payload.exp * 1000;
            return Date.now() < expiry;
        } catch {
            return false;
        }
    }

    // ========== FORGOT PASSWORD ==========

    /**
     * Request password reset - sends email with reset token
     */
    forgotPassword(email: string): Observable<any> {
        return this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email });
    }

    /**
     * Validate reset token
     */
    validateResetToken(token: string): Observable<any> {
        return this.http.get(`${environment.apiUrl}/auth/validate-token`, {
            params: { token }
        });
    }

    /**
     * Reset password with token
     */
    resetPassword(token: string, newPassword: string): Observable<any> {
        return this.http.post(`${environment.apiUrl}/auth/reset-password`, {
            token,
            newPassword
        });
    }
}
