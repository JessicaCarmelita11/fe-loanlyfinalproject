import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule],
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
          <h5 class="mb-4">Account Settings</h5>
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
export class ProfileComponent {
  private authService = inject(AuthService);

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
}
