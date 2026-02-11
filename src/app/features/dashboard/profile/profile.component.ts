import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ChangePasswordRequest } from '../../../core/models';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">Profile</h1>
      <p class="page-subtitle">Your account information</p>
    </div>
    
    <div class="row g-4">
      <div class="col-lg-4">
        <div class="glass-card-solid p-4 text-center">
          <div class="profile-avatar mx-auto mb-3">
            {{ userInitials }}
          </div>
          <h4>{{ user?.fullName || user?.username }}</h4>
          <span class="badge-status badge-waiting">{{ primaryRole }}</span>
          <hr class="my-4">
          <div class="text-start">
            <p class="mb-2"><strong>Username:</strong> {{ user?.username }}</p>
            <p class="mb-2"><strong>Email:</strong> {{ user?.email }}</p>
            <p class="mb-0"><strong>Status:</strong> 
              <span class="badge-status badge-approved">Active</span>
            </p>
          </div>
        </div>
      </div>
      
      <div class="col-lg-8">
        <div class="glass-card-solid p-4">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0">Account Settings</h5>
            <button class="btn btn-primary btn-sm" (click)="openChangePasswordModal()">
              <i class="bi bi-key-fill me-2"></i>Change Password
            </button>
          </div>
          
          <form>
            <div class="mb-3">
              <label class="form-label">Full Name</label>
              <input type="text" class="form-control" [value]="user?.fullName" readonly>
            </div>
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" [value]="user?.email" readonly>
            </div>
            <div class="mb-3">
              <label class="form-label">Roles</label>
              <input type="text" class="form-control" [value]="userRoles" readonly>
            </div>
            <hr>
            <p class="text-muted small">Contact administrator to update your profile information.</p>
          </form>
        </div>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div class="modal fade" id="changePasswordModal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered">
        <!-- Removed glass-card-solid to avoid double backdrop-filter issues -->
        <div class="modal-content">
          <div class="modal-header border-0">
            <h5 class="modal-title">Change Password</h5>
            <!-- Close button with explicit click handler -->
            <button type="button" class="btn-close" (click)="closeModal()" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="changePasswordForm" (ngSubmit)="onSubmitChangePassword()">
              <div class="mb-3">
                <label class="form-label">Current Password</label>
                <input type="password" class="form-control" formControlName="currentPassword" 
                       [class.is-invalid]="submitted && f['currentPassword'].errors">
                <div class="invalid-feedback" *ngIf="submitted && f['currentPassword'].errors?.['required']">
                  Current password is required
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">New Password</label>
                <input type="password" class="form-control" formControlName="newPassword"
                       [class.is-invalid]="submitted && f['newPassword'].errors">
                <div class="invalid-feedback" *ngIf="submitted && f['newPassword'].errors?.['required']">
                  New password is required
                </div>
                <div class="invalid-feedback" *ngIf="submitted && f['newPassword'].errors?.['minlength']">
                  Password must be at least 6 characters
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Confirm New Password</label>
                <input type="password" class="form-control" formControlName="confirmPassword"
                       [class.is-invalid]="submitted && f['confirmPassword'].errors">
                <div class="invalid-feedback" *ngIf="submitted && f['confirmPassword'].errors?.['required']">
                  Confirm password is required
                </div>
                <div class="invalid-feedback" *ngIf="submitted && f['confirmPassword'].errors?.['mismatch']">
                  Passwords do not match
                </div>
              </div>

              <div class="d-grid gap-2">
                <button type="submit" class="btn btn-primary" [disabled]="isLoading">
                  <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-avatar {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 36px;
    }
  `]
})
export class ProfileComponent implements OnDestroy {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  changePasswordForm: FormGroup;
  submitted = false;
  isLoading = false;
  modalInstance: any;

  constructor() {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnDestroy() {
    // Clean up modal if it exists
    if (this.modalInstance) {
      this.modalInstance.dispose();
    }
    // Remove modal from body if it was moved there
    const modalElement = document.getElementById('changePasswordModal');
    if (modalElement && modalElement.parentNode === document.body) {
      document.body.removeChild(modalElement);
    }
  }

  get f() { return this.changePasswordForm.controls; }

  get user() {
    return this.authService.currentUser();
  }

  get userInitials(): string {
    const user = this.user;
    if (!user) return 'U';
    const names = user.fullName?.split(' ') || [user.username];
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  }

  get primaryRole(): string {
    return this.authService.getPrimaryRole() || 'User';
  }

  get userRoles(): string {
    return this.authService.userRoles().join(', ');
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  openChangePasswordModal() {
    this.submitted = false;
    this.changePasswordForm.reset();

    const modalElement = document.getElementById('changePasswordModal');
    if (modalElement) {
      // Move modal to body to avoid z-index/backdrop-filter issues from parent containers
      document.body.appendChild(modalElement);

      // @ts-ignore
      this.modalInstance = new bootstrap.Modal(modalElement);
      this.modalInstance.show();
    }
  }

  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }

  onSubmitChangePassword() {
    this.submitted = true;

    if (this.changePasswordForm.invalid) {
      return;
    }

    this.isLoading = true;
    const request: ChangePasswordRequest = {
      currentPassword: this.changePasswordForm.value.currentPassword,
      newPassword: this.changePasswordForm.value.newPassword,
      confirmPassword: this.changePasswordForm.value.confirmPassword
    };

    this.authService.changePassword(request).subscribe({
      next: () => {
        alert('Password changed successfully! Please login again with your new password.');
        this.isLoading = false;
        if (this.modalInstance) {
          this.modalInstance.hide();
        }
        this.authService.logout();
      },
      error: (error) => {
        console.error(error);
        alert(error.error?.message || 'Failed to change password');
        this.isLoading = false;
      }
    });
  }
}
