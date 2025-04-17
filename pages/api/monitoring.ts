import { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const db = await getConnection();

        // Ambil data absensi terakhir hari ini per user
        const [rows] = await db.query(`
            SELECT u.id, u.name, u.nim, u.class, c.nama_kelas,
                   MAX(a.created_at) AS last_attendance,
                   MAX(a.type) AS last_type
            FROM users u
            LEFT JOIN classes c ON u.class = c.id
            LEFT JOIN attendances a ON u.id = a.user_id AND DATE(a.created_at) = CURDATE()
            GROUP BY u.id
            ORDER BY last_attendance DESC
        `);

        if (req.query.raw === "true") {
            res.status(200).json(rows);
            return;
        }

        res.status(200).json({ data: rows });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
}
