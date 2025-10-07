import { useState } from "react";

interface ColumnManagerProps {
    table: string;
    columns: ColumnData[];
    onClose: () => void;
    onRefresh: () => void;
}

export default function ColumnManagerModal({
    table,
    columns,
    onClose,
    onRefresh,
}: ColumnManagerProps) {
    const [newColName, setNewColName] = useState("");
    const [newColType, setNewColType] = useState("varchar(255)");
    const [isPrimary, setIsPrimary] = useState(false);
    const [isAutoIncrement, setIsAutoIncrement] = useState(false);
    const [isUnique, setIsUnique] = useState(false);
    const [isNullable, setIsNullable] = useState(false);

    const addColumn = async () => {
        if (!newColName || !newColType) return;
        await fetch("/api/column-add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                table,
                columnName: newColName,
                columnType: newColType,
                primary: isPrimary,
                autoIncrement: isAutoIncrement,
                unique: isUnique,
                nullable: isNullable,
            } as ColumnAddRequest),
        });
        setNewColName("");
        setNewColType("varchar(255)");
        setIsPrimary(false);
        setIsAutoIncrement(false);
        setIsUnique(false);
        setIsNullable(false);
        onRefresh();
    };

    const updateColumn = async (oldName: string, newName: string, newType: string) => {
        if (!newName || !newType) return;
        await fetch("/api/column-update", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ table, oldName, newName, newType }),
        });
        onRefresh();
    };

    const deleteColumn = async (name: string) => {
        if (!confirm(`Hapus kolom ${name}?`)) return;
        await fetch("/api/column-delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ table, columnName: name }),
        });
        onRefresh();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
            <div className="bg-slate-800 p-6 rounded-lg w-full max-w-2xl">
                <h3 className="text-lg font-bold mb-4 text-white">Kelola Kolom: {table}</h3>

                <div className="text-sm text-gray-400 mb-10 flex justify-between">
                    <p>🔑 Primary Key</p>
                    <p>🔄 Auto Increment</p>
                    <p>🔒 Unique</p>
                    <p>❓ Nullable</p>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {columns.map((col, idx) => (
                        <div key={idx} className="flex gap-2">
                            <div className="text-white flex items-center">
                                {col.primary && <span className="text-green-400">🔑</span>}
                                {col.autoIncrement && <span className="text-yellow-400">🔄</span>}
                                {col.unique && <span className="text-blue-400">🔒</span>}
                                {col.nullable && <span className="text-gray-400">❓</span>}
                            </div>
                            <input
                                defaultValue={col.name}
                                onBlur={(e) =>
                                    e.target.value !== col.name &&
                                    updateColumn(col.name, e.target.value, col.type)
                                }
                                className="bg-slate-900 border border-slate-600 text-white rounded-sm px-2 py-1 flex-1"
                            />
                            <input
                                defaultValue={col.type}
                                onBlur={(e) =>
                                    e.target.value !== col.type &&
                                    updateColumn(col.name, col.name, e.target.value)
                                }
                                className="bg-slate-900 border border-slate-600 text-white rounded-sm px-2 py-1 flex-1"
                            />
                            <button
                                onClick={() => deleteColumn(col.name)}
                                className="text-red-400 hover:text-red-600"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>

                <hr className="my-4 border-slate-600" />

                <div className="flex gap-2 mb-2">
                    <input
                        placeholder="Kolom Baru"
                        value={newColName}
                        onChange={(e) => setNewColName(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-600 text-white rounded-sm px-2 py-1"
                    />
                    <input
                        placeholder="Tipe"
                        value={newColType}
                        onChange={(e) => setNewColType(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-600 text-white rounded-sm px-2 py-1"
                    />
                </div>

                <div className="flex gap-4 mb-4">
                    <label className="text-white flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={isPrimary}
                            onChange={(e) => setIsPrimary(e.target.checked)}
                        />
                        Primary Key
                    </label>
                    <label className="text-white flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={isAutoIncrement}
                            onChange={(e) => setIsAutoIncrement(e.target.checked)}
                        />
                        Auto Increment
                    </label>
                    <label className="text-white flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={isUnique}
                            onChange={(e) => setIsUnique(e.target.checked)}
                        />
                        Unique
                    </label>
                    <label className="text-white flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={isNullable}
                            onChange={(e) => setIsNullable(e.target.checked)}
                        />
                        Nullable
                    </label>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={addColumn}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-sm"
                    >
                        + Tambah
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-sm ml-2"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
