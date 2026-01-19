import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './forgot-password.component.html',
    styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
    email = '';
    isLoading = signal(false);
    isSuccess = signal(false);
    errorMessage = signal('');
    successMessage = signal('');

    constructor(private authService: AuthService) { }

    onSubmit() {
        if (!this.email) {
            this.errorMessage.set('Please enter your email address');
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');

        this.authService.forgotPassword(this.email).subscribe({
            next: (response) => {
                this.isLoading.set(false);
                this.isSuccess.set(true);
                this.successMessage.set('Password reset link has been sent to your email. Please check your inbox.');
            },
            error: (error) => {
                this.isLoading.set(false);
                if (error.error?.message) {
                    this.errorMessage.set(error.error.message);
                } else {
                    this.errorMessage.set('Failed to send reset link. Please try again.');
                }
            }
        });
    }
}
