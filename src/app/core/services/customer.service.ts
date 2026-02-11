import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChangePasswordRequest } from '../models';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {

    constructor(private http: HttpClient) { }

    changePassword(data: ChangePasswordRequest): Observable<any> {
        return this.http.post(`${environment.apiUrl}/customer/change-password`, data);
    }
}
