import { useEffect, useState } from "react";
import FloatingLoader from "./FloatingLoader";

export default function MonitoringAbsensi() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [filter, setFilter] = useState("all");
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchData = () => {
        setIsLoading(true);
        fetch("/api/monitoring")
            .then((res) => res.json())
            .then((res) => setData(res.data || []))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchData();
        if (autoRefresh) {
            const interval = setInterval(fetchData, 30000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const goToLogin = () => {
        window.location.href = "/login";
    };

    const goToRaw = () => window.open("/api/monitoring?raw=true", "_blank");

    const filteredData = data.filter((item) => {
        const lastAttendance = item.last_attendance ? new Date(item.last_attendance) : null;
        const now = new Date();
        if (!lastAttendance) return filter === "all";

        const daysDiff = (now.getTime() - lastAttendance.getTime()) / (1000 * 60 * 60 * 24);
        if (filter === "today") {
            return lastAttendance.toDateString() === now.toDateString();
        } else if (filter === "7days") {
            return daysDiff <= 7;
        } else if (filter === "30days") {
            return daysDiff <= 30;
        }
        return true;
    });

    return (
        <div className="min-h-screen p-8 bg-background text-white">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                <h1 className="text-3xl font-semibold">Monitoring Kehadiran Hari Ini</h1>

                <div className="flex items-center gap-3 text-sm">
                    <label className="text-slate-400">Filter waktu:</label>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-slate-800 border border-slate-600 text-white text-sm rounded-sm px-2 py-1"
                    >
                        <option value="all">Semua</option>
                        <option value="today">Hari Ini</option>
                        <option value="7days">7 Hari Terakhir</option>
                        <option value="30days">30 Hari Terakhir</option>
                    </select>

                    <label className="ml-4 text-slate-400">Auto refresh:</label>
                    <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={() => setAutoRefresh(!autoRefresh)}
                    />

                    <span className="ml-4 text-slate-400">
                        Menampilkan {filteredData.length} pengguna
                    </span>

                    <button
                        onClick={goToRaw}
                        className="ml-4 bg-slate-700 hover:bg-primary px-4 py-2 rounded-sm shadow-sm text-white font-medium"
                    >
                        Lihat JSON
                    </button>

                    <button
                        onClick={goToLogin}
                        className="ml-4 bg-primary hover:bg-slate-700 px-4 py-2 rounded-sm shadow-sm text-white font-medium"
                    >
                        Login Admin
                    </button>
                </div>
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
                            <th className="px-4 py-3">Waktu Keluar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((item, i) => (
                            <tr
                                key={i}
                                className="odd:bg-slate-900 even:bg-slate-800 border-b border-slate-700"
                            >
                                <td className="px-4 py-2">{item.nama}</td>
                                <td className="px-4 py-2">{item.nim}</td>
                                <td className="px-4 py-2">{item.kelas || "-"}</td>
                                <td className="px-4 py-2">
                                    {item.last_attendance ? (
                                        item.last_type === 0 ? (
                                            <span className="text-green-400">Hadir</span>
                                        ) : item.last_type === 1 ? (
                                            <span className="text-blue-400">Pulang</span>
                                        ) : (
                                            <span className="text-red-400">Unknown</span>
                                        )
                                    ) : (
                                        <span className="text-red-400">Belum Hadir</span>
                                    )}
                                </td>
                                <td className="px-4 py-2">
                                    {item.last_attendance && item.last_type === 0
                                        ? new Date(item.last_attendance).toLocaleTimeString(
                                            "id-ID",
                                            {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                second: "2-digit",
                                            }
                                        )
                                        : item.prev_attendance
                                            ? new Date(item.prev_attendance).toLocaleTimeString(
                                                "id-ID",
                                                {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    second: "2-digit",
                                                }
                                            )
                                            : "-"}
                                </td>
                                <td className="px-4 py-2">
                                    {item.last_attendance && item.last_type === 1
                                        ? new Date(item.last_attendance).toLocaleTimeString(
                                            "id-ID",
                                            {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                second: "2-digit",
                                            }
                                        )
                                        : "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredData.length === 0 && !isLoading && (
                    <p className="text-center text-sm text-slate-400 mt-4">
                        Belum ada data absensi.
                    </p>
                )}
            </div>
            <FloatingLoader isLoading={isLoading} message="Loading attendance data..." />
        </div>
    );
}
