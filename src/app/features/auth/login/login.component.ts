import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models';

@Component({
    selector: 'app-login',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {
    credentials: LoginRequest = {
        usernameOrEmail: '',
        password: ''
    };

    isLoading = signal(false);
    errorMessage = signal<string | null>(null);
    showPassword = signal(false);

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    onSubmit() {
        if (!this.credentials.usernameOrEmail || !this.credentials.password) {
            this.errorMessage.set('Please fill in all fields');
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set(null);

        this.authService.login(this.credentials).subscribe({
            next: (response) => {
                this.isLoading.set(false);
                if (response.success) {
                    this.router.navigate(['/dashboard']);
                }
            },
            error: (error) => {
                this.isLoading.set(false);
                this.errorMessage.set(error.message || 'Login failed. Please check your credentials.');
            }
        });
    }

    togglePassword() {
        this.showPassword.set(!this.showPassword());
    }
}
