import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-customer-list',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">Customer List</h1>
      <p class="page-subtitle">View approved customers and their credit limits</p>
    </div>
    
    <div class="glass-card-solid p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-success">{{ customers().length }} Approved</span>
        </div>
        <input type="text" class="form-control" style="max-width: 250px" 
               placeholder="Search customer..." [(ngModel)]="searchTerm">
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
                <th>Customer</th>
                <th>Plafond</th>
                <th>Approved Limit</th>
                <th>Used Amount</th>
                <th>Available</th>
                <th>Approved Date</th>
              </tr>
            </thead>
            <tbody>
              @for (c of filteredCustomers; track c.applicationId) {
                <tr>
                  <td>
                    <strong>{{ c.customerName || c.customerUsername || '-' }}</strong>
                    @if (c.customerPhone) {
                      <br><small class="text-muted">{{ c.customerPhone }}</small>
                    }
                  </td>
                  <td><span [class]="getPlafondBadgeClass(c.plafondName)">{{ c.plafondName || '-' }}</span></td>
                  <td class="text-success fw-bold">{{ formatCurrency(c.approvedLimit || 0) }}</td>
                  <td>{{ formatCurrency(c.usedAmount || 0) }}</td>
                  <td class="fw-bold">{{ formatCurrency(c.availableLimit || 0) }}</td>
                  <td>{{ formatDate(c.approvedAt || '') }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="text-center py-5 text-muted">
                    <i class="bi bi-person-badge fs-1 d-block mb-2 opacity-50"></i>
                    No approved customers found
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `
})
export class CustomerListComponent implements OnInit {
  private apiService = inject(ApiService);

  customers = signal<any[]>([]);
  isLoading = signal(true);
  searchTerm = '';

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.isLoading.set(true);
    this.apiService.getApprovedCustomers().pipe(
      catchError(() => of({ data: [] }))
    ).subscribe({
      next: (response: any) => {
        const data = response?.data || response || [];
        this.customers.set(Array.isArray(data) ? data : []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  get filteredCustomers(): any[] {
    const q = this.searchTerm.toLowerCase();
    if (!q) return this.customers();
    return this.customers().filter((c: any) =>
      c.customerName?.toLowerCase().includes(q) ||
      c.plafondName?.toLowerCase().includes(q)
    );
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getPlafondBadgeClass(name: string): string {
    if (!name) return 'badge bg-secondary';

    const n = name.toLowerCase();
    if (n.includes('plus')) return 'badge badge-plafond-plus';
    if (n.includes('bronze')) return 'badge badge-plafond-bronze';
    if (n.includes('silver')) return 'badge badge-plafond-silver';
    if (n.includes('gold')) return 'badge badge-plafond-gold';
    if (n.includes('diamond')) return 'badge badge-plafond-diamond';
    if (n.includes('vvip')) return 'badge badge-plafond-vvip';

    return 'badge bg-info'; // Default fallback
  }
}
