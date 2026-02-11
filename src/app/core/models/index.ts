// User model (for admin API responses with Role objects)
export interface User {
    id: number;
    username: string;
    email: string;
    fullName?: string;
    isActive: boolean;
    roles: Role[];
    createdAt?: string;
    updatedAt?: string;
}

// AuthUser model (for login response with roles as strings)
export interface AuthUser {
    id: number;
    username: string;
    email: string;
    fullName?: string;
    roles: string[];  // Backend returns roles as string array
}

// Role model
export interface Role {
    id: number;
    name: string;
    description?: string;
}

// Auth models
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface LoginRequest {
    usernameOrEmail: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        accessToken: string;
        tokenType: string;
        expiresIn: number;
        user: AuthUser;  // Use AuthUser instead of User for login
    };
}

// API Response wrapper
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp?: string;
}

// Plafond model
export interface Plafond {
    id: number;
    name: string;
    description?: string;
    maxAmount: number;
    isActive: boolean;
}

// User Plafond Application
export interface UserPlafond {
    id: number;
    userId: number;
    username: string;  // Customer username
    status: PlafondStatus;
    plafond: {
        id: number;
        name: string;
        maxAmount: number;
    };
    approvedLimit?: number;
    usedAmount?: number;
    availableLimit?: number;
    applicantDetail: ApplicantInfo;  // Backend uses 'applicantDetail'
    registeredAt: string;  // Backend uses 'registeredAt'
    reviewedByUsername?: string;
    reviewedAt?: string;
    reviewNote?: string;  // Note from marketing review
    approvedByUsername?: string;
    approvedAt?: string;
    rejectionNote?: string;
    documents?: any;
    latitude?: number;  // Location: Latitude
    longitude?: number; // Location: Longitude
}

export interface ApplicantInfo {
    fullName?: string;
    nik: string;
    birthPlace: string;
    birthDate: string;
    maritalStatus?: string;
    occupation: string;
    monthlyIncome: number;
    phone: string;
    npwp?: string;
    applicationLatitude?: number;
    applicationLongitude?: number;
    bankName?: string;
    accountNumber?: string;
}

export type PlafondStatus =
    | 'PENDING_REVIEW'
    | 'WAITING_APPROVAL'
    | 'APPROVED'
    | 'REJECTED';

// Disbursement model
export interface Disbursement {
    id: number;
    userPlafondId: number;
    customerName?: string;
    customerUsername?: string;
    plafondName: string;
    amount: number;
    interestRate: number;
    tenorMonth: number;
    interestAmount: number;
    totalAmount: number;
    status: DisbursementStatus;
    requestedAt: string;
    disbursedAt?: string;
    disbursedByUsername?: string;
    note?: string;
    remainingLimit: number;
    requestLatitude?: number;
    requestLongitude?: number;
    bankName?: string;
    accountNumber?: string;
}

export type DisbursementStatus = 'PENDING' | 'DISBURSED' | 'CANCELLED';

// Menu item for sidebar
export interface MenuItem {
    label: string;
    icon: string;
    route: string;
    roles: string[];  // Which roles can see this menu
}

// Tenor Rate (per Plafond Tier)
export interface TenorRate {
    id: number;
    plafondId: number;
    plafondName: string;
    tenorMonth: number;
    interestRate: number;
    description?: string;
    isActive: boolean;
}

// Create TenorRate Request
export interface TenorRateRequest {
    plafondId: number;
    tenorMonth: number;
    interestRate: number;
    description?: string;
    isActive?: boolean;
}
