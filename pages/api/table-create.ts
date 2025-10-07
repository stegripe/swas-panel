import { type NextApiRequest, type NextApiResponse } from "next";
import { getConnection } from "../../lib/db";
import { type ColumnData } from "../../types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { name, columns }: { name: string; columns: ColumnData[] } = req.body;
    if (typeof name !== "string" || !Array.isArray(columns)) {
        return res.status(400).json({ message: "Invalid request" });
    }
    // Validate table name
    const validTableName = /^[a-zA-Z0-9_]+$/.test(name);
    if (!validTableName) {
        return res.status(400).json({ message: "Invalid table name" });
    }

    const cols = columns
        .map((col: ColumnData) => {
            let colDef = `\`${col.name}\` ${col.type}`;
            if (col.primary) {
                colDef += " PRIMARY KEY";
                if (col.autoIncrement && col.type.toLowerCase().includes("int")) {
                    colDef += " AUTO_INCREMENT";
                }
            }
            if (col.unique && !col.primary) {
                colDef += " UNIQUE";
            }
            if (col.nullable && !col.primary) {
                colDef += " NULL";
            } else if (!col.nullable) {
                colDef += " NOT NULL";
            }
            return colDef;
        })
        .join(", ");

    const db = await getConnection();
    try {
        await db.query(`CREATE TABLE \`${name}\` (${cols})`);
        return res.status(200).json({ message: "Table created" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    } finally {
        await db.end();
    }
}
