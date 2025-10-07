export interface SQLResponse {
    Field: string;
    Type: string;
    Null: string;
    Key: string;
    // biome-ignore lint/suspicious/noExplicitAny: needed
    Default: any;
    Extra: string;
}

export interface ColumnData {
    name: string;
    type: string;
    primary?: boolean;
    autoIncrement?: boolean;
    unique?: boolean;
    nullable?: boolean;
}

export interface ColumnAddRequest {
    table: string;
    columnName: string;
    columnType: string;
    primary?: boolean;
    autoIncrement?: boolean;
    unique?: boolean;
    nullable?: boolean;
}

export interface CreateUserRequest {
    email: string;
    password: string;
    isAdmin: 0 | 1;
    isDosen: 0 | 1;
    fingerprint?: string;
    nim?: string;
    nama?: string;
    kelas?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface UpdateUserRequest {
    userId: number;
    email?: string;
    password?: string;
    isAdmin?: 0 | 1;
    isDosen?: 0 | 1;
    fingerprint?: string;
    nim?: string;
    nama?: string;
    kelas?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface GetUserResponse {
    id: number;
    email: string;
    isAdmin: 0 | 1;
    isDosen: 0 | 1;
    fingerprint?: string;
    nim?: string;
    nama?: string;
    kelas?: string;
    createdAt: string;
    updatedAt: string;
}

export interface MahasiswaT {
    id: number;
    nim: string;
    nama: string;
    kelas: string;
    fingerprints: string;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
}

export interface UserT {
    id: number;
    email: string;
    password: string;
    isAdmin: 0 | 1;
    isDosen: 0 | 1;
    fingerprint?: string;
    nim?: string;
    nama?: string;
    kelas?: string;
    fingerprints?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateAttendanceRequest {
    fingerprint: string;
}

export interface AttendanceT {
    id: number;
    nim: string;
    type: 0 | 1;
    createdAt: string;
}

export interface MonitoringT {
    nama: string;
    nim: string;
    kelas: string;
    last_attendance: string;
    last_type: 0 | 1;
    prev_attendance: string;
}
