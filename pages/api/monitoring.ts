import { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = await getConnection();
    try {
        if (req.method === "GET") {
            // Ambil data absensi terakhir hari ini per user
            const [rows] = await db.query(`
                SELECT 
                    m.id, 
                    m.nama, 
                    m.nim, 
                    c.namaKelas,
                    -- Get the most recent attendance
                    MAX(a.createdAt) AS last_attendance,
                    -- Get the type of the most recent attendance
                    MAX(a.type) AS last_type,
                    -- Subquery to get the second most recent attendance
                    (
                        SELECT MAX(a2.createdAt)
                        FROM attendances a2
                        WHERE a2.nim = m.nim
                        AND a2.createdAt < (
                            SELECT MAX(a3.createdAt)
                            FROM attendances a3
                            WHERE a3.nim = m.nim
                            AND DATE(a3.createdAt) = CURDATE()
                        )
                    ) AS prev_attendance
                FROM mahasiswa m
                LEFT JOIN classes c ON m.kelas = c.id   
                LEFT JOIN attendances a ON a.nim = m.nim
                AND a.createdAt >= CURDATE()
                AND a.createdAt < CURDATE() + INTERVAL 1 DAY
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
    } finally {
        await db.end();
    }
}
