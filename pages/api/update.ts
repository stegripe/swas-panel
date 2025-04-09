import { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "PUT") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { table, data, primaryKey, id } = req.body;
    if (!table || !data || !primaryKey || typeof id === "undefined") {
        return res.status(400).json({ message: "Missing fields" });
    }

    try {
        const db = await getConnection();

        const formattedData: { [key: string]: any } = {};
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:.+/)) {
                formattedData[key] = new Date(value).toISOString().slice(0, 19).replace("T", " ");
            } else {
                formattedData[key] = value;
            }
        }

        const columns = Object.keys(formattedData)
            .map((key) => `\`${key}\` = ?`)
            .join(", ");
        const values = Object.values(formattedData);

        await db.execute(`UPDATE \`${table}\` SET ${columns} WHERE \`${primaryKey}\` = ?`, [
            ...values,
            id,
        ]);

        res.status(200).json({ message: "Update success" });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
