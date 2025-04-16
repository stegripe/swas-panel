import { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { name, columns } = req.body;
    if (!name || !Array.isArray(columns)) {
        return res.status(400).json({ message: "Invalid request" });
    }

    const cols = columns.map((col: any) => `\`${col.name}\` ${col.type}`).join(", ");

    try {
        const db = await getConnection();
        await db.query(`CREATE TABLE \`${name}\` (${cols})`);
        return res.status(200).json({ message: "Table created" });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}
