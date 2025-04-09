import { useEffect, useState } from "react";
import Layout from "../components/Layout";

export default function Dashboard() {
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [rows, setRows] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [newData, setNewData] = useState<{ [key: string]: any }>({});
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [editData, setEditData] = useState<{ [key: string]: any }>({});
    const [classOptions, setClassOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

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

        if (table === "users") {
            fetch("/api/classes")
                .then((res) => res.json())
                .then((data) => setClassOptions(data));
        } else {
            setClassOptions([]);
        }
    };

    const handleCreate = async () => {
        if (!selectedTable) return;
        const res = await fetch("/api/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ table: selectedTable, data: newData }),
        });

        if (res.ok) {
            loadTable(selectedTable);
            setNewData({});
        } else {
            alert("Insert failed");
        }
    };

    const handleDelete = async (row: any) => {
        if (!selectedTable || !rows[0]) return;
        const primaryKey = Object.keys(rows[0])[0];
        if (!confirm("Yakin ingin menghapus data ini?")) return;

        const res = await fetch("/api/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ table: selectedTable, primaryKey, id: row[primaryKey] }),
        });

        if (res.ok) {
            loadTable(selectedTable);
        } else {
            alert("Gagal menghapus data");
        }
    };

    const handleEditSave = async (index: number) => {
        if (!selectedTable || !rows[0]) return;
        const primaryKey = Object.keys(rows[0])[0];
        const id = rows[index][primaryKey];

        const res = await fetch("/api/update", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ table: selectedTable, data: editData, primaryKey, id }),
        });

        if (res.ok) {
            setEditIndex(null);
            loadTable(selectedTable);
        } else {
            alert("Gagal mengupdate data");
        }
    };

    return (
        <>
            <Layout tables={tables} selected={selectedTable} onSelect={loadTable}>
                {selectedTable && (
                    <>
                        <h2 className="text-2xl font-bold mb-4">Table: {selectedTable}</h2>

                        {columns.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg mb-2">Add New Row:</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                                    {columns
                                        .filter((key) => key !== "id")
                                        .map((key) => {
                                            const isBool = key === "is_dosen" || key === "is_admin";
                                            const isClass = key === "class";
                                            const isDatetime =
                                                key === "created_at" || key === "updated_at";

                                            if (isBool) {
                                                return (
                                                    <label
                                                        key={key}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={!!newData[key]}
                                                            onChange={(e) =>
                                                                setNewData({
                                                                    ...newData,
                                                                    [key]: e.target.checked ? 1 : 0,
                                                                })
                                                            }
                                                        />
                                                        {key}
                                                    </label>
                                                );
                                            }

                                            if (isClass) {
                                                return (
                                                    <select
                                                        key={key}
                                                        value={newData[key] || ""}
                                                        onChange={(e) =>
                                                            setNewData({
                                                                ...newData,
                                                                [key]: e.target.value,
                                                            })
                                                        }
                                                        className="p-2 rounded bg-slate-800 text-white border border-slate-600"
                                                    >
                                                        <option value="">Pilih Kelas</option>
                                                        {classOptions.map((c) => (
                                                            <option key={c.id} value={c.id}>
                                                                {c.nama_kelas}
                                                            </option>
                                                        ))}
                                                    </select>
                                                );
                                            }

                                            if (isDatetime) {
                                                return (
                                                    <input
                                                        key={key}
                                                        type="datetime-local"
                                                        value={
                                                            newData[key]
                                                                ? new Date(newData[key])
                                                                      .toISOString()
                                                                      .slice(0, 16)
                                                                : ""
                                                        }
                                                        onChange={(e) =>
                                                            setNewData({
                                                                ...newData,
                                                                [key]: new Date(e.target.value)
                                                                    .toISOString()
                                                                    .slice(0, 19)
                                                                    .replace("T", " "),
                                                            })
                                                        }
                                                        className="p-2 rounded bg-slate-800 text-white border border-slate-600"
                                                    />
                                                );
                                            }

                                            return (
                                                <input
                                                    key={key}
                                                    placeholder={key}
                                                    value={newData[key] || ""}
                                                    onChange={(e) =>
                                                        setNewData({
                                                            ...newData,
                                                            [key]: e.target.value,
                                                        })
                                                    }
                                                    className="p-2 rounded bg-slate-800 text-white border border-slate-600"
                                                />
                                            );
                                        })}
                                </div>
                                <button
                                    onClick={handleCreate}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                                >
                                    Add Row
                                </button>
                            </div>
                        )}

                        {rows.length > 0 && (
                            <div className="overflow-x-auto border border-slate-700 rounded-lg">
                                <table className="min-w-full text-sm text-left">
                                    <thead className="bg-slate-800 text-slate-200 uppercase text-xs">
                                        <tr>
                                            {Object.keys(rows[0] || {}).map((key) => (
                                                <th key={key} className="px-4 py-3">
                                                    {key}
                                                </th>
                                            ))}
                                            <th className="px-4 py-3">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, i) => (
                                            <tr
                                                key={i}
                                                className="odd:bg-slate-900 even:bg-slate-800 border-b border-slate-700"
                                            >
                                                {Object.keys(row).map((key) => (
                                                    <td key={key} className="px-4 py-2">
                                                        {editIndex === i ? (
                                                            <input
                                                                value={editData[key] ?? row[key]}
                                                                onChange={(e) =>
                                                                    setEditData({
                                                                        ...editData,
                                                                        [key]: e.target.value,
                                                                    })
                                                                }
                                                                className="bg-slate-700 text-white p-1 rounded w-full"
                                                            />
                                                        ) : (
                                                            String(row[key])
                                                        )}
                                                    </td>
                                                ))}
                                                <td className="px-4 py-2 space-x-2">
                                                    {editIndex === i ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditSave(i)}
                                                                className="text-green-400"
                                                            >
                                                                💾
                                                            </button>
                                                            <button
                                                                onClick={() => setEditIndex(null)}
                                                                className="text-gray-400"
                                                            >
                                                                ✖️
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setEditIndex(i);
                                                                    setEditData(rows[i]);
                                                                }}
                                                                className="text-blue-400"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(row)}
                                                                className="text-red-400"
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
                            </div>
                        )}
                    </>
                )}
            </Layout>

            {loading && (
                <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                    <div className="text-white text-lg">Loading table...</div>
                </div>
            )}
        </>
    );
}
