/** biome-ignore-all lint/suspicious/noExplicitAny: needed */
import { useEffect, useState } from "react";
import ColumnManagerModal from "../components/columnManagerModal";
import FloatingLoader from "../components/FloatingLoader";
import Layout from "../components/Layout";
import { type ColumnData } from "../types";

export default function Dashboard() {
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [rows, setRows] = useState<any[]>([]);
    const [columns, setColumns] = useState<ColumnData[]>([]);
    const [newData, setNewData] = useState<{ [key: string]: any }>({});
    const [classOptions, setClassOptions] = useState<any[]>([]);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [editData, setEditData] = useState<{ [key: string]: any }>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTableName, setNewTableName] = useState("");
    const [newTableColumns, setNewTableColumns] = useState<ColumnData[]>([
        {
            name: "",
            type: "varchar(255)",
            primary: false,
            autoIncrement: false,
            unique: false,
            nullable: false,
        },
    ]);
    const [showColumnModal, setShowColumnModal] = useState(false);

    useEffect(() => {
        if (selectedTable === "users") {
            fetch("/api/data?table=classes")
                .then((res) => res.json())
                .then((data) => setClassOptions(data.rows || []))
                .catch((error) => console.error("Failed to fetch class options:", error));
        }
    }, [selectedTable]);

    const exportToExcel = async () => {
        // biome-ignore lint/style/useBlockStatements: short condition
        if (!selectedTable) return;
        const res = await fetch(`/api/export-excel?table=${selectedTable}`);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `table-${selectedTable}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        fetch("/api/data")
            .then((res) => res.json())
            .then((data) => {
                const tableNames = data.tables?.map((t) => Object.values(t)[0]) || [];
                setTables(tableNames);
            })
            .catch((error) => console.error("Failed to fetch tables:", error));
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
            .catch((error) => console.error("Failed to fetch table:", error))
            .finally(() => setLoading(false));
    };

    const handleCreateTable = async () => {
        // biome-ignore lint/style/useBlockStatements: short condition
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
            setNewTableColumns([{ name: "", type: "varchar(255)" }]);
            setShowCreateForm(false);
            const updated = await fetch("/api/data").then((r) => r.json());
            setTables(updated.tables?.map((t) => Object.values(t)[0]) || []);
        }
    };

    const handleDeleteTable = async (table: string) => {
        // biome-ignore lint/style/useBlockStatements: short condition
        if (!confirm(`Hapus tabel ${table}?`)) return;

        const res = await fetch("/api/table-delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: table }),
        });

        if (res.ok) {
            const updated = await fetch("/api/data").then((r) => r.json());
            setTables(updated.tables?.map((t) => Object.values(t)[0]) || []);
            // biome-ignore lint/style/useBlockStatements: short condition
            if (selectedTable === table) setSelectedTable(null);
        }
    };

    const handleDeleteRow = async (row: any) => {
        // biome-ignore lint/style/useBlockStatements: short condition
        if (!confirm("Are you sure you want to delete this row?")) return;

        // Check if table and row data are valid
        if (!selectedTable || !row) {
            alert("Table or row data is missing");
            return;
        }

        // Prepare the request payload
        const payload: any = {
            table: selectedTable,
        };

        if (row.id) {
            // If the row has a primary key (e.g., `id`), delete by primary key
            payload.primaryKey = "id";
            payload.id = row.id;
        } else {
            // Otherwise, delete by full criteria (all column values)
            payload.criteria = row;
        }

        try {
            const res = await fetch("/api/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                loadTable(selectedTable); // Reload table after successful deletion
            } else {
                const error = await res.json();
                alert(`Failed to delete the row: ${error.message}`);
            }
        } catch (error) {
            console.error("Error deleting row:", error);
            alert("An error occurred while deleting the row.");
        }
    };

    const getInputPlaceholder = (key: ColumnData) => {
        if (["isDosen", "isAdmin"].includes(key.name)) {
            return "boolean";
        }
        if (["created_at", "updated_at"].includes(key.name)) {
            return "datetime";
        }
        if (key.name === "class") {
            return "class (id)";
        }
        return key.type;
    };

    const renderInputField = (key: ColumnData) => {
        if (key.name === "class") {
            return (
                <select
                    value={newData[key.name] ?? ""}
                    onChange={(e) =>
                        setNewData({
                            ...newData,
                            [key.name]: Number(e.target.value),
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
            );
        }
        if (key.type === "datetime") {
            return (
                <input
                    type="datetime-local"
                    value={newData[key.name] || ""}
                    onChange={(e) =>
                        setNewData({
                            ...newData,
                            [key.name]: e.target.value,
                        })
                    }
                    className="p-2 rounded bg-slate-800 text-white border border-slate-600"
                />
            );
        }
        if (["isDosen", "isAdmin"].includes(key.name)) {
            return (
                <select
                    value={newData[key.name] ?? ""}
                    onChange={(e) =>
                        setNewData({
                            ...newData,
                            [key.name]: Number(e.target.value),
                        })
                    }
                    className="p-2 rounded bg-slate-800 text-white border border-slate-600"
                >
                    <option value="">(pilih)</option>
                    <option value="1">true</option>
                    <option value="0">false</option>
                </select>
            );
        }
        return (
            <input
                placeholder={getInputPlaceholder(key)}
                value={newData[key.name] || ""}
                onChange={(e) =>
                    setNewData({
                        ...newData,
                        [key.name]: e.target.value,
                    })
                }
                className="p-2 rounded bg-slate-800 text-white border border-slate-600"
            />
        );
    };

    const handleUpdateRow = async (row: any) => {
        if (!selectedTable || !editData) {
            alert("Table or row data is missing");
            return;
        }

        const payload: any = {
            table: selectedTable,
            data: editData,
        };

        if (row.id) {
            // If the row has a primary key (e.g., `id`), use it for the update
            payload.primaryKey = "id";
            payload.id = row.id;
        } else {
            // Otherwise, use all column values as criteria for the update
            payload.criteria = row;
        }

        const res = await fetch("/api/update", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            setEditIndex(null);
            loadTable(selectedTable); // Reload the table data
        } else {
            const error = await res.json();
            alert(`Failed to update the row: ${error.message}`);
        }
    };

    return (
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
                            className="mb-2 p-2 w-full bg-slate-900 text-white border border-slate-600 rounded-sm"
                        />
                        {newTableColumns.map((col, i) => (
                            <div key={i} className="flex flex-col gap-2 mb-2">
                                <div className="flex gap-2 mb-2">
                                    <input
                                        placeholder="Kolom"
                                        value={col.name}
                                        onChange={(e) =>
                                            setNewTableColumns((prev) =>
                                                prev.map((c, j) =>
                                                    i === j ? { ...c, name: e.target.value } : c,
                                                ),
                                            )
                                        }
                                        className="p-2 flex-1 bg-slate-900 text-white border border-slate-600 rounded-sm"
                                    />
                                    <input
                                        placeholder="Tipe (cth: varchar(255), int, datetime)"
                                        value={col.type}
                                        onChange={(e) =>
                                            setNewTableColumns((prev) =>
                                                prev.map((c, j) =>
                                                    i === j ? { ...c, type: e.target.value } : c,
                                                ),
                                            )
                                        }
                                        className="p-2 flex-1 bg-slate-900 text-white border border-slate-600 rounded-sm"
                                    />
                                </div>
                                <div className="flex gap-4 mb-4">
                                    <label className="text-white flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={col.autoIncrement}
                                            onChange={(e) =>
                                                setNewTableColumns((prev) =>
                                                    prev.map((c, j) =>
                                                        i === j
                                                            ? {
                                                                  ...c,
                                                                  autoIncrement: e.target.checked,
                                                              }
                                                            : c,
                                                    ),
                                                )
                                            }
                                        />
                                        Primary Key
                                    </label>
                                    <label className="text-white flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={col.primary}
                                            onChange={(e) =>
                                                setNewTableColumns((prev) =>
                                                    prev.map((c, j) =>
                                                        i === j
                                                            ? {
                                                                  ...c,
                                                                  primary: e.target.checked,
                                                              }
                                                            : c,
                                                    ),
                                                )
                                            }
                                        />
                                        Auto Increment
                                    </label>
                                    <label className="text-white flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={col.unique}
                                            onChange={(e) =>
                                                setNewTableColumns((prev) =>
                                                    prev.map((c, j) =>
                                                        i === j
                                                            ? {
                                                                  ...c,
                                                                  unique: e.target.checked,
                                                              }
                                                            : c,
                                                    ),
                                                )
                                            }
                                        />
                                        Unique
                                    </label>
                                    <label className="text-white flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={col.nullable}
                                            onChange={(e) =>
                                                setNewTableColumns((prev) =>
                                                    prev.map((c, j) =>
                                                        i === j
                                                            ? {
                                                                  ...c,
                                                                  nullable: e.target.checked,
                                                              }
                                                            : c,
                                                    ),
                                                )
                                            }
                                        />
                                        Nullable
                                    </label>
                                </div>
                            </div>
                        ))}
                        <div className="flex gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setNewTableColumns((prev) => [
                                        ...prev,
                                        {
                                            name: "",
                                            type: "varchar(255)",
                                            unique: false,
                                            nullable: false,
                                            autoIncrement: false,
                                            primary: false,
                                        },
                                    ])
                                }
                                className="text-sm text-blue-400"
                            >
                                + Tambah Kolom
                            </button>
                            <div className="flex-1" />
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setNewTableName("");
                                    setNewTableColumns([
                                        {
                                            name: "",
                                            type: "varchar(255)",
                                            unique: false,
                                            nullable: false,
                                            autoIncrement: false,
                                            primary: false,
                                        },
                                    ]);
                                }}
                                className="text-sm px-4 py-2 rounded-sm bg-gray-600 hover:bg-gray-700 text-white"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateTable}
                                className="text-sm px-4 py-2 rounded-sm bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Buat Tabel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {selectedTable ? (
                <>
                    <h2 className="text-xl font-bold mb-4 text-white">Table: {selectedTable}</h2>

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
                                    className="p-2 bg-slate-800 text-white border border-slate-600 rounded-sm"
                                />
                                <input
                                    placeholder="Email"
                                    type="email"
                                    value={newData.email || ""}
                                    onChange={(e) =>
                                        setNewData({ ...newData, email: e.target.value })
                                    }
                                    className="p-2 bg-slate-800 text-white border border-slate-600 rounded-sm"
                                />
                                <input
                                    placeholder="Password"
                                    type="password"
                                    value={newData.password || ""}
                                    onChange={(e) =>
                                        setNewData({ ...newData, password: e.target.value })
                                    }
                                    className="p-2 bg-slate-800 text-white border border-slate-600 rounded-sm"
                                />
                                <select
                                    value={newData.is_admin ?? ""}
                                    onChange={(e) =>
                                        setNewData({
                                            ...newData,
                                            is_admin: Number(e.target.value),
                                        })
                                    }
                                    className="p-2 bg-slate-800 text-white border border-slate-600 rounded-sm"
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
                                    className="p-2 bg-slate-800 text-white border border-slate-600 rounded-sm"
                                >
                                    <option value="">Dosen?</option>
                                    <option value="1">Ya</option>
                                    <option value="0">Tidak</option>
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={async () => {
                                    const res = await fetch("/api/create", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            table: selectedTable,
                                            data: newData,
                                        }),
                                    });
                                    // biome-ignore lint/style/useBlockStatements: short condition
                                    if (res.ok) loadTable(selectedTable);
                                }}
                                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-sm"
                            >
                                Tambah Pengguna
                            </button>
                        </div>
                    )}

                    {columns.length > 0 && (
                        <>
                            {selectedTable !== "users" && (
                                <>
                                    <h4 className="text-md text-white font-semibold mb-2">
                                        Add New Row:
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                                        {columns
                                            .filter((key) => !key.autoIncrement)
                                            .map((key) => (
                                                <div
                                                    key={key.name}
                                                    className="flex flex-col text-white"
                                                >
                                                    <label
                                                        htmlFor={key.name}
                                                        className="text-sm mb-1 font-semibold"
                                                    >
                                                        {key.name}
                                                    </label>
                                                    {renderInputField(key)}
                                                </div>
                                            ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const res = await fetch("/api/create", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                    table: selectedTable,
                                                    data: newData,
                                                }),
                                            });
                                            // biome-ignore lint/style/useBlockStatements: short condition
                                            if (res.ok) loadTable(selectedTable);
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mb-6"
                                    >
                                        Add Row
                                    </button>
                                </>
                            )}
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => setShowColumnModal(true)}
                                        className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-3 py-1 rounded mr-2"
                                    >
                                        🛠️ Kelola Kolom
                                    </button>
                                    <button
                                        type="button"
                                        onClick={exportToExcel}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded"
                                    >
                                        Export Excel
                                    </button>
                                </div>
                            </div>
                            <table className="min-w-full bg-slate-900 overflow-hidden border border-slate-700">
                                <thead className="bg-slate-700 text-xs uppercase text-gray-300">
                                    <tr>
                                        {columns
                                            .filter((key) => !key.autoIncrement)
                                            .map((key) => (
                                                <th
                                                    key={key.name}
                                                    className="border border-slate-800 px-4 py-2 text-left text-white"
                                                >
                                                    {key.name}
                                                </th>
                                            ))}
                                        <th className="border border-slate-800 px-4 py-2 text-white">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {rows.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-800">
                                            {columns
                                                .filter((key) => !key.autoIncrement)
                                                .map((key) => (
                                                    <td
                                                        key={key.name}
                                                        className="border border-slate-700 px-4 py-2 text-white"
                                                    >
                                                        {editIndex === i ? (
                                                            <input
                                                                value={editData[key.name] || ""}
                                                                onChange={(e) =>
                                                                    setEditData({
                                                                        ...editData,
                                                                        [key.name]: e.target.value,
                                                                    })
                                                                }
                                                                className="w-full p-1 rounded bg-slate-700 text-white"
                                                            />
                                                        ) : (
                                                            row[key.name]
                                                        )}
                                                    </td>
                                                ))}
                                            <td className="border border-slate-700 px-4 py-2 text-white space-x-2">
                                                {editIndex === i ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="text-green-400 hover:text-green-600"
                                                            onClick={() => handleUpdateRow(row)}
                                                        >
                                                            💾
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="text-yellow-400 hover:text-yellow-600"
                                                            onClick={() => setEditIndex(null)}
                                                        >
                                                            ❌
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="text-blue-400 hover:text-blue-600"
                                                            onClick={() => {
                                                                setEditIndex(i);
                                                                setEditData(row);
                                                            }}
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="text-red-400 hover:text-red-600"
                                                            onClick={() => handleDeleteRow(row)}
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
                    columns={columns}
                    onClose={() => setShowColumnModal(false)}
                    onRefresh={() => loadTable(selectedTable)}
                />
            )}
            <FloatingLoader isLoading={loading} message="Loading table..." />
        </Layout>
    );
}
