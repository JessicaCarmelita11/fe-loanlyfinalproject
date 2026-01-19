import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UserPlafond } from '../../../core/models';

@Component({
  selector: 'app-review-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './review-list.component.html',
  styleUrl: './review-list.component.css'
})
export class ReviewListComponent implements OnInit {
  private apiService = inject(ApiService);

  applications = signal<UserPlafond[]>([]);
  isLoading = signal(true);

  // Detail modal
  showDetailModal = signal(false);
  selectedApplication = signal<UserPlafond | null>(null);

  // Action
  actionNote = signal('');
  isProcessing = signal(false);

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    this.isLoading.set(true);
    this.apiService.getPendingReviewApplications().subscribe({
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
    this.actionNote.set('');
    this.showDetailModal.set(true);
  }

  closeModal() {
    this.showDetailModal.set(false);
    this.selectedApplication.set(null);
  }

  reviewApplication(approved: boolean) {
    const app = this.selectedApplication();
    if (!app) return;

    this.isProcessing.set(true);

    this.apiService.reviewApplication(app.id, approved, this.actionNote()).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadApplications();
          this.closeModal();
        }
        this.isProcessing.set(false);
      },
      error: (error) => {
        alert('Failed to review application: ' + error.message);
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
  isImageFile(path: string): boolean {
    if (!path) return false;
    const ext = path.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
  }

  getDocumentUrl(path: string): string {
    if (!path) return '';
    // If already a full URL, return as is
    if (path.startsWith('http')) return path;
    // Return relative path - will be proxied to backend
    return path.startsWith('/') ? path : `/${path}`;
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  openDocument(path: string) {
    console.log('Opening document, path:', path);
    const url = this.getDocumentUrl(path);
    console.log('Generated URL:', url);
    if (url) {
      window.open(url, '_blank');
    }
  }

  downloadDocument(path: string, documentType?: string) {
    const url = this.getDocumentUrl(path);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = documentType || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
