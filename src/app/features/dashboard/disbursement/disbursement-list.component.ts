import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Disbursement } from '../../../core/models';

@Component({
  selector: 'app-disbursement-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './disbursement-list.component.html',
  styleUrl: './disbursement-list.component.css'
})
export class DisbursementListComponent implements OnInit {
  private apiService = inject(ApiService);

  disbursements = signal<Disbursement[]>([]);
  isLoading = signal(true);

  // Detail modal
  showDetailModal = signal(false);
  selectedDisbursement = signal<Disbursement | null>(null);

  // Action
  actionNote = signal('');
  isProcessing = signal(false);

  ngOnInit() {
    this.loadDisbursements();
  }

  loadDisbursements() {
    this.isLoading.set(true);
    this.apiService.getPendingDisbursements().subscribe({
      next: (response) => {
        if (response.success) {
          this.disbursements.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load disbursements:', error);
        this.isLoading.set(false);
      }
    });
  }

  openDetail(item: Disbursement) {
    this.selectedDisbursement.set(item);
    this.actionNote.set('');
    this.showDetailModal.set(true);
  }

  closeModal() {
    this.showDetailModal.set(false);
    this.selectedDisbursement.set(null);
  }

  processDisbursement() {
    const item = this.selectedDisbursement();
    if (!item) return;

    this.isProcessing.set(true);

    this.apiService.processDisbursement(item.id, this.actionNote()).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadDisbursements();
          this.closeModal();
        }
        this.isProcessing.set(false);
      },
      error: (error) => {
        alert('Failed to process disbursement: ' + error.message);
        this.isProcessing.set(false);
      }
    });
  }

  cancelDisbursement() {
    const item = this.selectedDisbursement();
    if (!item) return;

    if (!this.actionNote()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    this.isProcessing.set(true);

    this.apiService.cancelDisbursement(item.id, this.actionNote()).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadDisbursements();
          this.closeModal();
        }
        this.isProcessing.set(false);
      },
      error: (error) => {
        alert('Failed to cancel disbursement: ' + error.message);
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getMonthlyPayment(): number {
    const item = this.selectedDisbursement();
    if (!item || !item.tenorMonth) return 0;
    return (item.totalAmount || 0) / item.tenorMonth;
  }
}
