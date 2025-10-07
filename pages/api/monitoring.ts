import { type NextApiRequest, type NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = await getConnection();
    try {
        if (req.method === "GET") {
            // Ambil data absensi terakhir hari ini per user (ESP32 structure)
            const [rows] = await db.query(`
                SELECT 
                    t.nama, 
                    t.nim, 
                    t.kelas,
                    -- Get the most recent attendance
                    MAX(a.createdAt) AS last_attendance,
                    -- Get the type of the most recent attendance
                    MAX(a.type) AS last_type,
                    -- Subquery to get the second most recent attendance
                    (
                        SELECT MAX(a2.createdAt)
                        FROM attendances a2
                        WHERE a2.nim = t.nim
                        AND a2.createdAt < (
                            SELECT MAX(a3.createdAt)
                            FROM attendances a3
                            WHERE a3.nim = t.nim
                            AND DATE(a3.createdAt) = CURDATE()
                        )
                    ) AS prev_attendance
                FROM temp_users t
                LEFT JOIN attendances a ON a.nim = t.nim
                AND a.createdAt >= CURDATE()
                AND a.createdAt < CURDATE() + INTERVAL 1 DAY
                GROUP BY t.nim
                ORDER BY last_attendance DESC
        `);

            if (req.query.raw === "true") {
                res.status(200).json(rows);
                return;
            }

            res.status(200).json({ data: rows });
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
