import { Component, signal, inject, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { catchError, forkJoin } from 'rxjs';
import { of } from 'rxjs';
import Chart from 'chart.js/auto';

interface DashboardStats {
  totalApplications: number;
  pendingReview: number;
  waitingApproval: number;
  approved: number;
  disbursed: number;
  totalDisbursedAmount: number;
  totalExpectedRevenue: number;
}

@Component({
  selector: 'app-dashboard-home',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Welcome back, {{ currentUser()?.fullName || 'User' }}!</p>
    </div>
    
    <!-- Stats Row 1: Applications -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-md-4 col-lg">
        <div class="stat-card">
          <div class="stat-icon purple">
            <i class="bi bi-folder2-open"></i>
          </div>
          <div class="stat-value">{{ stats().totalApplications }}</div>
          <div class="stat-label">Total Aplikasi</div>
        </div>
      </div>
      
      <div class="col-6 col-md-4 col-lg">
        <div class="stat-card">
          <div class="stat-icon blue">
            <i class="bi bi-file-earmark-text"></i>
          </div>
          <div class="stat-value">{{ stats().pendingReview }}</div>
          <div class="stat-label">Pending Review</div>
        </div>
      </div>
      
      <div class="col-6 col-md-4 col-lg">
        <div class="stat-card">
          <div class="stat-icon orange">
            <i class="bi bi-hourglass-split"></i>
          </div>
          <div class="stat-value">{{ stats().waitingApproval }}</div>
          <div class="stat-label">Waiting Approval</div>
        </div>
      </div>
      
      <div class="col-6 col-md-4 col-lg">
        <div class="stat-card">
          <div class="stat-icon green">
            <i class="bi bi-check-circle"></i>
          </div>
          <div class="stat-value">{{ stats().approved }}</div>
          <div class="stat-label">Approved</div>
        </div>
      </div>
      
      <div class="col-6 col-md-4 col-lg">
        <div class="stat-card">
          <div class="stat-icon teal">
            <i class="bi bi-cash-stack"></i>
          </div>
          <div class="stat-value">{{ stats().disbursed }}</div>
          <div class="stat-label">Waiting Disbursement</div>
        </div>
      </div>
    </div>
    
    <!-- Stats Row 2: Financial Summary -->
    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <div class="glass-card-solid p-4">
          <div class="d-flex align-items-center">
            <div class="financial-icon bg-success-subtle">
              <i class="bi bi-wallet2 text-success fs-3"></i>
            </div>
            <div class="ms-3">
              <div class="text-muted small">Total Dana Dicairkan</div>
              <div class="fs-4 fw-bold text-success">{{ formatCurrency(stats().totalDisbursedAmount) }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <div class="glass-card-solid p-4">
          <div class="d-flex align-items-center">
            <div class="financial-icon bg-primary-subtle">
              <i class="bi bi-graph-up-arrow text-primary fs-3"></i>
            </div>
            <div class="ms-3">
              <div class="text-muted small">Estimasi Pendapatan (Pokok + Bunga)</div>
              <div class="fs-4 fw-bold text-primary">{{ formatCurrency(stats().totalExpectedRevenue) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Chart and Quick Actions -->
    <div class="row g-4">
      <div class="col-lg-8">
        <div class="glass-card-solid p-4">
          <h5 class="mb-4"><i class="bi bi-bar-chart-fill me-2"></i>Distribusi Tipe Plafond</h5>
          @if (isLoadingChart()) {
            <div class="text-center py-5">
              <div class="spinner-border text-primary" role="status"></div>
            </div>
          } @else {
            <div style="height: 300px;">
              <canvas #loanChart></canvas>
            </div>
          }
        </div>
      </div>
      
      <div class="col-lg-4">
        <div class="glass-card-solid p-4">
          <h5 class="mb-4">Quick Actions</h5>
          <div class="d-grid gap-2">
            @if (hasRole(['SUPER_ADMIN'])) {
              <a routerLink="/dashboard/users" class="btn btn-outline-primary">
                <i class="bi bi-people me-2"></i> Manage Users
              </a>
            }
            @if (hasRole(['SUPER_ADMIN', 'MARKETING'])) {
              <a routerLink="/dashboard/review" class="btn btn-outline-primary">
                <i class="bi bi-clipboard-check me-2"></i> Review Applications
              </a>
            }
            @if (hasRole(['SUPER_ADMIN', 'BRANCH_MANAGER'])) {
              <a routerLink="/dashboard/approval" class="btn btn-outline-primary">
                <i class="bi bi-check2-square me-2"></i> Approve Applications
              </a>
            }
            @if (hasRole(['SUPER_ADMIN', 'BACK_OFFICE'])) {
              <a routerLink="/dashboard/disbursement" class="btn btn-outline-primary">
                <i class="bi bi-cash-stack me-2"></i> Process Disbursements
              </a>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .financial-icon {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .bg-success-subtle {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.15) 100%);
    }
    
    .bg-primary-subtle {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%);
    }
    
    .stat-icon.teal {
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(34, 211, 238, 0.15) 100%);
      color: #22D3EE;
    }
    
    .stat-icon.purple {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%);
      color: #A78BFA;
    }
    
    .stat-icon.cyan {
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(34, 211, 238, 0.15) 100%);
      color: #22D3EE;
    }
    
    .stat-icon.blue {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(96, 165, 250, 0.15) 100%);
      color: #60A5FA;
    }
    
    .stat-icon.orange {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(251, 146, 60, 0.15) 100%);
      color: #FB923C;
    }
    
    .stat-icon.green {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, rgba(74, 222, 128, 0.15) 100%);
      color: #4ADE80;
    }
    
    .text-success {
      color: #16A34A !important;
    }
    
    .text-primary {
      color: #2563EB !important;
    }
    
    .fs-4.fw-bold.text-success {
      background: linear-gradient(135deg, #16A34A 0%, #22C55E 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .fs-4.fw-bold.text-primary {
      background: linear-gradient(135deg, #2563EB 0%, #4F46E5 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .btn-outline-primary {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #2563EB;
      border-radius: 12px;
      padding: 12px 20px;
      transition: all 0.3s ease;
      text-decoration: none;
      display: flex;
      align-items: center;
    }
    
    .btn-outline-primary:hover {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(139, 92, 246, 0.2) 100%);
      border-color: rgba(59, 130, 246, 0.5);
      color: #1E40AF;
      transform: translateX(4px);
    }
    
    .btn-outline-primary i {
      color: #3B82F6;
    }
    
    .btn-outline-primary.active {
      background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
      border-color: transparent;
      color: white;
    }
    
    .btn-outline-primary.active i {
      color: white;
    }
    
    .fs-4.fw-bold {
      font-size: 1.5rem !important;
    }
    
    .spinner-border.text-primary {
      color: #3B82F6 !important;
    }
  `]
})
export class DashboardHomeComponent implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  @ViewChild('loanChart') chartRef!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  currentUser = this.authService.currentUser;
  isLoadingChart = signal(true);

  stats = signal<DashboardStats>({
    totalApplications: 0,
    pendingReview: 0,
    waitingApproval: 0,
    approved: 0,
    disbursed: 0,
    totalDisbursedAmount: 0,
    totalExpectedRevenue: 0
  });

  ngOnInit() {
    this.loadDashboardStats();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.loadChartData();
    }, 500);
  }

  loadDashboardStats() {
    const baseUrl = environment.apiUrl;

    // Direct calculation from multiple endpoints (since dashboard-stats endpoint is missing)
    forkJoin({
      pendingReview: this.http.get<any>(`${baseUrl}/marketing/plafond-applications/pending`).pipe(catchError(() => of({ data: [] }))),
      waitingApproval: this.http.get<any>(`${baseUrl}/branch-manager/plafond-applications/pending`).pipe(catchError(() => of({ data: [] }))),
      approved: this.http.get<any>(`${baseUrl}/admin/customers/approved`).pipe(catchError(() => of({ data: [] }))),
      disbursements: this.http.get<any>(`${baseUrl}/back-office/disbursements/pending`).pipe(catchError(() => of({ data: [] }))),
      allHistory: this.http.get<any>(`${baseUrl}/admin/plafond-histories`).pipe(catchError(() => of({ data: [] })))
    }).subscribe({
      next: (response: any) => {
        // Calculate from multiple sources
        const pending = response.pendingReview?.data?.length || 0;
        const waiting = response.waitingApproval?.data?.length || 0;
        const approved = response.approved?.data?.length || 0;
        const disbursements = response.disbursements?.data || [];
        const allHistory = response.allHistory?.data || [];

        // Count disbursed from history
        const disbursedCount = allHistory.filter((h: any) =>
          h.newStatus === 'DISBURSED' || h.status === 'DISBURSED'
        ).length;

        // Calculate totals from approved customers
        const approvedData = response.approved?.data || [];
        let totalDisbursed = 0;
        let totalRevenue = 0;

        approvedData.forEach((c: any) => {
          totalDisbursed += c.usedAmount || 0;
          // Estimate revenue: usedAmount + 12.5% interest (default rate)
          totalRevenue += (c.usedAmount || 0) * 1.125;
        });

        this.stats.set({
          totalApplications: pending + waiting + approved + disbursedCount,
          pendingReview: pending,
          waitingApproval: waiting,
          approved: approved,
          disbursed: disbursedCount || disbursements.length,
          totalDisbursedAmount: totalDisbursed,
          totalExpectedRevenue: totalRevenue
        });
      }
    });
  }

  loadChartData() {
    this.isLoadingChart.set(true);

    const baseUrl = environment.apiUrl;
    // Fetch approved customers to get plafond distribution
    this.http.get<any>(`${baseUrl}/admin/customers/approved`).pipe(
      catchError(() => {
        // Fallback: Generate sample data
        return of({
          data: []
        });
      })
    ).subscribe({
      next: (response: any) => {
        const customers = response.data || [];

        // Group by plafondName
        const plafondCounts: { [key: string]: number } = {};
        customers.forEach((c: any) => {
          const name = c.plafondName || 'Unknown';
          plafondCounts[name] = (plafondCounts[name] || 0) + 1;
        });

        const labels = Object.keys(plafondCounts);
        const counts = Object.values(plafondCounts);

        // Use sample data if no data available
        const chartData = labels.length > 0
          ? { labels, counts }
          : { labels: ['Gold', 'Silver', 'Bronze', 'Diamond'], counts: [12, 25, 18, 8] };

        // First set loading to false so canvas renders
        this.isLoadingChart.set(false);

        // Wait for Angular to render canvas, then create chart
        setTimeout(() => {
          this.createChart(chartData);
        }, 100);
      }
    });
  }

  createChart(data: any) {
    if (!this.chartRef?.nativeElement) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Data for plafond type comparison
    const labels = data.labels || ['Gold', 'Silver', 'Bronze', 'Diamond'];
    const counts = data.counts || [12, 25, 18, 8];

    // Map colors based on Plafond Name (ignoring case)
    const getColorForPlafond = (name: string) => {
      const n = name.toLowerCase();
      if (n.includes('plus')) return { bg: 'rgba(230, 245, 242, 1)', border: 'rgba(127, 219, 202, 1)' }; // Greenish/Mint
      if (n.includes('bronze')) return { bg: 'rgba(247, 235, 227, 1)', border: 'rgba(234, 158, 87, 1)' }; // Orange/Brown
      if (n.includes('silver')) return { bg: 'rgba(244, 246, 251, 1)', border: 'rgba(148, 163, 184, 1)' }; // Silver
      if (n.includes('gold')) return { bg: 'rgba(255, 249, 235, 1)', border: 'rgba(251, 191, 36, 1)' };   // Gold
      if (n.includes('diamond')) return { bg: 'rgba(235, 245, 255, 1)', border: 'rgba(96, 165, 250, 1)' }; // Blue-ish
      if (n.includes('vvip')) return { bg: 'rgba(245, 240, 255, 1)', border: 'rgba(167, 139, 250, 1)' };  // Purple

      // Default fallback
      return { bg: 'rgba(100, 116, 139, 0.2)', border: 'rgba(100, 116, 139, 0.5)' };
    };

    const colors = labels.map((label: string) => getColorForPlafond(label).bg);
    const borderColors = labels.map((label: string) => getColorForPlafond(label).border);

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Jumlah Pengajuan',
            data: counts,
            backgroundColor: colors,
            borderColor: borderColors,
            borderWidth: 2,
            borderRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y} pengajuan`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 5
            },
            grid: {
              color: 'rgba(0,0,0,0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }

  hasRole(roles: string[]): boolean {
    return this.authService.hasRole(roles);
  }
}
