import { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = await getConnection();

    try {
        // Cek parameter tabel yang diminta (misalnya: /api/data?table=users)
        const table = req.query.table as string;

        if (!table) {
            // Kalau tidak ada, kirim daftar semua tabel
            const [tables] = await db.query("SHOW TABLES");
            res.status(200).json({
                tables,
            });
        } else {
            // Kalau ada, ambil isi tabelnya
            const [rows] = await db.query(`SELECT * FROM \`${table}\` LIMIT 100`);
            res.status(200).json({
                rows,
            });
        }
    } catch (err: any) {
        console.error(err);
        res.status(500).json({
            error: err.message,
        });
    } finally {
        await db.end();
    }
}
