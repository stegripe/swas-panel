/** biome-ignore-all lint/suspicious/noExplicitAny: fuck you biome */
import { type NextApiRequest, type NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = await getConnection();
    try {
        if (req.method === "GET") {
            // Get settings for expected check-in and check-out times
            const [settingsRows] = await db.query(
                "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('jam_masuk', 'jam_pulang')",
            );
            const settings: any = {};
            for (const row of settingsRows as any[]) {
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

            // Calculate duration and lateness for each row
            const processedRows = (rows as any[]).map((row: any) => {
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

            if (req.query.raw === "true") {
                res.status(200).json(processedRows);
                return;
            }

            res.status(200).json({ data: processedRows });
        } else {
            res.status(405).json({ message: "Method not allowed" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    } finally {
        await db.end();
    }
}
