import { useEffect, useState } from "react";
import Layout from "../components/Layout";

export default function Dashboard() {
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [rows, setRows] = useState<any[]>([]);
    const [newData, setNewData] = useState<{ [key: string]: any }>({});
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [editData, setEditData] = useState<{ [key: string]: any }>({});

    useEffect(() => {
        fetch("/api/data")
            .then((res) => res.json())
            .then((data) => {
                const tableNames = data.tables?.map((t: any) => Object.values(t)[0]) || [];
                setTables(tableNames);
            });
    }, []);

    const loadTable = (table: string) => {
        setSelectedTable(table);
        fetch(`/api/data?table=${table}`)
            .then((res) => res.json())
            .then((data) => {
                setRows(data.rows || []);
                setNewData({});
                setEditIndex(null);
            });
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
        <Layout tables={tables} selected={selectedTable} onSelect={loadTable}>
            {selectedTable && (
                <>
                    <h2 className="text-2xl font-bold mb-4">Table: {selectedTable}</h2>

                    {/* Form Tambah */}
                    {rows[0] && (
                        <div className="mb-6">
                            <h3 className="text-lg mb-2">Add New Row:</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                                {Object.keys(rows[0]).map((key) => (
                                    <input
                                        key={key}
                                        placeholder={key}
                                        value={newData[key] || ""}
                                        onChange={(e) =>
                                            setNewData({ ...newData, [key]: e.target.value })
                                        }
                                        className="p-2 rounded bg-slate-800 text-white border border-slate-600"
                                    />
                                ))}
                            </div>
                            <button
                                onClick={handleCreate}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                            >
                                Add Row
                            </button>
                        </div>
                    )}

                    {/* Tabel */}
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
                </>
            )}
        </Layout>
    );
}
