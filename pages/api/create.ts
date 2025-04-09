import { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({
            message: "Method not allowed",
        });
    }

    const { table, data } = req.body;

    try {
        const db = await getConnection();
        const columns = Object.keys(data)
            .map((col) => `\`${col}\``)
            .join(",");
        const values = Object.values(data);
        const placeholders = values.map(() => "?").join(",");

        await db.execute(`INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`, values);
        res.status(200).json({
            message: "Insert success",
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({
            error: err.message,
        });
    }
}
