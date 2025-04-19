import type { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "DELETE") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { table, columnName } = req.body;
    if (!table || !columnName) {
        return res.status(400).json({ message: "Missing fields" });
    }

    const db = await getConnection();
    try {
        await db.execute(`ALTER TABLE \`${table}\` DROP COLUMN \`${columnName}\``);
        res.status(200).json({ message: "Column deleted successfully" });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message });
    } finally {
        await db.end();
    }
}
