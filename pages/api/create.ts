import type { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "../../lib/db";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { table, data } = req.body;

    if (!table || !data) {
        return res.status(400).json({ message: "Missing table or data" });
    }

    const db = await getConnection();
    try {
        // Auto hash password if field exists
        if (data.password) {
            const salt = await bcrypt.genSalt(10);
            data.password = await bcrypt.hash(data.password, salt);
        }

        const keys = Object.keys(data)
            .map((key) => `\`${key}\``)
            .join(", ");
        const placeholders = Object.keys(data)
            .map(() => "?")
            .join(", ");
        const values = Object.values(data);

        await db.execute(`INSERT INTO \`${table}\` (${keys}) VALUES (${placeholders})`, values);

        res.status(200).json({ message: "Insert success" });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message });
    } finally {
        db.end();
    }
}
