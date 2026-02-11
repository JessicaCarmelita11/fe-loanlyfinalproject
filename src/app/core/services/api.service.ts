import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Plafond, UserPlafond, Disbursement, User, Role } from '../models';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private readonly baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    // ========== PUBLIC ENDPOINTS ==========

    getPublicPlafonds(): Observable<ApiResponse<Plafond[]>> {
        return this.http.get<ApiResponse<Plafond[]>>(`${this.baseUrl}/public/plafonds`);
    }

    // ========== ADMIN ENDPOINTS ==========

    // Users
    getUsers(): Observable<ApiResponse<User[]>> {
        return this.http.get<ApiResponse<User[]>>(`${this.baseUrl}/admin/users`);
    }

    createUser(user: Partial<User> & { password: string; roleIds: number[] }): Observable<ApiResponse<User>> {
        return this.http.post<ApiResponse<User>>(`${this.baseUrl}/admin/users`, user);
    }

    updateUser(id: number, user: Partial<User>): Observable<ApiResponse<User>> {
        return this.http.put<ApiResponse<User>>(`${this.baseUrl}/admin/users/${id}`, user);
    }

    deleteUser(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/admin/users/${id}`);
    }

    // Roles
    getRoles(): Observable<ApiResponse<Role[]>> {
        return this.http.get<ApiResponse<Role[]>>(`${this.baseUrl}/admin/roles`);
    }

    // Plafonds (Admin)
    getPlafonds(): Observable<ApiResponse<Plafond[]>> {
        return this.http.get<ApiResponse<Plafond[]>>(`${this.baseUrl}/admin/plafonds`);
    }

    createPlafond(plafond: Partial<Plafond>): Observable<ApiResponse<Plafond>> {
        return this.http.post<ApiResponse<Plafond>>(`${this.baseUrl}/admin/plafonds`, plafond);
    }

    updatePlafond(id: number, plafond: Partial<Plafond>): Observable<ApiResponse<Plafond>> {
        return this.http.put<ApiResponse<Plafond>>(`${this.baseUrl}/admin/plafonds/${id}`, plafond);
    }

    deletePlafond(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/admin/plafonds/${id}`);
    }

    getPlafondById(id: number): Observable<ApiResponse<Plafond>> {
        return this.http.get<ApiResponse<Plafond>>(`${this.baseUrl}/admin/plafonds/${id}`);
    }

    // ========== MARKETING ENDPOINTS ==========

    getPendingReviewApplications(): Observable<ApiResponse<UserPlafond[]>> {
        return this.http.get<ApiResponse<UserPlafond[]>>(`${this.baseUrl}/marketing/plafond-applications/pending`);
    }

    reviewApplication(applicationId: number, approved: boolean, note?: string): Observable<ApiResponse<UserPlafond>> {
        return this.http.post<ApiResponse<UserPlafond>>(`${this.baseUrl}/marketing/plafond-applications/review`, {
            applicationId,
            approved,
            note
        });
    }

    // ========== BRANCH MANAGER ENDPOINTS ==========

    getWaitingApprovalApplications(): Observable<ApiResponse<UserPlafond[]>> {
        return this.http.get<ApiResponse<UserPlafond[]>>(`${this.baseUrl}/branch-manager/plafond-applications/pending`);
    }

    approveApplication(applicationId: number, approved: boolean, approvedLimit?: number, note?: string): Observable<ApiResponse<UserPlafond>> {
        return this.http.post<ApiResponse<UserPlafond>>(`${this.baseUrl}/branch-manager/plafond-applications/approve`, {
            applicationId,
            approved,
            approvedLimit,
            note
        });
    }

    // ========== BACK OFFICE ENDPOINTS ==========

    getPendingDisbursements(): Observable<ApiResponse<Disbursement[]>> {
        return this.http.get<ApiResponse<Disbursement[]>>(`${this.baseUrl}/back-office/disbursements/pending`);
    }

    processDisbursement(disbursementId: number, note?: string): Observable<ApiResponse<Disbursement>> {
        let params = new HttpParams();
        if (note) {
            params = params.set('note', note);
        }
        return this.http.post<ApiResponse<Disbursement>>(
            `${this.baseUrl}/back-office/disbursements/${disbursementId}/process`,
            null,
            { params }
        );
    }

    cancelDisbursement(disbursementId: number, reason: string): Observable<ApiResponse<Disbursement>> {
        const params = new HttpParams().set('reason', reason);
        return this.http.post<ApiResponse<Disbursement>>(
            `${this.baseUrl}/back-office/disbursements/${disbursementId}/cancel`,
            null,
            { params }
        );
    }

    // ========== COMMON/HISTORY ENDPOINTS ==========

    // Get plafond application history (accessible by all authenticated users)
    getPlafondHistory(): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/plafond-histories`);
    }

    // Get all applications (for history view)
    getAllApplications(): Observable<ApiResponse<UserPlafond[]>> {
        return this.http.get<ApiResponse<UserPlafond[]>>(`${this.baseUrl}/admin/plafond-applications`);
    }

    // Get approved customers with limits
    getApprovedCustomers(): Observable<ApiResponse<UserPlafond[]>> {
        return this.http.get<ApiResponse<UserPlafond[]>>(`${this.baseUrl}/admin/customers/approved`);
    }

    // Get all disbursements (accessible by all authenticated users)
    getAllDisbursements(): Observable<ApiResponse<Disbursement[]>> {
        return this.http.get<ApiResponse<Disbursement[]>>(`${this.baseUrl}/disbursements`);
    }
}
