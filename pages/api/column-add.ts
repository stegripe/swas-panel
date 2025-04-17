import type { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { table, columnName, columnType } = req.body;
    if (!table || !columnName || !columnType) {
        return res.status(400).json({ message: "Missing fields" });
    }

    try {
        const db = await getConnection();
        await db.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${columnName}\` ${columnType}`);
        res.status(200).json({ message: "Column added successfully" });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
}
