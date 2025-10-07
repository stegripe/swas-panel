interface SQLResponse {
    Field: string;
    Type: string;
    Null: string;
    Key: string;
    Default: any;
    Extra: string;
}

interface ColumnData {
    name: string;
    type: string;
    primary?: boolean;
    autoIncrement?: boolean;
    unique?: boolean;
    nullable?: boolean;
}

interface ColumnAddRequest {
    table: string;
    columnName: string;
    columnType: string;
    primary?: boolean;
    autoIncrement?: boolean;
    unique?: boolean;
    nullable?: boolean;
}

interface CreateUserRequest {
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

interface UpdateUserRequest {
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

interface GetUserResponse {
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

interface MahasiswaT {
    id: number;
    nim: string;
    nama: string;
    kelas: string;
    fingerprints: string;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
}

interface UserT {
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

interface CreateAttendanceRequest {
    fingerprint: string;
}

interface AttendanceT {
    id: number;
    nim: string;
    type: 0 | 1;
    createdAt: string;
}
