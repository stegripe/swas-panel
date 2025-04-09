import { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "DELETE") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { table } = req.body;

    try {
        const db = await getConnection();
        await db.execute(`DROP TABLE IF EXISTS \`${table}\``, []);
        res.status(200).json({ message: "Delete success" });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
