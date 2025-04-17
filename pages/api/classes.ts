import { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const db = await getConnection();
        const [rows] = await db.query("SELECT id, nama_kelas FROM classes");
        res.status(200).json(rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
}
