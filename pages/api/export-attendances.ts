/** biome-ignore-all lint/suspicious/noExplicitAny: fuck you biome */
import ExcelJS from "exceljs";
import { type NextApiRequest, type NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = await getConnection();
    try {
        // Get date range from query params (optional)
        const { startDate, endDate } = req.query;

        // Get settings for lateness calculation
        const [settingsRows] = await db.query(
            "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('jam_masuk', 'jam_pulang')",
        );
        const settings: any = {};
        for (const row of settingsRows as any[]) {
            settings[row.setting_key] = row.setting_value;
        }
        const expectedCheckIn = settings.jam_masuk || "08:00";

        // Build query with optional date filter - group by NIM and date
        let query = `
            SELECT 
                t.nim,
                t.nama,
                t.kelas,
                DATE(a.createdAt) as tanggal,
                MIN(CASE WHEN a.type = 0 THEN a.createdAt END) as waktu_masuk,
                MAX(CASE WHEN a.type = 1 THEN a.createdAt END) as waktu_keluar
            FROM temp_users t
            INNER JOIN attendances a ON a.nim = t.nim
        `;

        const params: any[] = [];

        if (startDate && endDate) {
            query += " WHERE DATE(a.createdAt) BETWEEN ? AND ?";
            params.push(startDate, endDate);
        } else if (startDate) {
            query += " WHERE DATE(a.createdAt) >= ?";
            params.push(startDate);
        } else if (endDate) {
            query += " WHERE DATE(a.createdAt) <= ?";
            params.push(endDate);
        }

        query += " GROUP BY t.nim, DATE(a.createdAt) ORDER BY tanggal DESC, t.nim";

        const [rows]: any = await db.query(query, params);

        // Calculate duration and lateness for each row
        const processedRows = rows.map((row: any) => {
            let latenessStatus = "-";
            let durasiStatus = "-";

            // Format tanggal
            const tanggal = row.tanggal
                ? new Date(row.tanggal).toLocaleDateString("id-ID", {
                      timeZone: "Asia/Jakarta",
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                  })
                : "-";

            // Format waktu masuk
            const waktuMasuk = row.waktu_masuk
                ? new Date(row.waktu_masuk).toLocaleTimeString("id-ID", {
                      timeZone: "Asia/Jakarta",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                  })
                : "-";

            // Format waktu keluar
            const waktuKeluar = row.waktu_keluar
                ? new Date(row.waktu_keluar).toLocaleTimeString("id-ID", {
                      timeZone: "Asia/Jakarta",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                  })
                : "-";

            // Calculate lateness (keterlambatan)
            if (row.waktu_masuk) {
                const checkin = new Date(row.waktu_masuk);
                const [expectedHour, expectedMinute] = expectedCheckIn.split(":").map(Number);
                const expectedTime = new Date(
                    checkin.getFullYear(),
                    checkin.getMonth(),
                    checkin.getDate(),
                    expectedHour,
                    expectedMinute,
                );

                const diffMs = checkin.getTime() - expectedTime.getTime();
                const latenessMinutes = Math.floor(diffMs / (1000 * 60));

                if (latenessMinutes <= 0) {
                    latenessStatus = "Tepat Waktu";
                } else {
                    const hours = Math.floor(latenessMinutes / 60);
                    const mins = latenessMinutes % 60;
                    latenessStatus =
                        hours > 0 ? `Terlambat ${hours}j ${mins}m` : `Terlambat ${mins}m`;
                }
            }

            // Calculate duration (durasi di kampus)
            if (row.waktu_masuk && row.waktu_keluar) {
                const masuk = new Date(row.waktu_masuk);
                const keluar = new Date(row.waktu_keluar);
                const durasiSeconds = Math.floor((keluar.getTime() - masuk.getTime()) / 1000);
                const hours = Math.floor(durasiSeconds / 3600);
                const mins = Math.floor((durasiSeconds % 3600) / 60);
                durasiStatus = `${hours}j ${mins}m`;
            } else if (row.waktu_masuk) {
                durasiStatus = "Belum pulang";
            }

            return {
                Tanggal: tanggal,
                NIM: row.nim,
                Nama: row.nama || "-",
                Kelas: row.kelas || "-",
                "Waktu Masuk": waktuMasuk,
                "Waktu Keluar": waktuKeluar,
                Durasi: durasiStatus,
                Keterlambatan: latenessStatus,
            };
        });

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Data Absensi");

        // Set column headers
        worksheet.columns = [
            { header: "Tanggal", key: "Tanggal", width: 15 },
            { header: "NIM", key: "NIM", width: 15 },
            { header: "Nama", key: "Nama", width: 30 },
            { header: "Kelas", key: "Kelas", width: 15 },
            { header: "Waktu Masuk", key: "Waktu Masuk", width: 15 },
            { header: "Waktu Keluar", key: "Waktu Keluar", width: 15 },
            { header: "Durasi", key: "Durasi", width: 15 },
            { header: "Keterlambatan", key: "Keterlambatan", width: 20 },
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4472C4" },
        };
        worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

        // Add data rows
        worksheet.addRows(processedRows);

        // Auto-filter
        worksheet.autoFilter = {
            from: "A1",
            to: "H1",
        };

        // Generate filename with date range
        const today = new Date().toISOString().split("T")[0];
        let filename = `attendances_${today}.xlsx`;
        if (startDate && endDate) {
            filename = `attendances_${startDate}_to_${endDate}.xlsx`;
        }

        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );

        const buffer = await workbook.xlsx.writeBuffer();
        res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    } finally {
        await db.end();
    }
}
