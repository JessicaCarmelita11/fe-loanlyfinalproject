import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-role-list',
    imports: [CommonModule],
    template: `
    <div class="page-header">
      <h1 class="page-title">Role Management</h1>
      <p class="page-subtitle">Manage roles and permissions</p>
    </div>
    
    <div class="glass-card-solid p-4">
      <div class="text-center py-5 text-muted">
        <i class="bi bi-shield-lock fs-1 d-block mb-2 opacity-50"></i>
        Role management will be implemented
      </div>
    </div>
  `
})
export class RoleListComponent { }
