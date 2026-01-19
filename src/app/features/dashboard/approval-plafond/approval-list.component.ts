import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UserPlafond } from '../../../core/models';

@Component({
  selector: 'app-approval-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './approval-list.component.html',
  styleUrl: './approval-list.component.css'
})
export class ApprovalListComponent implements OnInit {
  private apiService = inject(ApiService);

  applications = signal<UserPlafond[]>([]);
  isLoading = signal(true);

  // Detail modal
  showDetailModal = signal(false);
  selectedApplication = signal<UserPlafond | null>(null);

  // Action
  approvedLimit = signal<number>(0);
  actionNote = signal('');
  isProcessing = signal(false);

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    this.isLoading.set(true);
    this.apiService.getWaitingApprovalApplications().subscribe({
      next: (response) => {
        if (response.success) {
          this.applications.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load applications:', error);
        this.isLoading.set(false);
      }
    });
  }

  openDetail(app: UserPlafond) {
    this.selectedApplication.set(app);
    // Set approved limit to 0, Branch Manager will set the value
    this.approvedLimit.set(0);
    this.actionNote.set('');
    this.showDetailModal.set(true);
  }

  closeModal() {
    this.showDetailModal.set(false);
    this.selectedApplication.set(null);
  }

  approveApplication(approved: boolean) {
    const app = this.selectedApplication();
    if (!app) return;

    // Validate approved limit if approving
    if (approved) {
      const limit = this.approvedLimit();
      const maxAmount = app.plafond?.maxAmount || 0;

      if (!limit || limit <= 0) {
        alert('Please set an approved limit');
        return;
      }

      if (limit > maxAmount) {
        alert(`Approved limit cannot exceed max amount (${this.formatCurrency(maxAmount)})`);
        return;
      }
    }

    this.isProcessing.set(true);

    this.apiService.approveApplication(
      app.id,
      approved,
      approved ? this.approvedLimit() : undefined,
      this.actionNote()
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadApplications();
          this.closeModal();
        }
        this.isProcessing.set(false);
      },
      error: (error) => {
        alert('Failed to process application: ' + error.message);
        this.isProcessing.set(false);
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // Document helpers
  getDocumentUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return path.startsWith('/') ? path : `/${path}`;
  }

  openDocument(path: string) {
    const url = this.getDocumentUrl(path);
    if (url) {
      window.open(url, '_blank');
    }
  }
}
