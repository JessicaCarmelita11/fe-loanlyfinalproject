import { Routes } from '@angular/router';
import { AuthGuard, RoleGuard, GuestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    // Public routes
    {
        path: '',
        loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
    },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
        canActivate: [GuestGuard]
    },
    {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        canActivate: [GuestGuard]
    },
    {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
        canActivate: [GuestGuard]
    },

    // Dashboard routes (protected)
    {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
        canActivate: [AuthGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./features/dashboard/home/dashboard-home.component').then(m => m.DashboardHomeComponent),
                canActivate: [RoleGuard],
                data: { roles: ['SUPER_ADMIN'] }
            },
            {
                path: 'users',
                loadComponent: () => import('./features/dashboard/user-management/user-list.component').then(m => m.UserListComponent),
                canActivate: [RoleGuard],
                data: { roles: ['SUPER_ADMIN'] }
            },
            {
                path: 'roles',
                loadComponent: () => import('./features/dashboard/role-management/role-list.component').then(m => m.RoleListComponent),
                canActivate: [RoleGuard],
                data: { roles: ['SUPER_ADMIN'] }
            },
            {
                path: 'plafonds',
                loadComponent: () => import('./features/dashboard/plafond-management/plafond-list.component').then(m => m.PlafondListComponent),
                canActivate: [RoleGuard],
                data: { roles: ['SUPER_ADMIN'] }
            },
            {
                path: 'review',
                loadComponent: () => import('./features/dashboard/review-plafond/review-list.component').then(m => m.ReviewListComponent),
                canActivate: [RoleGuard],
                data: { roles: ['SUPER_ADMIN', 'MARKETING'] }
            },
            {
                path: 'approval',
                loadComponent: () => import('./features/dashboard/approval-plafond/approval-list.component').then(m => m.ApprovalListComponent),
                canActivate: [RoleGuard],
                data: { roles: ['SUPER_ADMIN', 'BRANCH_MANAGER'] }
            },
            {
                path: 'disbursement',
                loadComponent: () => import('./features/dashboard/disbursement/disbursement-list.component').then(m => m.DisbursementListComponent),
                canActivate: [RoleGuard],
                data: { roles: ['SUPER_ADMIN', 'BACK_OFFICE'] }
            },
            {
                path: 'customers',
                loadComponent: () => import('./features/dashboard/customer-list/customer-list.component').then(m => m.CustomerListComponent),
                canActivate: [RoleGuard],
                data: { roles: ['SUPER_ADMIN'] }
            },
            {
                path: 'history',
                loadComponent: () => import('./features/dashboard/history/history-list.component').then(m => m.HistoryListComponent),
                canActivate: [RoleGuard],
                data: { roles: ['SUPER_ADMIN', 'MARKETING', 'BRANCH_MANAGER', 'BACK_OFFICE'] }
            },
            {
                path: 'profile',
                loadComponent: () => import('./features/dashboard/profile/profile.component').then(m => m.ProfileComponent)
            }
        ]
    },

    // Fallback
    { path: '**', redirectTo: '' }
];
