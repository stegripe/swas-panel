import ExcelJS from "exceljs";
import { type NextApiRequest, type NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
    const db = await getConnection();
    try {
        // Get settings for expected check-in and check-out times
        const [settingsRows] = await db.query(
            "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('jam_masuk', 'jam_pulang')",
        );

        interface SettingRow {
            setting_key: string;
            setting_value: string;
        }

        const settings: Record<string, string> = {};
        for (const row of settingsRows as SettingRow[]) {
            settings[row.setting_key] = row.setting_value;
        }
        const expectedCheckIn = settings.jam_masuk || "08:00";
        const expectedCheckOut = settings.jam_pulang || "17:00";

        // Ambil data absensi terakhir hari ini per user (ESP32 structure)
        const [rows] = await db.query(`
            SELECT
                t.nama,
                t.nim,
                t.kelas,
                -- Get the most recent attendance today
                (
                    SELECT a1.createdAt
                    FROM attendances a1
                    WHERE a1.nim = t.nim
                    AND DATE(a1.createdAt) = CURDATE()
                    ORDER BY a1.createdAt DESC
                    LIMIT 1
                ) AS last_attendance,
                -- Get the type of the most recent attendance today
                (
                    SELECT a1.type
                    FROM attendances a1
                    WHERE a1.nim = t.nim
                    AND DATE(a1.createdAt) = CURDATE()
                    ORDER BY a1.createdAt DESC
                    LIMIT 1
                ) AS last_type,
                -- Get the check-in time (first type=0 of the day)
                (
                    SELECT MIN(a2.createdAt)
                    FROM attendances a2
                    WHERE a2.nim = t.nim
                    AND DATE(a2.createdAt) = CURDATE()
                    AND a2.type = 0
                ) AS checkin_time,
                -- Get the check-out time (last type=1 of the day)
                (
                    SELECT MAX(a3.createdAt)
                    FROM attendances a3
                    WHERE a3.nim = t.nim
                    AND DATE(a3.createdAt) = CURDATE()
                    AND a3.type = 1
                ) AS checkout_time
            FROM temp_users t
            ORDER BY last_attendance DESC
    `);

        // Define interface for raw attendance row from database
        interface RawAttendanceRow {
            nama: string;
            nim: string;
            kelas: string | null;
            last_attendance: string | null;
            last_type: number | null;
            checkin_time: string | null;
            checkout_time: string | null;
        }

        // Calculate duration and lateness for each row
        const processedRows = (rows as RawAttendanceRow[]).map((row: RawAttendanceRow) => {
            let duration_seconds = null;
            let lateness_minutes = null;

            // If no checkin_time but has last_type=0, use last_attendance as checkin
            const actualCheckinTime =
                row.checkin_time || (row.last_type === 0 ? row.last_attendance : null);

            // Calculate duration (time spent on campus) in seconds
            if (actualCheckinTime) {
                const checkin = new Date(actualCheckinTime);
                // If checked out, use checkout time; otherwise use current time
                const endTime = row.checkout_time ? new Date(row.checkout_time) : new Date();
                duration_seconds = Math.floor((endTime.getTime() - checkin.getTime()) / 1000);
            }

            // Calculate lateness (difference between actual check-in and expected check-in)
            if (actualCheckinTime) {
                const checkin = new Date(actualCheckinTime);
                const [expectedHour, expectedMinute] = expectedCheckIn.split(":").map(Number);

                // Convert checkin time to WIB (Asia/Jakarta, UTC+7)
                const checkinWIB = new Date(
                    checkin.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
                );

                // Create expected time in WIB timezone
                const expectedTime = new Date(
                    checkinWIB.getFullYear(),
                    checkinWIB.getMonth(),
                    checkinWIB.getDate(),
                    expectedHour,
                    expectedMinute,
                    0,
                    0,
                );

                const diffMs = checkinWIB.getTime() - expectedTime.getTime();
                lateness_minutes = Math.floor(diffMs / (1000 * 60));

                // Only count as late if positive (arrived after expected time)
                if (lateness_minutes < 0) {
                    lateness_minutes = 0; // Came early, not late
                }
            }

            return {
                ...row,
                checkin_time: actualCheckinTime || row.checkin_time,
                checkout_time: row.checkout_time,
                duration_seconds,
                lateness_minutes,
                expected_checkin: expectedCheckIn,
                expected_checkout: expectedCheckOut,
            };
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Monitoring_Absensi");

        if (processedRows.length > 0) {
            // Define columns with widths for the Excel export
            const columns = [
                { header: "No", key: "no", width: 5 },
                { header: "Nama", key: "nama", width: 25 },
                { header: "NIM", key: "nim", width: 15 },
                { header: "Kelas", key: "kelas", width: 10 },
                { header: "Status", key: "status", width: 15 },
                { header: "Check-in Time", key: "checkin_time", width: 20 },
                { header: "Check-out Time", key: "checkout_time", width: 20 },
                { header: "Durasi (Jam)", key: "duration_formatted", width: 15 },
                { header: "Keterlambatan (Menit)", key: "lateness_formatted", width: 20 },
                { header: "Waktu Masuk (Expected)", key: "expected_checkin", width: 20 },
                { header: "Waktu Pulang (Expected)", key: "expected_checkout", width: 20 },
            ];

            worksheet.columns = columns;

            // Add data rows
            processedRows.forEach((row, index) => {
                // Format duration from seconds to hours:minutes
                const formatDuration = (seconds: number | null) => {
                    if (!seconds) {
                        return "-";
                    }
                    const hours = Math.floor(seconds / 3600);
                    const minutes = Math.floor((seconds % 3600) / 60);
                    return `${hours.toString().padStart(2, "0")}j ${minutes.toString().padStart(2, "0")}m`;
                };

                // Format lateness
                const formatLateness = (minutes: number | null) => {
                    if (minutes === null) {
                        return "-";
                    }
                    if (minutes === 0) {
                        return "Tepat Waktu";
                    }
                    return `${minutes} menit`;
                };

                // Format status based on last_type
                const formatStatus = (lastType: number | null) => {
                    if (lastType === 0) {
                        return "Hadir";
                    }
                    if (lastType === 1) {
                        return "Pulang";
                    }
                    return "Belum Hadir";
                };

                // Format datetime to readable format
                const formatDateTime = (dateString: string | null) => {
                    if (!dateString) {
                        return "-";
                    }
                    const date = new Date(dateString);
                    return date.toLocaleString("id-ID", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Jakarta",
                    });
                };

                const newRow = worksheet.addRow({
                    no: index + 1,
                    nama: row.nama || "-",
                    nim: row.nim || "-",
                    kelas: row.kelas || "-",
                    status: formatStatus(row.last_type),
                    checkin_time: formatDateTime(row.checkin_time),
                    checkout_time: formatDateTime(row.checkout_time),
                    duration_formatted: formatDuration(row.duration_seconds),
                    lateness_formatted: formatLateness(row.lateness_minutes),
                    expected_checkin: row.expected_checkin || "-",
                    expected_checkout: row.expected_checkout || "-",
                });

                // Conditional formatting for status column
                const statusCell = newRow.getCell(5); // Status column (0-indexed)
                if (row.last_type === 0) {
                    statusCell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FF10B981" }, // Green for "Hadir"
                    };
                } else if (row.last_type === 1) {
                    statusCell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FF3B82F6" }, // Blue for "Pulang"
                    };
                } else {
                    statusCell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFEF4444" }, // Red for "Belum Hadir"
                    };
                }
                statusCell.font = { color: { argb: "FFFFFFFF" }, bold: true };

                // Conditional formatting for lateness column
                const latenessCell = newRow.getCell(9); // Lateness column (0-indexed)
                if (row.lateness_minutes && row.lateness_minutes > 0) {
                    latenessCell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFF59E0B" }, // Orange for late
                    };
                    latenessCell.font = { color: { argb: "FF000000" } };
                } else if (row.lateness_minutes === 0) {
                    latenessCell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FF10B981" }, // Green for on time
                    };
                    latenessCell.font = { color: { argb: "FFFFFFFF" } };
                }

                // Add borders to all cells in the row
                newRow.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin", color: { argb: "FFCCCCCC" } },
                        left: { style: "thin", color: { argb: "FFCCCCCC" } },
                        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
                        right: { style: "thin", color: { argb: "FFCCCCCC" } },
                    };
                });
            });

            // Style the header row
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
            headerRow.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF1F2937" }, // Dark gray background
            };
            headerRow.alignment = { horizontal: "center", vertical: "middle" };

            // Add borders to header
            headerRow.eachCell((cell) => {
                cell.border = {
                    top: { style: "thin", color: { argb: "FFFFFFFF" } },
                    left: { style: "thin", color: { argb: "FFFFFFFF" } },
                    bottom: { style: "thin", color: { argb: "FFFFFFFF" } },
                    right: { style: "thin", color: { argb: "FFFFFFFF" } },
                };
            });

            // Set row height for header
            headerRow.height = 25;

            // Add title and metadata
            worksheet.insertRow(1, []);
            worksheet.insertRow(1, []);
            worksheet.insertRow(1, []);

            const titleRow = worksheet.getRow(1);
            titleRow.getCell(1).value = "LAPORAN MONITORING KEHADIRAN";
            titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: "FF1F2937" } };
            worksheet.mergeCells("A1:K1");

            const dateRow = worksheet.getRow(2);
            const currentDate = new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                timeZone: "Asia/Jakarta",
            });
            dateRow.getCell(1).value = `Tanggal: ${currentDate}`;
            dateRow.getCell(1).font = { italic: true, color: { argb: "FF6B7280" } };
            worksheet.mergeCells("A2:K2");

            const summaryRow = worksheet.getRow(3);
            const totalStudents = processedRows.length;
            const presentCount = processedRows.filter(
                (r) => r.last_type === 0 || r.last_type === 1,
            ).length;
            const absentCount = totalStudents - presentCount;
            const lateCount = processedRows.filter(
                (r) => r.lateness_minutes && r.lateness_minutes > 0,
            ).length;

            summaryRow.getCell(1).value =
                `Total Mahasiswa: ${totalStudents} | Hadir: ${presentCount} | Tidak Hadir: ${absentCount} | Terlambat: ${lateCount}`;
            summaryRow.getCell(1).font = { color: { argb: "FF374151" } };
            worksheet.mergeCells("A3:K3");

            // Center align title and summary
            titleRow.alignment = { horizontal: "center" };
            dateRow.alignment = { horizontal: "center" };
            summaryRow.alignment = { horizontal: "center" };
        }

        // Set headers for file download
        const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=monitoring_absensi_${timestamp}.xlsx`,
        );
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );

        const buffer = await workbook.xlsx.writeBuffer();
        res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
}
