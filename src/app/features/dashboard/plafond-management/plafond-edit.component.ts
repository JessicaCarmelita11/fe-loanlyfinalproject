import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService, TenorRateService } from '../../../core';
import { Plafond, TenorRate, TenorRateRequest } from '../../../core/models';

@Component({
  selector: 'app-plafond-edit',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header d-flex justify-content-between align-items-start">
      <div>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-2">
            <li class="breadcrumb-item"><a routerLink="/dashboard/plafonds" class="text-decoration-none text-muted">Plafond Management</a></li>
            <li class="breadcrumb-item active text-secondary" aria-current="page">{{ plafond()?.name || 'Edit' }}</li>
          </ol>
        </nav>
        <h1 class="page-title">Manage Plafond: {{ plafond()?.name }}</h1>
        <p class="page-subtitle">Edit plafond details and manage tenor-based interest rates</p>
      </div>
      <a routerLink="/dashboard/plafonds" class="btn btn-outline-secondary">
        <i class="bi bi-arrow-left me-2"></i>Back
      </a>
    </div>

    @if (isLoading()) {
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    } @else {
      <!-- Plafond Details Card -->
      <div class="glass-card-solid p-4 mb-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="mb-0"><i class="bi bi-info-circle me-2"></i>Plafond Details</h5>
          
          <!-- Active/Inactive Toggle -->
          <div class="form-check form-switch mb-0">
            <input 
              class="form-check-input" 
              type="checkbox" 
              role="switch" 
              id="plafondActiveSwitch" 
              [checked]="plafond()?.isActive" 
              (change)="togglePlafondActive($event)"
              [disabled]="isUpdatingPlafond()">
            <label class="form-check-label ms-2 fw-medium" for="plafondActiveSwitch" 
              [class.text-success]="plafond()?.isActive" 
              [class.text-muted]="!plafond()?.isActive">
              {{ plafond()?.isActive ? 'Produk Aktif' : 'Produk Non-Aktif' }}
            </label>
            @if(isUpdatingPlafond()) {
              <span class="spinner-border spinner-border-sm ms-2 text-primary"></span>
            }
          </div>
        </div>

        <div class="row">
          <div class="col-md-4">
            <div class="detail-label">Name</div>
            <div class="detail-value fw-bold">{{ plafond()?.name }}</div>
          </div>
          <div class="col-md-4">
            <div class="detail-label">Max Amount</div>
            <div class="detail-value">{{ formatCurrency(plafond()?.maxAmount || 0) }}</div>
          </div>
          <div class="col-md-4">
            <div class="detail-label">Status</div>
            <div class="detail-value">
              <span class="badge-status" [class.badge-approved]="plafond()?.isActive" [class.badge-rejected]="!plafond()?.isActive">
                {{ plafond()?.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
          
        </div>
        <div class="mt-3" *ngIf="plafond()?.description">
          <div class="detail-label">Description</div>
          <div class="detail-value">{{ plafond()?.description }}</div>
        </div>
      </div>

      <!-- Tenor Rates Card -->
      <div class="glass-card-solid p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h5 class="mb-0"><i class="bi bi-percent me-2"></i>Tenor Interest Rates</h5>
          <button class="btn btn-primary-glass btn-sm" (click)="openRateModal('create')">
            <i class="bi bi-plus-lg me-2"></i>Add Rate
          </button>
        </div>

        @if (isLoadingRates()) {
          <div class="text-center py-4">
            <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="table table-glass">
              <thead>
                <tr>
                  <th>Tenor (Months)</th>
                  <th>Interest Rate (%)</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (rate of tenorRates(); track rate.id) {
                  <tr>
                    <td class="fw-semibold">{{ rate.tenorMonth }} month(s)</td>
                    <td>
                      <span class="badge bg-info text-dark">{{ rate.interestRate }}%</span>
                    </td>
                    <td>{{ rate.description || '-' }}</td>
                    <td>
                      <span class="badge-status" [class.badge-approved]="rate.isActive" [class.badge-rejected]="!rate.isActive">
                        {{ rate.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-outline-primary me-1" (click)="openRateModal('edit', rate)" title="Edit">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" (click)="deleteRate(rate)" title="Delete">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="text-center py-5 text-muted">
                      <i class="bi bi-percent fs-1 d-block mb-2 opacity-50"></i>
                      No rates configured for this plafond.<br>
                      <small>Click "Add Rate" to define tenor-based interest rates.</small>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }

    <!-- Rate Modal -->
    @if (showRateModal()) {
      <div class="modal-backdrop" (click)="closeRateModal()"></div>
      <div class="modal-container">
        <div class="modal-content glass-card-solid">
          <div class="modal-header">
            <h5 class="modal-title">{{ rateModalMode === 'create' ? 'Add New Rate' : 'Edit Rate' }}</h5>
            <button type="button" class="btn-close" (click)="closeRateModal()">×</button>
          </div>

          <div class="modal-body">
            @if (rateFormError()) {
              <div class="alert alert-danger mb-3">{{ rateFormError() }}</div>
            }

            <form>
              <div class="mb-3">
                <label class="form-label">Tenor (Months) <span class="text-danger">*</span></label>
                <select class="form-select" [(ngModel)]="rateFormTenor" name="tenor">
                  <option [value]="1">1 Month</option>
                  <option [value]="3">3 Months</option>
                  <option [value]="6">6 Months</option>
                  <option [value]="9">9 Months</option>
                  <option [value]="12">12 Months</option>
                  <option [value]="18">18 Months</option>
                  <option [value]="24">24 Months</option>
                  <option [value]="36">36 Months</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label">Interest Rate (%) <span class="text-danger">*</span></label>
                <input type="number" class="form-control" [(ngModel)]="rateFormInterest" name="interest" step="0.01" min="0" max="100">
                <small class="text-muted">e.g., 3.5 for 3.5% interest</small>
              </div>

              <div class="mb-3">
                <label class="form-label">Description</label>
                <input type="text" class="form-control" [(ngModel)]="rateFormDescription" name="description" placeholder="Optional description">
              </div>

              @if (rateModalMode === 'edit') {
                <div class="mb-3">
                  <div class="form-check form-switch">
                    <input type="checkbox" class="form-check-input" id="rateIsActive" [(ngModel)]="rateFormIsActive" name="isActive">
                    <label class="form-check-label" for="rateIsActive">Active</label>
                  </div>
                </div>
              }
            </form>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" (click)="closeRateModal()">Cancel</button>
            <button type="button" class="btn btn-primary-glass" (click)="saveRate()" [disabled]="isSavingRate()">
              @if (isSavingRate()) {
                <span class="spinner-border spinner-border-sm me-2"></span>
              }
              {{ rateModalMode === 'create' ? 'Create' : 'Update' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .detail-label {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
    }
    .detail-value {
      font-size: 1rem;
    }
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1040;
    }
    .modal-container {
      position: fixed;
      top: 50%; left: 50%;
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
    .breadcrumb {
      font-size: 0.875rem;
    }
    .breadcrumb-item a {
      color: rgba(255, 255, 255, 0.7);
    }
    .breadcrumb-item.active {
      color: rgba(255, 255, 255, 0.5);
    }
  `]
})
export class PlafondEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private tenorRateService = inject(TenorRateService);

  plafondId: number = 0;
  plafond = signal<Plafond | null>(null);
  tenorRates = signal<TenorRate[]>([]);

  isLoading = signal(true);
  isUpdatingPlafond = signal(false);
  isLoadingRates = signal(true);

  // Rate Modal State
  showRateModal = signal(false);
  rateModalMode: 'create' | 'edit' = 'create';
  selectedRate: TenorRate | null = null;

  rateFormTenor: number = 6;
  rateFormInterest: number = 0;
  rateFormDescription: string = '';
  rateFormIsActive: boolean = true;

  rateFormError = signal<string | null>(null);
  isSavingRate = signal(false);

  ngOnInit() {
    this.plafondId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.plafondId) {
      this.router.navigate(['/dashboard/plafonds']);
      return;
    }
    this.loadPlafond();
    this.loadRates();
  }

  loadPlafond() {
    this.isLoading.set(true);
    this.apiService.getPlafondById(this.plafondId).subscribe({
      next: (response: any) => {
        const data = response?.data || response;
        this.plafond.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard/plafonds']);
      }
    });
  }

  togglePlafondActive(event: Event) {
    const input = event.target as HTMLInputElement;
    const newStatus = input.checked;
    const currentPlafond = this.plafond();

    if (!currentPlafond) return;

    // Optimistic UI update (optional, but let's wait for API success here to be safe)
    // input.checked = !newStatus; // Revert visually until API confirms

    this.isUpdatingPlafond.set(true);

    // Backend validation requires necessary fields: name, maxAmount, etc.
    // We send the existing values plus the new status.
    const payload: Partial<Plafond> = {
      name: currentPlafond.name,
      description: currentPlafond.description,
      maxAmount: currentPlafond.maxAmount,
      isActive: newStatus
    };

    this.apiService.updatePlafond(this.plafondId, payload).subscribe({
      next: (response: any) => {
        const updatedData = response?.data || response;
        // Update local signal with fresh data
        this.plafond.update(current => {
          if (current) return { ...current, isActive: newStatus };
          return current;
        });
        this.isUpdatingPlafond.set(false);
      },
      error: (error: any) => {
        console.error('Failed to update status', error);
        // Revert the toggle if failed
        input.checked = !newStatus;

        let errorMsg = 'Failed to update plafond status';
        if (error.error && error.error.message) {
          errorMsg += `: ${error.error.message}`;
        }
        alert(errorMsg);
        this.isUpdatingPlafond.set(false);
      }
    });
  }

  loadRates() {
    this.isLoadingRates.set(true);
    this.tenorRateService.getAllRates().subscribe({
      next: (response: any) => {
        let rateList: TenorRate[] = [];

        if (Array.isArray(response)) {
          rateList = response;
        } else if (response?.data && Array.isArray(response.data)) {
          rateList = response.data;
        } else if (response?.content && Array.isArray(response.content)) {
          rateList = response.content;
        }

        const thisPlafondRates = rateList.filter((r: TenorRate) => r.plafondId === this.plafondId);
        this.tenorRates.set(thisPlafondRates);
        this.isLoadingRates.set(false);
      },
      error: () => this.isLoadingRates.set(false)
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  }

  // --- Rate Modal Methods ---
  openRateModal(mode: 'create' | 'edit', rate?: TenorRate) {
    this.rateModalMode = mode;
    this.selectedRate = rate || null;

    if (mode === 'edit' && rate) {
      this.rateFormTenor = rate.tenorMonth;
      this.rateFormInterest = rate.interestRate;
      this.rateFormDescription = rate.description || '';
      this.rateFormIsActive = rate.isActive;
    } else {
      this.rateFormTenor = 6;
      this.rateFormInterest = 0;
      this.rateFormDescription = '';
      this.rateFormIsActive = true;
    }

    this.rateFormError.set(null);
    this.showRateModal.set(true);
  }

  closeRateModal() {
    this.showRateModal.set(false);
    this.selectedRate = null;
  }

  saveRate() {
    if (!this.rateFormTenor || this.rateFormInterest < 0) {
      this.rateFormError.set('Please fill in all required fields with valid values.');
      return;
    }

    if (this.rateModalMode === 'create') {
      const existingAny = this.tenorRates().find((r: TenorRate) => r.tenorMonth === Number(this.rateFormTenor));
      if (existingAny) {
        if (existingAny.isActive) {
          this.rateFormError.set(`An active rate for ${this.rateFormTenor} month(s) already exists.`);
          return;
        } else {
          this.rateFormError.set(`An INACTIVE rate for ${this.rateFormTenor} month(s) exists. Please edit and reactivate it instead.`);
          return;
        }
      }
    }

    this.isSavingRate.set(true);
    this.rateFormError.set(null);

    const request: TenorRateRequest = {
      plafondId: this.plafondId,
      tenorMonth: Number(this.rateFormTenor),
      interestRate: Number(this.rateFormInterest),
      description: this.rateFormDescription || undefined,
      isActive: this.rateFormIsActive
    };

    if (this.rateModalMode === 'create') {
      this.tenorRateService.createRate(request).subscribe({
        next: () => {
          this.loadRates();
          this.closeRateModal();
          this.isSavingRate.set(false);
        },
        error: (error: any) => {
          this.rateFormError.set(error?.error?.message || 'Failed to create rate.');
          this.isSavingRate.set(false);
        }
      });
    } else if (this.selectedRate) {
      this.tenorRateService.updateRate(this.selectedRate.id, request).subscribe({
        next: () => {
          this.loadRates();
          this.closeRateModal();
          this.isSavingRate.set(false);
        },
        error: (error: any) => {
          this.rateFormError.set(error?.error?.message || 'Failed to update rate.');
          this.isSavingRate.set(false);
        }
      });
    }
  }

  deleteRate(rate: TenorRate) {
    if (confirm(`Are you sure you want to delete the rate for ${rate.tenorMonth} month(s)?`)) {
      this.tenorRateService.deleteRate(rate.id).subscribe({
        next: () => this.loadRates(),
        error: (error: any) => alert('Failed to delete rate: ' + (error?.error?.message || error.message))
      });
    }
  }
}
