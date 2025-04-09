import { useEffect, useState } from "react";

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
        <div className="p-8">
            <h1 className="text-2xl mb-4">Dashboard</h1>

            {/* List Tabel */}
            <div className="mb-6">
                <h2 className="text-xl mb-2">Tables:</h2>
                <div className="flex flex-wrap gap-2">
                    {tables.map((table) => (
                        <button
                            key={table}
                            onClick={() => loadTable(table)}
                            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                        >
                            {table}
                        </button>
                    ))}
                </div>
            </div>

            {/* Form Tambah Data */}
            {selectedTable && (
                <div className="mb-6">
                    <h3 className="text-lg mb-2">Add New Data:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                        {rows[0] ? (
                            Object.keys(rows[0]).map((key) => (
                                <input
                                    key={key}
                                    placeholder={key}
                                    value={newData[key] || ""}
                                    onChange={(e) =>
                                        setNewData({ ...newData, [key]: e.target.value })
                                    }
                                    className="border p-2"
                                />
                            ))
                        ) : (
                            <p className="col-span-full text-gray-500">
                                Data kosong. Tidak bisa tampil form karena tidak diketahui struktur
                                kolom.
                            </p>
                        )}
                    </div>
                    {rows[0] && (
                        <button
                            onClick={handleCreate}
                            className="bg-green-500 text-white px-4 py-2 rounded"
                        >
                            Add Data
                        </button>
                    )}
                </div>
            )}

            {/* Isi Tabel */}
            {selectedTable && rows.length > 0 && (
                <div className="overflow-auto border">
                    <table className="min-w-full border border-gray-200">
                        <thead>
                            <tr>
                                {Object.keys(rows[0]).map((key) => (
                                    <th key={key} className="border px-4 py-2">
                                        {key}
                                    </th>
                                ))}
                                <th className="border px-4 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => (
                                <tr key={i}>
                                    {Object.keys(row).map((key) => (
                                        <td key={key} className="border px-4 py-2">
                                            {editIndex === i ? (
                                                <input
                                                    value={editData[key] ?? row[key]}
                                                    onChange={(e) =>
                                                        setEditData({
                                                            ...editData,
                                                            [key]: e.target.value,
                                                        })
                                                    }
                                                    className="border p-1 w-full"
                                                />
                                            ) : (
                                                String(row[key])
                                            )}
                                        </td>
                                    ))}
                                    <td className="border px-4 py-2 space-x-2">
                                        {editIndex === i ? (
                                            <>
                                                <button
                                                    onClick={() => handleEditSave(i)}
                                                    className="text-green-600"
                                                >
                                                    💾
                                                </button>
                                                <button
                                                    onClick={() => setEditIndex(null)}
                                                    className="text-gray-500"
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
                                                    className="text-blue-600"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(row)}
                                                    className="text-red-600"
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
        </div>
    );
}
