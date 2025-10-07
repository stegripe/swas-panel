import { useEffect, useState } from "react";
import { type MonitoringT } from "../types";
import FloatingLoader from "./FloatingLoader";

export default function MonitoringAbsensi() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<MonitoringT[]>([]);
    const [filter, setFilter] = useState("all");
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchData = () => {
        setIsLoading(true);
        fetch("/api/monitoring")
            .then((res) => res.json())
            .then((res) => setData(res.data || []))
            .catch((error) => console.error("Failed to fetch data:", error))
            .finally(() => setIsLoading(false));
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: false positive
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

    const getStatusDisplay = (item: MonitoringT) => {
        // biome-ignore lint/style/useBlockStatements: short condition
        if (!item.last_attendance) return <span className="text-red-400">Belum Hadir</span>;
        // biome-ignore lint/style/useBlockStatements: short condition
        if (item.last_type === 0) return <span className="text-green-400">Hadir</span>;
        // biome-ignore lint/style/useBlockStatements: short condition
        if (item.last_type === 1) return <span className="text-blue-400">Pulang</span>;
        return <span className="text-red-400">Unknown</span>;
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const getCheckInTime = (item: MonitoringT) => {
        // biome-ignore lint/style/useBlockStatements: short condition
        if (item.last_attendance && item.last_type === 0) return formatTime(item.last_attendance);
        // biome-ignore lint/style/useBlockStatements: short condition
        if (item.prev_attendance) return formatTime(item.prev_attendance);

        return "-";
    };

    const getCheckOutTime = (item: MonitoringT) => {
        // biome-ignore lint/style/useBlockStatements: short condition
        if (item.last_attendance && item.last_type === 1) return formatTime(item.last_attendance);
        return "-";
    };

    const filteredData = data.filter((item: MonitoringT) => {
        const lastAttendance = item.last_attendance ? new Date(item.last_attendance) : null;
        const now = new Date();
        // biome-ignore lint/style/useBlockStatements: short condition
        if (!lastAttendance) return filter === "all";

        const daysDiff = (now.getTime() - lastAttendance.getTime()) / (1000 * 60 * 60 * 24);
        // biome-ignore lint/style/useBlockStatements: short condition
        if (filter === "today") return lastAttendance.toDateString() === now.toDateString();
        // biome-ignore lint/style/useBlockStatements: short condition
        if (filter === "7days") return daysDiff <= 7;
        // biome-ignore lint/style/useBlockStatements: short condition
        if (filter === "30days") return daysDiff <= 30;

        return true;
    });

    return (
        <div className="min-h-screen p-8 bg-background text-white">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                <h1 className="text-3xl font-semibold">Monitoring Kehadiran Hari Ini</h1>

                <div className="flex items-center gap-3 text-sm">
                    <label className="text-slate-400" htmlFor="filter">
                        Filter waktu:
                    </label>
                    <select
                        value={filter}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            setFilter(e.target.value)
                        }
                        className="bg-slate-800 border border-slate-600 text-white text-sm rounded-sm px-2 py-1"
                    >
                        <option value="all">Semua</option>
                        <option value="today">Hari Ini</option>
                        <option value="7days">7 Hari Terakhir</option>
                        <option value="30days">30 Hari Terakhir</option>
                    </select>

                    <label className="ml-4 text-slate-400" htmlFor="autoRefresh">
                        Auto refresh:
                    </label>
                    <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={() => setAutoRefresh(!autoRefresh)}
                    />

                    <span className="ml-4 text-slate-400" id={`userCount-${Date.now()}`}>
                        Menampilkan {filteredData.length} pengguna
                    </span>

                    <button
                        type="button"
                        onClick={goToRaw}
                        className="ml-4 bg-slate-700 hover:bg-primary px-4 py-2 rounded-sm shadow-sm text-white font-medium"
                    >
                        Lihat JSON
                    </button>

                    <button
                        type="button"
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
                        {filteredData.map((item: MonitoringT, i: number) => (
                            <tr
                                key={`${item.nama}-${i}`}
                                className="odd:bg-slate-900 even:bg-slate-800 border-b border-slate-700"
                            >
                                <td className="px-4 py-2">{item.nama}</td>
                                <td className="px-4 py-2">{item.nim}</td>
                                <td className="px-4 py-2">{item.kelas || "-"}</td>
                                <td className="px-4 py-2">{getStatusDisplay(item)}</td>
                                <td className="px-4 py-2">{getCheckInTime(item)}</td>
                                <td className="px-4 py-2">{getCheckOutTime(item)}</td>
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
