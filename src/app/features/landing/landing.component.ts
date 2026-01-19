import { Component, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Plafond } from '../../core/models';

@Component({
    selector: 'app-landing',
    imports: [CommonModule, RouterLink],
    templateUrl: './landing.component.html',
    styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit, OnDestroy {
    showFloatingMenu = false;
    plafonds = signal<Plafond[]>([]);
    isLoading = signal(true);

    // Rotating hero text
    heroWords = ['Smart', 'Simple', 'Secure', 'Trusted', 'Modern'];
    currentWordIndex = signal(0);
    currentWord = signal(this.heroWords[0]);
    isAnimating = signal(false);
    private rotationInterval: any;

    @HostListener('window:scroll', [])
    onWindowScroll() {
        // Show menu when scrolled down 50px
        this.showFloatingMenu = window.scrollY > 50;
    }

    constructor(private apiService: ApiService) { }

    ngOnInit() {
        this.loadPlafonds();
        this.startWordRotation();
    }

    ngOnDestroy() {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
        }
    }

    startWordRotation() {
        this.rotationInterval = setInterval(() => {
            // Start cube rotate out
            this.isAnimating.set(true);

            setTimeout(() => {
                // Change word
                const nextIndex = (this.currentWordIndex() + 1) % this.heroWords.length;
                this.currentWordIndex.set(nextIndex);
                this.currentWord.set(this.heroWords[nextIndex]);

                // Trigger cube rotate in
                this.isAnimating.set(false);
            }, 400); // Duration of rotate out
        }, 3000); // Change word every 3 seconds
    }

    loadPlafonds() {
        this.apiService.getPublicPlafonds().subscribe({
            next: (response) => {
                if (response.success) {
                    this.plafonds.set(response.data);
                }
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
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

    // Get tier-based styling for product cards
    getTierStyle(plafondName: string): { background: string; border: string; btnClass: string; btnStyle: string } {
        const name = plafondName.toLowerCase();

        if (name.includes('plus')) {
            return {
                background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                btnClass: 'btn-tier-plus',
                btnStyle: ''
            };
        } else if (name.includes('bronze')) {
            return {
                background: 'linear-gradient(180deg, rgba(180, 83, 9, 0.15) 0%, rgba(180, 83, 9, 0.05) 100%)',
                border: '1px solid rgba(180, 83, 9, 0.3)',
                btnClass: 'btn-tier-bronze',
                btnStyle: ''
            };
        } else if (name.includes('silver')) {
            return {
                background: 'linear-gradient(180deg, rgba(156, 163, 175, 0.15) 0%, rgba(156, 163, 175, 0.05) 100%)',
                border: '1px solid rgba(156, 163, 175, 0.3)',
                btnClass: 'btn-tier-silver',
                btnStyle: ''
            };
        } else if (name.includes('gold')) {
            return {
                background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                btnClass: 'btn-tier-gold',
                btnStyle: ''
            };
        } else if (name.includes('diamond')) {
            return {
                background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                btnClass: 'btn-tier-diamond',
                btnStyle: ''
            };
        } else if (name.includes('vvip')) {
            return {
                background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                btnClass: 'btn-tier-vvip',
                btnStyle: ''
            };
        }

        // Default
        return {
            background: 'linear-gradient(180deg, rgba(75, 85, 99, 0.15) 0%, rgba(75, 85, 99, 0.05) 100%)',
            border: '1px solid rgba(75, 85, 99, 0.3)',
            btnClass: 'btn-tier-default',
            btnStyle: ''
        };
    }
}
