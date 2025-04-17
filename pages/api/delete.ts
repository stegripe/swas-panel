import { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "DELETE") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { table, primaryKey, id } = req.body;

    try {
        const db = await getConnection();
        await db.execute(`DELETE FROM \`${table}\` WHERE \`${primaryKey}\` = ?`, [id]);
        res.status(200).json({ message: "Delete success" });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
}
