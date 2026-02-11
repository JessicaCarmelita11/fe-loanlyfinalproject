import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenorRate, TenorRateRequest, ApiResponse } from '../models';

@Injectable({
    providedIn: 'root'
})
export class TenorRateService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/admin/tenor-rates`;

    /**
     * Get all tenor rates
     */
    getAllRates(): Observable<TenorRate[]> {
        return this.http.get<TenorRate[]>(this.baseUrl);
    }

    /**
     * Get rates grouped by plafond name
     */
    getRatesGroupedByPlafond(): Observable<Record<string, TenorRate[]>> {
        return this.http.get<Record<string, TenorRate[]>>(`${this.baseUrl}/grouped`);
    }

    /**
     * Get rates for a specific plafond
     */
    getRatesByPlafond(plafondId: number): Observable<TenorRate[]> {
        return this.http.get<TenorRate[]>(`${this.baseUrl}/plafond/${plafondId}`);
    }

    /**
     * Create a new tenor rate
     */
    createRate(request: TenorRateRequest): Observable<ApiResponse<TenorRate>> {
        return this.http.post<ApiResponse<TenorRate>>(this.baseUrl, request);
    }

    /**
     * Update an existing tenor rate
     */
    updateRate(rateId: number, request: TenorRateRequest): Observable<ApiResponse<TenorRate>> {
        return this.http.put<ApiResponse<TenorRate>>(`${this.baseUrl}/${rateId}`, request);
    }

    /**
     * Delete a tenor rate
     */
    deleteRate(rateId: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${rateId}`);
    }
}
