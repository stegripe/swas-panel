import { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "DELETE") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Table name is required" });
    }

    const db = await getConnection();
    try {
        await db.query(`DROP TABLE \`${name}\``);
        return res.status(200).json({ message: "Table deleted" });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message });
    } finally {
        await db.end();
    }
}
