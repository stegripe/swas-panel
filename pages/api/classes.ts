import { type NextApiRequest, type NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
    const db = await getConnection();

    try {
        const [rows] = await db.query("SELECT id, nama_kelas FROM classes");
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    } finally {
        await db.end();
    }
}
