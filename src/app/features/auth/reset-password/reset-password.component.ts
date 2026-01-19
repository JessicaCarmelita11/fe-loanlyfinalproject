import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './reset-password.component.html',
    styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
    token = '';
    newPassword = '';
    confirmPassword = '';
    showPassword = signal(false);
    showConfirmPassword = signal(false);

    isLoading = signal(false);
    isValidating = signal(true);
    isTokenValid = signal(false);
    isSuccess = signal(false);

    errorMessage = signal('');
    successMessage = signal('');

    constructor(
        private authService: AuthService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit() {
        // Get token from URL query parameter
        this.route.queryParams.subscribe(params => {
            this.token = params['token'] || '';
            if (this.token) {
                this.validateToken();
            } else {
                this.isValidating.set(false);
                this.errorMessage.set('Invalid or missing reset token. Please request a new password reset link.');
            }
        });
    }

    validateToken() {
        this.authService.validateResetToken(this.token).subscribe({
            next: (response) => {
                this.isValidating.set(false);
                this.isTokenValid.set(true);
            },
            error: (error) => {
                this.isValidating.set(false);
                this.isTokenValid.set(false);
                if (error.error?.message) {
                    this.errorMessage.set(error.error.message);
                } else {
                    this.errorMessage.set('This reset link is invalid or has expired. Please request a new one.');
                }
            }
        });
    }

    togglePassword() {
        this.showPassword.update(v => !v);
    }

    toggleConfirmPassword() {
        this.showConfirmPassword.update(v => !v);
    }

    onSubmit() {
        this.errorMessage.set('');

        // Validate passwords
        if (!this.newPassword || !this.confirmPassword) {
            this.errorMessage.set('Please fill in all fields');
            return;
        }

        if (this.newPassword.length < 8) {
            this.errorMessage.set('Password must be at least 8 characters');
            return;
        }

        if (this.newPassword !== this.confirmPassword) {
            this.errorMessage.set('Passwords do not match');
            return;
        }

        this.isLoading.set(true);

        this.authService.resetPassword(this.token, this.newPassword).subscribe({
            next: (response) => {
                this.isLoading.set(false);
                this.isSuccess.set(true);
                this.successMessage.set('Your password has been reset successfully. You can now login with your new password.');
            },
            error: (error) => {
                this.isLoading.set(false);
                if (error.error?.message) {
                    this.errorMessage.set(error.error.message);
                } else {
                    this.errorMessage.set('Failed to reset password. Please try again.');
                }
            }
        });
    }
}
