import { useEffect, useState } from "react";

export default function MonitoringAbsensi() {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        fetch("/api/monitoring")
            .then((res) => res.json())
            .then((res) => setData(res.data || []));
    }, []);

    const goToLogin = () => {
        window.location.href = "/login";
    };

    return (
        <div className="min-h-screen p-8 bg-background text-white">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold">Monitoring Kehadiran Hari Ini</h1>
                <button
                    onClick={goToLogin}
                    className="bg-primary hover:bg-primary.light px-4 py-2 rounded shadow text-white font-medium"
                >
                    Login Admin
                </button>
            </div>

            <div className="overflow-x-auto border border-slate-600 rounded-lg">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-slate-800 text-slate-200 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">NIM</th>
                            <th className="px-4 py-3">Kelas</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Waktu Masuk</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, i) => (
                            <tr
                                key={i}
                                className="odd:bg-slate-900 even:bg-slate-800 border-b border-slate-700"
                            >
                                <td className="px-4 py-2">{item.name}</td>
                                <td className="px-4 py-2">{item.nim}</td>
                                <td className="px-4 py-2">{item.nama_kelas || "-"}</td>
                                <td className="px-4 py-2">
                                    {item.last_attendance ? (
                                        <span className="text-green-400">Hadir</span>
                                    ) : (
                                        <span className="text-red-400">Belum Hadir</span>
                                    )}
                                </td>
                                <td className="px-4 py-2">
                                    {item.last_attendance
                                        ? new Date(item.last_attendance).toLocaleTimeString()
                                        : "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
