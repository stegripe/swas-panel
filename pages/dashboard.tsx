import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import ColumnManagerModal from "../components/columnManagerModal";

export default function Dashboard() {
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [rows, setRows] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [newData, setNewData] = useState<{ [key: string]: any }>({});
    const [classOptions, setClassOptions] = useState<any[]>([]);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [editData, setEditData] = useState<{ [key: string]: any }>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTableName, setNewTableName] = useState("");
    const [newTableColumns, setNewTableColumns] = useState([{ name: "", type: "VARCHAR(255)" }]);
    const [showColumnModal, setShowColumnModal] = useState(false);

    useEffect(() => {
        if (selectedTable === "users") {
            fetch("/api/data?table=classes")
                .then((res) => res.json())
                .then((data) => setClassOptions(data.rows || []));
        }
    }, [selectedTable]);

    const exportToCSV = () => {
        if (!rows.length || !columns.length) return;
        const csvContent = [
            columns.join(","),
            ...rows.map((row) => columns.map((col) => `"${row[col] ?? ""}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `table-${selectedTable}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        fetch("/api/data")
            .then((res) => res.json())
            .then((data) => {
                const tableNames = data.tables?.map((t: any) => Object.values(t)[0]) || [];
                setTables(tableNames);
            });
    }, []);

    const loadTable = (table: string) => {
        setLoading(true);
        setSelectedTable(table);

        fetch(`/api/data?table=${table}`)
            .then((res) => res.json())
            .then((data) => {
                setRows(data.rows || []);
                setColumns(data.columns || []);
                setNewData({});
                setEditIndex(null);
            })
            .finally(() => setLoading(false));
    };

    const handleCreateTable = async () => {
        if (!newTableName || newTableColumns.some((col) => !col.name || !col.type)) return;

        const res = await fetch("/api/table-create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: newTableName,
                columns: newTableColumns,
            }),
        });

        if (res.ok) {
            setNewTableName("");
            setNewTableColumns([{ name: "", type: "VARCHAR(255)" }]);
            setShowCreateForm(false);
            const updated = await fetch("/api/data").then((r) => r.json());
            setTables(updated.tables?.map((t: any) => Object.values(t)[0]) || []);
        }
    };

    const handleDeleteTable = async (table: string) => {
        if (!confirm(`Hapus tabel ${table}?`)) return;

        const res = await fetch("/api/table-delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: table }),
        });

        if (res.ok) {
            const updated = await fetch("/api/data").then((r) => r.json());
            setTables(updated.tables?.map((t: any) => Object.values(t)[0]) || []);
            if (selectedTable === table) setSelectedTable(null);
        }
    };

    return (
        <>
            <Layout
                tables={tables}
                selected={selectedTable}
                onSelect={(table) => {
                    if (selectedTable !== table) {
                        setSelectedTable(table);
                        loadTable(table);
                    } else {
                        loadTable(table); // force reload
                    }
                }}
                onDeleteTable={handleDeleteTable}
                onCreateTableClick={() => setShowCreateForm(true)}
            >
                {showCreateForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
                        <div className="bg-slate-800 p-6 rounded-lg w-full max-w-xl">
                            <h3 className="text-lg font-bold mb-4 text-white">Buat Tabel Baru</h3>
                            <input
                                value={newTableName}
                                onChange={(e) => setNewTableName(e.target.value)}
                                placeholder="Nama Tabel"
                                className="mb-2 p-2 w-full bg-slate-900 text-white border border-slate-600 rounded"
                            />
                            {newTableColumns.map((col, i) => (
                                <div key={i} className="flex gap-2 mb-2">
                                    <input
                                        placeholder="Kolom"
                                        value={col.name}
                                        onChange={(e) =>
                                            setNewTableColumns((prev) =>
                                                prev.map((c, j) =>
                                                    i === j ? { ...c, name: e.target.value } : c
                                                )
                                            )
                                        }
                                        className="p-2 flex-1 bg-slate-900 text-white border border-slate-600 rounded"
                                    />
                                    <input
                                        placeholder="Tipe (cth: VARCHAR(255), INT)"
                                        value={col.type}
                                        onChange={(e) =>
                                            setNewTableColumns((prev) =>
                                                prev.map((c, j) =>
                                                    i === j ? { ...c, type: e.target.value } : c
                                                )
                                            )
                                        }
                                        className="p-2 flex-1 bg-slate-900 text-white border border-slate-600 rounded"
                                    />
                                </div>
                            ))}
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() =>
                                        setNewTableColumns((prev) => [
                                            ...prev,
                                            { name: "", type: "VARCHAR(255)" },
                                        ])
                                    }
                                    className="text-sm text-blue-400"
                                >
                                    + Tambah Kolom
                                </button>
                                <div className="flex-1"></div>
                                <button
                                    onClick={() => setShowCreateForm(false)}
                                    className="text-sm px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleCreateTable}
                                    className="text-sm px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Buat Tabel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {selectedTable ? (
                    <>
                        <h2 className="text-xl font-bold mb-4 text-white">
                            Table: {selectedTable}
                        </h2>

                        {selectedTable === "users" && (
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-2">Tambah Pengguna Baru</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    <input
                                        placeholder="Nama"
                                        value={newData.name || ""}
                                        onChange={(e) =>
                                            setNewData({ ...newData, name: e.target.value })
                                        }
                                        className="p-2 bg-slate-800 text-white border border-slate-600 rounded"
                                    />
                                    <input
                                        placeholder="Email"
                                        type="email"
                                        value={newData.email || ""}
                                        onChange={(e) =>
                                            setNewData({ ...newData, email: e.target.value })
                                        }
                                        className="p-2 bg-slate-800 text-white border border-slate-600 rounded"
                                    />
                                    <input
                                        placeholder="Password"
                                        type="password"
                                        value={newData.password || ""}
                                        onChange={(e) =>
                                            setNewData({ ...newData, password: e.target.value })
                                        }
                                        className="p-2 bg-slate-800 text-white border border-slate-600 rounded"
                                    />
                                    <select
                                        value={newData.is_admin ?? ""}
                                        onChange={(e) =>
                                            setNewData({
                                                ...newData,
                                                is_admin: Number(e.target.value),
                                            })
                                        }
                                        className="p-2 bg-slate-800 text-white border border-slate-600 rounded"
                                    >
                                        <option value="">Admin?</option>
                                        <option value="1">Ya</option>
                                        <option value="0">Tidak</option>
                                    </select>
                                    <select
                                        value={newData.is_dosen ?? ""}
                                        onChange={(e) =>
                                            setNewData({
                                                ...newData,
                                                is_dosen: Number(e.target.value),
                                            })
                                        }
                                        className="p-2 bg-slate-800 text-white border border-slate-600 rounded"
                                    >
                                        <option value="">Dosen?</option>
                                        <option value="1">Ya</option>
                                        <option value="0">Tidak</option>
                                    </select>
                                </div>
                                <button
                                    onClick={async () => {
                                        const res = await fetch("/api/create", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                table: selectedTable,
                                                data: newData,
                                            }),
                                        });
                                        if (res.ok) loadTable(selectedTable);
                                    }}
                                    className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                                >
                                    Tambah Pengguna
                                </button>
                            </div>
                        )}

                        {columns.length > 0 && (
                            <>
                                <h4 className="text-md text-white font-semibold mb-2">
                                    Add New Row:
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                                    {columns
                                        .filter((key) => key !== "id")
                                        .map((key) => (
                                            <div key={key} className="flex flex-col text-white">
                                                <label className="text-sm mb-1 font-semibold">
                                                    {key}
                                                </label>
                                                {key === "class" ? (
                                                    <select
                                                        value={newData[key] ?? ""}
                                                        onChange={(e) =>
                                                            setNewData({
                                                                ...newData,
                                                                [key]: Number(e.target.value),
                                                            })
                                                        }
                                                        className="p-2 rounded bg-slate-800 text-white border border-slate-600"
                                                    >
                                                        <option value="">(pilih kelas)</option>
                                                        {classOptions.map((cls) => (
                                                            <option key={cls.id} value={cls.id}>
                                                                {cls.nama_kelas}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : key === "created_at" || key === "updated_at" ? (
                                                    <input
                                                        type="datetime-local"
                                                        value={newData[key] || ""}
                                                        onChange={(e) =>
                                                            setNewData({
                                                                ...newData,
                                                                [key]: e.target.value,
                                                            })
                                                        }
                                                        className="p-2 rounded bg-slate-800 text-white border border-slate-600"
                                                    />
                                                ) : ["is_dosen", "is_admin"].includes(key) ? (
                                                    <select
                                                        value={newData[key] ?? ""}
                                                        onChange={(e) =>
                                                            setNewData({
                                                                ...newData,
                                                                [key]: Number(e.target.value),
                                                            })
                                                        }
                                                        className="p-2 rounded bg-slate-800 text-white border border-slate-600"
                                                    >
                                                        <option value="">(pilih)</option>
                                                        <option value="1">true</option>
                                                        <option value="0">false</option>
                                                    </select>
                                                ) : (
                                                    <input
                                                        placeholder={
                                                            ["is_dosen", "is_admin"].includes(key)
                                                                ? "boolean"
                                                                : [
                                                                        "created_at",
                                                                        "updated_at",
                                                                    ].includes(key)
                                                                  ? "datetime"
                                                                  : key === "class"
                                                                    ? "class (id)"
                                                                    : "text"
                                                        }
                                                        value={newData[key] || ""}
                                                        onChange={(e) =>
                                                            setNewData({
                                                                ...newData,
                                                                [key]: e.target.value,
                                                            })
                                                        }
                                                        className="p-2 rounded bg-slate-800 text-white border border-slate-600"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                </div>
                                <button
                                    onClick={async () => {
                                        const res = await fetch("/api/create", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                table: selectedTable,
                                                data: newData,
                                            }),
                                        });
                                        if (res.ok) loadTable(selectedTable);
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mb-6"
                                >
                                    Add Row
                                </button>
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <button
                                            onClick={() => setShowColumnModal(true)}
                                            className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-3 py-1 rounded mr-2"
                                        >
                                            🛠️ Kelola Kolom
                                        </button>
                                        <button
                                            onClick={exportToCSV}
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded"
                                        >
                                            Export CSV
                                        </button>
                                    </div>
                                </div>
                                <table className="min-w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                                    <thead className="bg-slate-700 text-xs uppercase text-gray-300">
                                        <tr>
                                            {columns
                                                .filter((key) => key !== "id")
                                                .map((key) => (
                                                    <th
                                                        key={key}
                                                        className="border border-slate-700 px-4 py-2 text-left text-white"
                                                    >
                                                        {key}
                                                    </th>
                                                ))}
                                            <th className="border border-slate-700 px-4 py-2 text-white">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700">
                                        {rows.map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-800">
                                                {columns
                                                    .filter((key) => key !== "id")
                                                    .map((key) => (
                                                        <td
                                                            key={key}
                                                            className="border px-4 py-2 text-white"
                                                        >
                                                            {editIndex === i ? (
                                                                <input
                                                                    value={editData[key] || ""}
                                                                    onChange={(e) =>
                                                                        setEditData({
                                                                            ...editData,
                                                                            [key]: e.target.value,
                                                                        })
                                                                    }
                                                                    className="w-full p-1 rounded bg-slate-700 text-white"
                                                                />
                                                            ) : (
                                                                row[key]
                                                            )}
                                                        </td>
                                                    ))}
                                                <td className="border px-4 py-2 text-white space-x-2">
                                                    {editIndex === i ? (
                                                        <>
                                                            <button
                                                                className="text-green-400 hover:text-green-600"
                                                                onClick={async () => {
                                                                    const res = await fetch(
                                                                        "/api/update",
                                                                        {
                                                                            method: "PUT",
                                                                            headers: {
                                                                                "Content-Type":
                                                                                    "application/json",
                                                                            },
                                                                            body: JSON.stringify({
                                                                                table: selectedTable,
                                                                                primaryKey: "id",
                                                                                id: row.id,
                                                                                data: editData,
                                                                            }),
                                                                        }
                                                                    );
                                                                    if (res.ok) {
                                                                        setEditIndex(null);
                                                                        loadTable(selectedTable);
                                                                    }
                                                                }}
                                                            >
                                                                💾
                                                            </button>
                                                            <button
                                                                className="text-yellow-400 hover:text-yellow-600"
                                                                onClick={() => setEditIndex(null)}
                                                            >
                                                                ❌
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                className="text-blue-400 hover:text-blue-600"
                                                                onClick={() => {
                                                                    setEditIndex(i);
                                                                    setEditData(row);
                                                                }}
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                className="text-red-400 hover:text-red-600"
                                                                onClick={async () => {
                                                                    const id = row.id;
                                                                    if (
                                                                        !confirm("Delete this row?")
                                                                    )
                                                                        return;
                                                                    const res = await fetch(
                                                                        "/api/delete",
                                                                        {
                                                                            method: "DELETE",
                                                                            headers: {
                                                                                "Content-Type":
                                                                                    "application/json",
                                                                            },
                                                                            body: JSON.stringify({
                                                                                table: selectedTable,
                                                                                primaryKey: "id",
                                                                                id,
                                                                            }),
                                                                        }
                                                                    );
                                                                    if (res.ok)
                                                                        loadTable(selectedTable);
                                                                }}
                                                            >
                                                                🗑️
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}

                        {/* ... render form tambah row dan table seperti biasa */}
                    </>
                ) : (
                    <div className="text-slate-400 text-center mt-12 text-lg">
                        Silakan pilih tabel di sebelah kiri untuk mulai mengelola data.
                    </div>
                )}

                {showColumnModal && (
                    <ColumnManagerModal
                        table={selectedTable}
                        columns={columns.map((col) => ({ name: col, type: "TEXT" }))}
                        onClose={() => setShowColumnModal(false)}
                        onRefresh={() => loadTable(selectedTable!)}
                    />
                )}
                {loading && (
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                        <div className="text-white text-lg">Loading table...</div>
                    </div>
                )}
            </Layout>
        </>
    );
}
