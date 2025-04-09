import { useEffect, useState } from 'react';

export default function MonitoringAbsensi() {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/monitoring')
            .then(res => res.json())
            .then(res => setData(res.data || []));
    }, []);

    const goToLogin = () => {
        window.location.href = '/login';
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Monitoring Kehadiran Hari Ini</h1>
                <button
                    onClick={goToLogin}
                    className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
                >
                    Login Admin
                </button>
            </div>
            <table className="min-w-full border border-gray-300 bg-white shadow">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border px-4 py-2">Nama</th>
                        <th className="border px-4 py-2">NIM</th>
                        <th className="border px-4 py-2">Kelas</th>
                        <th className="border px-4 py-2">Status</th>
                        <th className="border px-4 py-2">Waktu Masuk</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, i) => (
                        <tr key={i} className="text-center">
                            <td className="border px-4 py-2">{item.name}</td>
                            <td className="border px-4 py-2">{item.nim}</td>
                            <td className="border px-4 py-2">{item.nama_kelas || '-'}</td>
                            <td className="border px-4 py-2">
                                {item.last_attendance ? 'Hadir' : 'Belum Hadir'}
                            </td>
                            <td className="border px-4 py-2">
                                {item.last_attendance ? new Date(item.last_attendance).toLocaleTimeString() : '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
