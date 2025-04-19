import { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === "GET") {
            const db = await getConnection();

            // Ambil data absensi terakhir hari ini per user
            const [rows] = await db.query(`
                SELECT 
                    m.id, 
                    m.nama, 
                    m.nim, 
                    c.nama_kelas,
                    -- Get the most recent attendance
                    MAX(a.created_at) AS last_attendance,
                    -- Get the type of the most recent attendance
                    MAX(a.type) AS last_type,
                    -- Subquery to get the second most recent attendance
                    (
                        SELECT MAX(a2.created_at)
                        FROM attendances a2
                        WHERE a2.nim = m.nim
                        AND a2.created_at < (
                            SELECT MAX(a3.created_at)
                            FROM attendances a3
                            WHERE a3.nim = m.nim
                            AND DATE(a3.created_at) = CURDATE()
                        )
                    ) AS prev_attendance
                FROM mahasiswa m
                LEFT JOIN classes c ON m.kelas = c.id   
                LEFT JOIN attendances a ON a.nim = m.nim
                AND a.created_at >= CURDATE()
                AND a.created_at < CURDATE() + INTERVAL 1 DAY
                GROUP BY m.id
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
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
}
