import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MenuService } from '../../../core/services/menu.service';

@Component({
    selector: 'app-dashboard-layout',
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: './dashboard-layout.component.html',
    styleUrl: './dashboard-layout.component.css'
})
export class DashboardLayoutComponent {
    sidebarOpen = false;

    constructor(
        public authService: AuthService,
        public menuService: MenuService
    ) { }

    get menuItems() {
        return this.menuService.getMenuItems();
    }

    get currentUser() {
        return this.authService.currentUser();
    }

    get userInitials(): string {
        const user = this.currentUser;
        if (!user) return 'U';

        const names = user.fullName?.split(' ') || [user.username];
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return names[0].substring(0, 2).toUpperCase();
    }

    get primaryRole(): string {
        return this.authService.getPrimaryRole() || 'User';
    }

    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
    }

    logout() {
        this.authService.logout();
    }
}
