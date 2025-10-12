import { useEffect, useState } from "react";
import FloatingLoader from "./FloatingLoader";

export default function SettingsPanel() {
    const [jamMasuk, setJamMasuk] = useState("08:00");
    const [jamPulang, setJamPulang] = useState("17:00");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        // Fetch current settings
        setLoading(true);
        fetch("/api/settings")
            .then((res) => res.json())
            .then((data) => {
                setJamMasuk(data.jam_masuk || "08:00");
                setJamPulang(data.jam_pulang || "17:00");
            })
            .catch((error) => console.error("Failed to fetch settings:", error))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setLoading(true);
        setMessage("");
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jam_masuk: jamMasuk,
                    jam_pulang: jamPulang,
                }),
            });

            if (res.ok) {
                setMessage("✅ Settings berhasil disimpan!");
                setTimeout(() => setMessage(""), 3000);
            } else {
                setMessage("❌ Gagal menyimpan settings");
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            setMessage("❌ Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    };

    const handleExportAttendances = async () => {
        setLoading(true);
        setMessage("");
        try {
            let url = "/api/export-attendances";
            const params = new URLSearchParams();
            if (startDate) {
                params.append("startDate", startDate);
            }
            if (endDate) {
                params.append("endDate", endDate);
            }
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const res = await fetch(url);
            if (!res.ok) {
                setMessage("❌ Gagal export data");
                return;
            }

            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            const filename =
                startDate && endDate
                    ? `attendances_${startDate}_to_${endDate}.xlsx`
                    : `attendances_${new Date().toISOString().split("T")[0]}.xlsx`;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setMessage("✅ Data berhasil diexport!");
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            console.error("Error exporting attendances:", error);
            setMessage("❌ Terjadi kesalahan saat export");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-slate-900 rounded-lg border border-slate-700">
            <h2 className="text-2xl font-bold mb-6 text-white">Pengaturan Jam Kerja</h2>

            <div className="space-y-4 max-w-md">
                <div>
                    <label
                        htmlFor="jamMasuk"
                        className="block text-sm font-medium text-slate-300 mb-2"
                    >
                        Jam Masuk yang Diharapkan
                    </label>
                    <input
                        type="time"
                        id="jamMasuk"
                        value={jamMasuk}
                        onChange={(e) => setJamMasuk(e.target.value)}
                        className="w-full p-3 rounded bg-slate-800 text-white border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                        Waktu ini digunakan untuk menghitung keterlambatan
                    </p>
                </div>

                <div>
                    <label
                        htmlFor="jamPulang"
                        className="block text-sm font-medium text-slate-300 mb-2"
                    >
                        Jam Pulang yang Diharapkan
                    </label>
                    <input
                        type="time"
                        id="jamPulang"
                        value={jamPulang}
                        onChange={(e) => setJamPulang(e.target.value)}
                        className="w-full p-3 rounded bg-slate-800 text-white border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                        Waktu ini digunakan sebagai referensi jam pulang
                    </p>
                </div>

                <div className="flex items-center gap-4 pt-4">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-medium transition-colors"
                    >
                        Simpan Pengaturan
                    </button>
                    {message && <span className="text-sm">{message}</span>}
                </div>
            </div>

            <div className="mt-8 p-4 bg-slate-800 rounded border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-2">ℹ️ Informasi</h3>
                <ul className="text-sm text-slate-300 space-y-1">
                    <li>• Jam masuk digunakan untuk menghitung keterlambatan mahasiswa</li>
                    <li>• Jam pulang digunakan sebagai referensi waktu kerja standar</li>
                    <li>• Durasi di kampus dihitung dari waktu masuk hingga waktu keluar aktual</li>
                    <li>
                        • Keterlambatan hanya dihitung jika mahasiswa datang setelah jam masuk yang
                        ditetapkan
                    </li>
                </ul>
            </div>

            {/* Export Attendances Section */}
            <div className="mt-8 p-6 bg-slate-800 rounded border border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-4">📊 Export Data Absensi</h3>
                <p className="text-sm text-slate-400 mb-4">
                    Export data absensi lengkap dengan informasi keterlambatan ke format Excel
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label
                            htmlFor="startDate"
                            className="block text-sm font-medium text-slate-300 mb-2"
                        >
                            Tanggal Mulai (opsional)
                        </label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-3 rounded bg-slate-900 text-white border border-slate-600 focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="endDate"
                            className="block text-sm font-medium text-slate-300 mb-2"
                        >
                            Tanggal Akhir (opsional)
                        </label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-3 rounded bg-slate-900 text-white border border-slate-600 focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleExportAttendances}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-medium transition-colors flex items-center gap-2"
                    >
                        <span>📥</span>
                        Export ke Excel
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setStartDate("");
                            setEndDate("");
                        }}
                        className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded font-medium transition-colors"
                    >
                        Reset Filter
                    </button>
                </div>

                <p className="text-xs text-slate-500 mt-3">
                    Kosongkan tanggal untuk export semua data. Isi kedua tanggal untuk filter range
                    tertentu.
                </p>
            </div>

            <FloatingLoader isLoading={loading} message="Memproses..." />
        </div>
    );
}
