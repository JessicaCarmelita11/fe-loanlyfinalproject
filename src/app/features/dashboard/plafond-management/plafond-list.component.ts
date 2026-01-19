import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Plafond } from '../../../core/models';

@Component({
  selector: 'app-plafond-list',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header d-flex justify-content-between align-items-start">
      <div>
        <h1 class="page-title">Plafond Management</h1>
        <p class="page-subtitle">Manage loan products</p>
      </div>
      <button class="btn btn-primary-glass" (click)="openCreateModal()">
        <i class="bi bi-plus-lg me-2"></i> Add Plafond
      </button>
    </div>
    
    <div class="glass-card-solid p-4">
      <div class="mb-4">
        <input 
          type="text" 
          class="form-control" 
          style="max-width: 300px" 
          placeholder="Search plafonds..."
          [(ngModel)]="searchTerm">
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
                <th>Description</th>
                <th>Max Amount</th>
                <th>Status</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (plafond of filteredPlafonds; track plafond.id) {
                <tr>
                  <td class="fw-semibold">{{ plafond.name }}</td>
                  <td>{{ plafond.description || '-' }}</td>
                  <td>{{ formatCurrency(plafond.maxAmount) }}</td>
                  <td>
                    <span class="badge-status" [class.badge-approved]="plafond.isActive" [class.badge-rejected]="!plafond.isActive">
                      {{ plafond.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" (click)="openEditModal(plafond)" title="Edit">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" (click)="deletePlafond(plafond)" title="Delete">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="text-center py-5 text-muted">
                    <i class="bi bi-credit-card-2-front fs-1 d-block mb-2 opacity-50"></i>
                    No plafonds found
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
            <h5 class="modal-title">{{ modalMode === 'create' ? 'Create Plafond' : 'Edit Plafond' }}</h5>
            <button type="button" class="btn-close" (click)="closeModal()">×</button>
          </div>
          
          <div class="modal-body">
            @if (formError()) {
              <div class="alert alert-danger mb-3">{{ formError() }}</div>
            }
            
            <form>
              <div class="mb-3">
                <label class="form-label">Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="formName" name="name">
              </div>
              
              <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea class="form-control" rows="3" [(ngModel)]="formDescription" name="description"></textarea>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Max Amount <span class="text-danger">*</span></label>
                <input type="number" class="form-control" [(ngModel)]="formMaxAmount" name="maxAmount">
              </div>
              
              @if (modalMode === 'edit') {
                <div class="mb-3">
                  <div class="form-check form-switch">
                    <input type="checkbox" class="form-check-input" id="isActive" [(ngModel)]="formIsActive" name="isActive">
                    <label class="form-check-label" for="isActive">Active</label>
                  </div>
                </div>
              }
            </form>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" (click)="closeModal()">Cancel</button>
            <button type="button" class="btn btn-primary-glass" (click)="savePlafond()" [disabled]="isSaving()">
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
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1040;
    }
    .modal-container {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1050;
      width: 100%;
      max-width: 500px;
      padding: 1rem;
    }
    .modal-content {
      border-radius: 1rem;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .modal-body {
      padding: 1.5rem;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #999;
      cursor: pointer;
    }
  `]
})
export class PlafondListComponent implements OnInit {
  private apiService = inject(ApiService);

  plafonds = signal<Plafond[]>([]);
  isLoading = signal(true);
  searchTerm = '';

  showModal = signal(false);
  modalMode: 'create' | 'edit' = 'create';
  selectedPlafond: Plafond | null = null;

  formName = '';
  formDescription = '';
  formMaxAmount = 0;
  formIsActive = true;

  formError = signal<string | null>(null);
  isSaving = signal(false);

  ngOnInit() {
    this.loadPlafonds();
  }

  loadPlafonds() {
    this.isLoading.set(true);
    this.apiService.getPlafonds().subscribe({
      next: (response: any) => {
        // Handle different response formats
        let plafondList: Plafond[] = [];

        if (Array.isArray(response)) {
          // Direct array response
          plafondList = response;
        } else if (response?.data && Array.isArray(response.data)) {
          // { success: true, data: [...] }
          plafondList = response.data;
        } else if (response?.content && Array.isArray(response.content)) {
          // Paginated response { content: [...], totalElements: ... }
          plafondList = response.content;
        } else if (response?.success && response?.data?.content) {
          // { success: true, data: { content: [...] } }
          plafondList = response.data.content;
        }

        this.plafonds.set(plafondList);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  get filteredPlafonds(): Plafond[] {
    const query = this.searchTerm.toLowerCase();
    if (!query) return this.plafonds();

    return this.plafonds().filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query)
    );
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  }

  openCreateModal() {
    this.modalMode = 'create';
    this.formName = '';
    this.formDescription = '';
    this.formMaxAmount = 0;
    this.formIsActive = true;
    this.formError.set(null);
    this.showModal.set(true);
  }

  openEditModal(plafond: Plafond) {
    this.modalMode = 'edit';
    this.selectedPlafond = plafond;
    this.formName = plafond.name;
    this.formDescription = plafond.description || '';
    this.formMaxAmount = plafond.maxAmount;
    this.formIsActive = plafond.isActive;
    this.formError.set(null);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedPlafond = null;
  }

  savePlafond() {
    if (!this.formName || !this.formMaxAmount) {
      this.formError.set('Please fill in all required fields');
      return;
    }

    this.isSaving.set(true);
    this.formError.set(null);

    if (this.modalMode === 'create') {
      this.apiService.createPlafond({
        name: this.formName,
        description: this.formDescription,
        maxAmount: this.formMaxAmount,
        isActive: true
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadPlafonds();
            this.closeModal();
          }
          this.isSaving.set(false);
        },
        error: (error) => {
          this.formError.set(error.message || 'Failed to create plafond');
          this.isSaving.set(false);
        }
      });
    } else if (this.selectedPlafond) {
      this.apiService.updatePlafond(this.selectedPlafond.id, {
        name: this.formName,
        description: this.formDescription,
        maxAmount: this.formMaxAmount,
        isActive: this.formIsActive
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadPlafonds();
            this.closeModal();
          }
          this.isSaving.set(false);
        },
        error: (error) => {
          this.formError.set(error.message || 'Failed to update plafond');
          this.isSaving.set(false);
        }
      });
    }
  }

  deletePlafond(plafond: Plafond) {
    if (confirm('Are you sure you want to delete plafond "' + plafond.name + '"?')) {
      this.apiService.deletePlafond(plafond.id).subscribe({
        next: () => this.loadPlafonds(),
        error: (error) => alert('Failed to delete plafond: ' + error.message)
      });
    }
  }
}
