import { Injectable, signal, computed } from '@angular/core';
import { MenuItem } from '../models';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class MenuService {

    constructor(private authService: AuthService) { }

    // All available menu items
    private readonly allMenuItems: MenuItem[] = [
        {
            label: 'Dashboard',
            icon: 'bi-speedometer2',
            route: '/dashboard',
            roles: ['SUPER_ADMIN']
        },
        {
            label: 'User Management',
            icon: 'bi-people',
            route: '/dashboard/users',
            roles: ['SUPER_ADMIN']
        },
        {
            label: 'Plafond Management',
            icon: 'bi-credit-card-2-front',
            route: '/dashboard/plafonds',
            roles: ['SUPER_ADMIN']
        },
        {
            label: 'Review Plafond',
            icon: 'bi-clipboard-check',
            route: '/dashboard/review',
            roles: ['SUPER_ADMIN', 'MARKETING']
        },
        {
            label: 'Approval Plafond',
            icon: 'bi-check2-square',
            route: '/dashboard/approval',
            roles: ['SUPER_ADMIN', 'BRANCH_MANAGER']
        },
        {
            label: 'Pencairan',
            icon: 'bi-cash-stack',
            route: '/dashboard/disbursement',
            roles: ['SUPER_ADMIN', 'BACK_OFFICE']
        },
        {
            label: 'Customer List',
            icon: 'bi-person-badge',
            route: '/dashboard/customers',
            roles: ['SUPER_ADMIN']
        },
        {
            label: 'Riwayat',
            icon: 'bi-clock-history',
            route: '/dashboard/history',
            roles: ['SUPER_ADMIN', 'MARKETING', 'BRANCH_MANAGER', 'BACK_OFFICE']
        },
        {
            label: 'Profile',
            icon: 'bi-person-circle',
            route: '/dashboard/profile',
            roles: ['SUPER_ADMIN', 'MARKETING', 'BRANCH_MANAGER', 'BACK_OFFICE']
        }
    ];

    /**
     * Get menu items filtered by current user's roles
     */
    getMenuItems(): MenuItem[] {
        const userRoles = this.authService.userRoles();

        return this.allMenuItems.filter(item =>
            item.roles.some(role => userRoles.includes(role))
        );
    }

    /**
     * Check if user can access a specific route
     */
    canAccessRoute(route: string): boolean {
        const menuItem = this.allMenuItems.find(item => item.route === route);
        if (!menuItem) return true; // Allow access to routes not in menu

        return this.authService.hasRole(menuItem.roles);
    }
}
