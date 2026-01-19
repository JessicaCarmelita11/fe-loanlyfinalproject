import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { User, Role } from '../../../core/models';

@Component({
  selector: 'app-user-list',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header d-flex justify-content-between align-items-start">
      <div>
        <h1 class="page-title">User Management</h1>
        <p class="page-subtitle">Manage system users and their roles</p>
      </div>
      <button class="btn btn-primary-glass" (click)="openCreateModal()">
        <i class="bi bi-plus-lg me-2"></i> Add User
      </button>
    </div>

    <div class="glass-card-solid p-4">
      <!-- Tabs -->
      <div class="user-tabs mb-4">
        <button 
          class="tab-btn" 
          [class.active]="activeTab === 'staff'"
          (click)="activeTab = 'staff'">
          <i class="bi bi-building me-2"></i>
          Internal Staff
          <span class="tab-count">{{ staffUsers.length }}</span>
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab === 'customer'"
          (click)="activeTab = 'customer'">
          <i class="bi bi-people me-2"></i>
          Customers
          <span class="tab-count">{{ customerUsers.length }}</span>
        </button>
      </div>

      <div class="mb-4 d-flex gap-3 align-items-center">
        <input 
          type="text" 
          class="form-control" 
          style="max-width: 300px"
          placeholder="Search users..."
          [(ngModel)]="searchTerm">
        @if (activeTab === 'staff') {
          <select class="form-select" style="max-width: 200px" [(ngModel)]="roleFilter">
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="MARKETING">Marketing</option>
            <option value="BRANCH_MANAGER">Branch Manager</option>
            <option value="BACK_OFFICE">Back Office</option>
          </select>
        }
      </div>
      
      @if (isLoading()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      } @else {
        <div class="table-responsive">
          <table class="table table-glass">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Status</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of filteredUsers; track user.id) {
                <tr>
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <div class="user-avatar-sm" [class.customer-avatar]="isCustomerUserCheck(user)">{{ getInitial(user) }}</div>
                      <span>{{ user.fullName || '-' }}</span>
                    </div>
                  </td>
                  <td>{{ user.username }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    @for (roleName of getUserRoleNames(user); track roleName) {
                      <span class="badge me-1" [class]="getRoleBadgeClass(roleName)">{{ roleName }}</span>
                    }
                  </td>
                  <td>
                    <span class="badge-status" [class.badge-approved]="user.isActive" [class.badge-rejected]="!user.isActive">
                      {{ user.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" (click)="openEditModal(user)" title="Edit">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" (click)="deleteUser(user)" title="Delete">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="text-center py-5 text-muted">
                    <i class="bi bi-people fs-1 d-block mb-2 opacity-50"></i>
                    {{ activeTab === 'staff' ? 'No internal staff found' : 'No customers found' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()"></div>
      <div class="modal-container">
        <div class="modal-content glass-card-solid">
          <div class="modal-header">
            <h5 class="modal-title">{{ modalMode === 'create' ? 'Create User' : 'Edit User' }}</h5>
            <button type="button" class="btn-close" (click)="closeModal()">×</button>
          </div>
          
          <div class="modal-body">
            @if (formError()) {
              <div class="alert alert-danger mb-3">{{ formError() }}</div>
            }
            
            <form>
              <div class="mb-3">
                <label class="form-label">Username <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  [(ngModel)]="formUsername"
                  name="username"
                  [disabled]="modalMode === 'edit'">
              </div>
              
              <div class="mb-3">
                <label class="form-label">Full Name <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  [(ngModel)]="formFullName"
                  name="fullName">
              </div>
              
              <div class="mb-3">
                <label class="form-label">Email <span class="text-danger">*</span></label>
                <input 
                  type="email" 
                  class="form-control" 
                  [(ngModel)]="formEmail"
                  name="email">
              </div>
              
              @if (modalMode === 'create') {
                <div class="mb-3">
                  <label class="form-label">Password <span class="text-danger">*</span></label>
                  <input 
                    type="password" 
                    class="form-control" 
                    [(ngModel)]="formPassword"
                    name="password">
                </div>
              }
              
              <div class="mb-3">
                <label class="form-label">Roles <span class="text-danger">*</span></label>
                @if (isCustomerUser()) {
                  <p class="text-muted small mb-2"><i class="bi bi-info-circle me-1"></i>Role CUSTOMER tidak dapat diubah</p>
                }
                <div class="role-checkboxes">
                  @for (role of roles(); track role.id) {
                    <div class="form-check">
                      <input 
                        type="checkbox" 
                        class="form-check-input" 
                        [id]="'role-' + role.id"
                        [checked]="isRoleSelected(role.id)"
                        (change)="toggleRole(role.id)"
                        [disabled]="isCustomerUser()">
                      <label class="form-check-label" [for]="'role-' + role.id">
                        {{ role.name }}
                      </label>
                    </div>
                  }
                </div>
              </div>
              
              @if (modalMode === 'edit') {
                <div class="mb-3">
                  <div class="form-check form-switch">
                    <input 
                      type="checkbox" 
                      class="form-check-input" 
                      id="isActive"
                      [(ngModel)]="formIsActive"
                      name="isActive">
                    <label class="form-check-label" for="isActive">Active</label>
                  </div>
                </div>
              }
            </form>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" (click)="closeModal()">Cancel</button>
            <button type="button" class="btn btn-primary-glass" (click)="saveUser()" [disabled]="isSaving()">
              @if (isSaving()) {
                <span class="spinner-border spinner-border-sm me-2"></span>
              }
              {{ modalMode === 'create' ? 'Create' : 'Update' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* Tabs - Modern Pill Style */
    .user-tabs {
      display: flex;
      gap: 8px;
      background: rgba(255, 255, 255, 0.03);
      padding: 6px;
      border-radius: 16px;
      width: fit-content;
    }
    .tab-btn {
      background: transparent;
      border: none;
      border-radius: 12px;
      padding: 12px 24px;
      color: rgba(255, 255, 255, 0.5);
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tab-btn:hover {
      color: rgba(255, 255, 255, 0.8);
    }
    .tab-btn.active {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(20, 184, 166, 0.3) 100%);
      color: #fff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
    }
    .tab-btn i {
      font-size: 16px;
    }
    .tab-count {
      background: rgba(255, 255, 255, 0.15);
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .tab-btn.active .tab-count {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Role Badges - Transparent */
    .role-badge {
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .role-super-admin {
      background: rgba(239, 68, 68, 0.15);
      color: #F87171;
    }
    .role-marketing {
      background: rgba(6, 182, 212, 0.15);
      color: #22D3EE;
    }
    .role-branch-manager {
      background: rgba(245, 158, 11, 0.15);
      color: #FBBF24;
    }
    .role-back-office {
      background: rgba(107, 114, 128, 0.15);
      color: #9CA3AF;
    }
    .role-customer {
      background: rgba(34, 197, 94, 0.15);
      color: #4ADE80;
    }

    /* User Avatar */
    .user-avatar-sm {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 14px;
    }
    .user-avatar-sm.customer-avatar {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 1040;
    }
    .modal-container {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1050;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      padding: 20px;
    }
    .modal-content {
      border-radius: 16px;
      overflow: hidden;
      max-height: calc(90vh - 40px);
      display: flex;
      flex-direction: column;
    }
    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .modal-title { font-weight: 600; margin: 0; color: white; }
    .btn-close {
      background: transparent; border: none;
      font-size: 24px; cursor: pointer;
      opacity: 0.5; line-height: 1;
      color: white;
    }
    .btn-close:hover { opacity: 1; }
    .modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }
    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      flex-shrink: 0;
    }
    .role-checkboxes { display: flex; flex-wrap: wrap; gap: 12px; }
    .form-check {
      background: rgba(45, 55, 72, 0.6);
      padding: 10px 16px;
      border-radius: 8px;
      margin: 0;
    }
    .form-check-label { color: rgba(255, 255, 255, 0.8); }
  `]
})
export class UserListComponent implements OnInit {
  private apiService = inject(ApiService);

  users = signal<User[]>([]);
  roles = signal<Role[]>([]);
  isLoading = signal(true);
  searchTerm = '';
  activeTab: 'staff' | 'customer' = 'staff';
  roleFilter = '';

  showModal = signal(false);
  modalMode: 'create' | 'edit' = 'create';
  selectedUser: User | null = null;

  formUsername = '';
  formFullName = '';
  formEmail = '';
  formPassword = '';
  formIsActive = true;
  formRoleIds: number[] = [];

  formError = signal<string | null>(null);
  isSaving = signal(false);

  ngOnInit() {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.apiService.getUsers().subscribe({
      next: (response) => {
        if (response.success) {
          this.users.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadRoles() {
    this.apiService.getRoles().subscribe({
      next: (response) => {
        if (response.success) {
          this.roles.set(response.data);
        }
      }
    });
  }

  // Get staff users (non-customer roles)
  get staffUsers(): User[] {
    return this.users().filter(user => {
      const roleNames = this.getUserRoleNames(user);
      return !roleNames.includes('CUSTOMER');
    });
  }

  // Get customer users
  get customerUsers(): User[] {
    return this.users().filter(user => {
      const roleNames = this.getUserRoleNames(user);
      return roleNames.includes('CUSTOMER');
    });
  }

  get filteredUsers(): User[] {
    const baseList = this.activeTab === 'staff' ? this.staffUsers : this.customerUsers;
    let result = baseList;

    // Apply role filter for staff tab
    if (this.activeTab === 'staff' && this.roleFilter) {
      result = result.filter(user => {
        const roleNames = this.getUserRoleNames(user);
        return roleNames.includes(this.roleFilter);
      });
    }

    // Apply search filter
    const query = this.searchTerm.toLowerCase();
    if (query) {
      result = result.filter(user =>
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.fullName?.toLowerCase().includes(query)
      );
    }

    return result;
  }

  // Check if user is a customer (for avatar styling)
  isCustomerUserCheck(user: User): boolean {
    const roleNames = this.getUserRoleNames(user);
    return roleNames.includes('CUSTOMER');
  }

  // Get badge class based on role
  getRoleBadgeClass(roleName: string): string {
    switch (roleName) {
      case 'SUPER_ADMIN': return 'role-badge role-super-admin';
      case 'MARKETING': return 'role-badge role-marketing';
      case 'BRANCH_MANAGER': return 'role-badge role-branch-manager';
      case 'BACK_OFFICE': return 'role-badge role-back-office';
      case 'CUSTOMER': return 'role-badge role-customer';
      default: return 'role-badge role-customer';
    }
  }

  getInitial(user: User): string {
    return (user.fullName?.[0] || user.username[0]).toUpperCase();
  }

  // Helper to get role names - handles both {id, name} objects and string arrays
  getUserRoleNames(user: User): string[] {
    if (!user.roles || user.roles.length === 0) return [];
    // Check if first element is a string or object
    const firstRole = user.roles[0];
    if (typeof firstRole === 'string') {
      return user.roles as unknown as string[];
    }
    // It's Role object array
    return user.roles.map(r => r.name);
  }

  openCreateModal() {
    this.modalMode = 'create';
    this.formUsername = '';
    this.formFullName = '';
    this.formEmail = '';
    this.formPassword = '';
    this.formIsActive = true;
    this.formRoleIds = [];
    this.formError.set(null);
    this.showModal.set(true);
  }

  openEditModal(user: User) {
    this.modalMode = 'edit';
    this.selectedUser = user;
    this.formUsername = user.username;
    this.formFullName = user.fullName || '';
    this.formEmail = user.email;
    this.formPassword = '';
    this.formIsActive = user.isActive;
    this.formRoleIds = user.roles.map(r => r.id);
    this.formError.set(null);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedUser = null;
  }

  toggleRole(roleId: number) {
    const index = this.formRoleIds.indexOf(roleId);
    if (index === -1) {
      this.formRoleIds.push(roleId);
    } else {
      this.formRoleIds.splice(index, 1);
    }
  }

  isRoleSelected(roleId: number): boolean {
    return this.formRoleIds.includes(roleId);
  }

  // Check if current user is a CUSTOMER (role cannot be edited)
  isCustomerUser(): boolean {
    if (!this.selectedUser) return false;
    const roleNames = this.getUserRoleNames(this.selectedUser);
    return roleNames.includes('CUSTOMER') && roleNames.length === 1;
  }

  saveUser() {
    if (!this.formUsername || !this.formEmail || !this.formFullName) {
      this.formError.set('Please fill in all required fields');
      return;
    }

    if (this.modalMode === 'create' && !this.formPassword) {
      this.formError.set('Password is required for new users');
      return;
    }

    if (this.formRoleIds.length === 0) {
      this.formError.set('Please select at least one role');
      return;
    }

    this.isSaving.set(true);
    this.formError.set(null);

    if (this.modalMode === 'create') {
      this.apiService.createUser({
        username: this.formUsername,
        email: this.formEmail,
        fullName: this.formFullName,
        password: this.formPassword,
        roleIds: this.formRoleIds
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadUsers();
            this.closeModal();
          }
          this.isSaving.set(false);
        },
        error: (error) => {
          this.formError.set(error.message || 'Failed to create user');
          this.isSaving.set(false);
        }
      });
    } else if (this.selectedUser) {
      this.apiService.updateUser(this.selectedUser.id, {
        email: this.formEmail,
        fullName: this.formFullName,
        isActive: this.formIsActive,
        roleIds: this.formRoleIds
      } as any).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadUsers();
            this.closeModal();
          }
          this.isSaving.set(false);
        },
        error: (error) => {
          this.formError.set(error.message || 'Failed to update user');
          this.isSaving.set(false);
        }
      });
    }
  }

  deleteUser(user: User) {
    if (confirm('Are you sure you want to delete user "' + user.username + '"?')) {
      this.apiService.deleteUser(user.id).subscribe({
        next: () => this.loadUsers(),
        error: (error) => alert('Failed to delete user: ' + error.message)
      });
    }
  }
}
