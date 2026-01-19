import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    private authService = inject(AuthService);
    private router = inject(Router);

    canActivate(): boolean | UrlTree {
        if (this.authService.isAuthenticated()) {
            return true;
        }

        // Redirect to login if not authenticated
        return this.router.createUrlTree(['/login']);
    }
}

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {
    private authService = inject(AuthService);
    private router = inject(Router);

    canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
        const requiredRoles = route.data['roles'] as string[];

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        if (this.authService.hasRole(requiredRoles)) {
            return true;
        }

        // Redirect based on user's role to their appropriate first page
        const userRoles = this.authService.userRoles();

        if (userRoles.includes('MARKETING')) {
            return this.router.createUrlTree(['/dashboard/review']);
        } else if (userRoles.includes('BRANCH_MANAGER')) {
            return this.router.createUrlTree(['/dashboard/approval']);
        } else if (userRoles.includes('BACK_OFFICE')) {
            return this.router.createUrlTree(['/dashboard/disbursement']);
        }

        // Fallback to history if no specific role page
        return this.router.createUrlTree(['/dashboard/history']);
    }
}

@Injectable({
    providedIn: 'root'
})
export class GuestGuard implements CanActivate {
    private authService = inject(AuthService);
    private router = inject(Router);

    canActivate(): boolean | UrlTree {
        if (!this.authService.isAuthenticated()) {
            return true;
        }

        // Redirect to dashboard if already logged in
        return this.router.createUrlTree(['/dashboard']);
    }
}
