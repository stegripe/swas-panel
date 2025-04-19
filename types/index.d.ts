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
