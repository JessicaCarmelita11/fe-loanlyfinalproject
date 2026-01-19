import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Disbursement } from '../../../core/models';

// Interface for plafond history
interface PlafondHistory {
  id: number;
  userPlafondId: number;
  newStatus: string;
  actionByUserId: number;
  actionByRole: string;
  actionByUsername?: string;
  note?: string;
  createdAt?: string;
  customerName?: string;
  username?: string;
  plafondName?: string;
}

@Component({
  selector: 'app-history-list',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">Riwayat Pengajuan</h1>
      <p class="page-subtitle">View application history and status</p>
    </div>
    
    <!-- Tabs - Modern Pill Style -->
    <div class="history-tabs mb-4">
      <button class="tab-btn" [class.active]="activeTab() === 'plafond'" (click)="activeTab.set('plafond')">
        <i class="bi bi-credit-card"></i>
        Pengajuan Plafond
        <span class="tab-count">{{ plafondHistory().length }}</span>
      </button>
      <button class="tab-btn" [class.active]="activeTab() === 'disbursement'" (click)="activeTab.set('disbursement')">
        <i class="bi bi-cash-coin"></i>
        Pengajuan Pencairan
        <span class="tab-count">{{ disbursements().length }}</span>
      </button>
    </div>

    <!-- Plafond Tab Content -->
    @if (activeTab() === 'plafond') {
      <div class="glass-card-solid p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h5 class="mb-0"><i class="bi bi-clock-history me-2"></i>Riwayat Pengajuan Plafond</h5>
          <input type="text" class="form-control" style="max-width: 250px" 
                 placeholder="Search..." [(ngModel)]="searchPlafond">
        </div>
        
        @if (isLoadingPlafond()) {
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="table table-glass">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Process Status</th>
                  <th>Action By</th>
                  <th>Role</th>
                  <th>Note</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                @for (h of filteredPlafondHistory; track h.id) {
                  <tr>
                    <td><strong>#{{ h.id }}</strong></td>
                    <td>{{ h.customerName || h.username || '-' }}</td>
                    <td>
                      <span class="badge-status" [class]="getPlafondStatusClass(h.newStatus)">
                        {{ formatPlafondStatus(h.newStatus) }}
                      </span>
                    </td>
                    <td>{{ h.actionByUsername || 'User #' + h.actionByUserId }}</td>
                    <td><span class="role-badge" [class]="getRoleBadgeClass(h.actionByRole)">{{ h.actionByRole }}</span></td>
                    <td>{{ h.note || '-' }}</td>
                    <td>{{ formatDate(h.createdAt || '') }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="text-center py-4 text-muted">
                      <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                      No plafond history found
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }

    <!-- Disbursement Tab Content -->
    @if (activeTab() === 'disbursement') {
      <div class="glass-card-solid p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h5 class="mb-0"><i class="bi bi-cash-coin me-2"></i>Riwayat Pengajuan Pencairan</h5>
          <input type="text" class="form-control" style="max-width: 250px" 
                 placeholder="Search..." [(ngModel)]="searchDisbursement">
        </div>
        
        @if (isLoadingDisbursement()) {
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="table table-glass">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Plafond</th>
                  <th>Amount</th>
                  <th>Tenor</th>
                  <th>Status</th>
                  <th>Request Date</th>
                </tr>
              </thead>
              <tbody>
                @for (d of filteredDisbursements; track d.id) {
                  <tr>
                    <td><strong>#{{ d.id }}</strong></td>
                    <td>{{ d.customerName || d.customerUsername || '-' }}</td>
                    <td>{{ d.plafondName || '-' }}</td>
                    <td>{{ formatCurrency(d.amount) }}</td>
                    <td>{{ d.tenorMonth || '-' }} bulan</td>
                    <td>
                      <span class="badge-status" [class]="getDisbursementStatusClass(d.status)">
                        {{ formatDisbursementStatus(d.status) }}
                      </span>
                    </td>
                    <td>{{ formatDate(d.requestedAt) }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="text-center py-4 text-muted">
                      <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                      No disbursement requests found
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    /* Tabs - Modern Pill Style */
    .history-tabs {
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

    /* Status Badges */
    .badge-pending, .badge-waiting {
      background: rgba(255, 193, 7, 0.15);
      color: #FBBF24;
    }
    .badge-approved, .badge-disbursed {
      background: rgba(34, 197, 94, 0.15);
      color: #4ADE80;
    }
    .badge-rejected, .badge-cancelled {
      background: rgba(239, 68, 68, 0.15);
      color: #F87171;
    }
    .badge-processing {
      background: rgba(6, 182, 212, 0.15);
      color: #22D3EE;
    }
  `]
})
export class HistoryListComponent implements OnInit {
  private apiService = inject(ApiService);

  activeTab = signal<'plafond' | 'disbursement'>('plafond');

  // Plafond History
  plafondHistory = signal<PlafondHistory[]>([]);
  isLoadingPlafond = signal(true);
  searchPlafond = '';

  // Disbursement
  disbursements = signal<Disbursement[]>([]);
  isLoadingDisbursement = signal(true);
  searchDisbursement = '';

  ngOnInit() {
    this.loadPlafondHistory();
    this.loadDisbursements();
  }

  loadPlafondHistory() {
    this.isLoadingPlafond.set(true);
    this.apiService.getPlafondHistory().pipe(
      catchError(() => of({ data: [] }))
    ).subscribe({
      next: (response: any) => {
        const data = response?.data || response || [];
        this.plafondHistory.set(Array.isArray(data) ? data : []);
        this.isLoadingPlafond.set(false);
      },
      error: () => this.isLoadingPlafond.set(false)
    });
  }

  loadDisbursements() {
    this.isLoadingDisbursement.set(true);
    this.apiService.getAllDisbursements().pipe(
      catchError(() => of({ data: [] }))
    ).subscribe({
      next: (response: any) => {
        const data = response?.data || response || [];
        this.disbursements.set(Array.isArray(data) ? data : []);
        this.isLoadingDisbursement.set(false);
      },
      error: () => this.isLoadingDisbursement.set(false)
    });
  }

  get filteredPlafondHistory(): PlafondHistory[] {
    const q = this.searchPlafond.toLowerCase();
    if (!q) return this.plafondHistory();
    return this.plafondHistory().filter(h =>
      h.customerName?.toLowerCase().includes(q) ||
      h.username?.toLowerCase().includes(q) ||
      h.actionByRole?.toLowerCase().includes(q) ||
      h.newStatus?.toLowerCase().includes(q) ||
      h.note?.toLowerCase().includes(q)
    );
  }

  get filteredDisbursements(): any[] {
    const q = this.searchDisbursement.toLowerCase();
    if (!q) return this.disbursements();
    return this.disbursements().filter((d: any) =>
      d.plafondName?.toLowerCase().includes(q) ||
      d.customerName?.toLowerCase().includes(q) ||
      d.customerUsername?.toLowerCase().includes(q)
    );
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount || 0);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  formatPlafondStatus(status: string): string {
    const map: Record<string, string> = {
      'PENDING_REVIEW': 'Pending Review',
      'WAITING_APPROVAL': 'Waiting Approval',
      'APPROVED': 'Approved',
      'REJECTED': 'Rejected'
    };
    return map[status] || status || '-';
  }

  getPlafondStatusClass(status: string): string {
    const map: Record<string, string> = {
      'PENDING_REVIEW': 'badge-pending',
      'WAITING_APPROVAL': 'badge-waiting',
      'APPROVED': 'badge-approved',
      'REJECTED': 'badge-rejected'
    };
    return map[status] || 'badge-pending';
  }

  formatDisbursementStatus(status: string): string {
    const map: Record<string, string> = {
      'PENDING': 'Waiting Disburse',
      'WAITING_DISBURSEMENT': 'Waiting Disburse',
      'PROCESSING': 'Processing',
      'DISBURSED': 'Disbursed',
      'CANCELLED': 'Cancelled'
    };
    return map[status] || status;
  }

  getDisbursementStatusClass(status: string): string {
    const map: Record<string, string> = {
      'PENDING': 'badge-waiting',
      'WAITING_DISBURSEMENT': 'badge-waiting',
      'PROCESSING': 'badge-processing',
      'DISBURSED': 'badge-disbursed',
      'CANCELLED': 'badge-cancelled'
    };
    return map[status] || 'badge-waiting';
  }
}
