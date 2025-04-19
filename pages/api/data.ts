import { NextApiRequest, NextApiResponse } from "next";
import { RowDataPacket } from "mysql2";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = await getConnection();
    try {
        if (req.method === "GET") {
            const tableName = req.query.table as string;

            if (!tableName) {
                // Ambil list tabel
                const [tables] = await db.query("SHOW TABLES");
                return res.status(200).json({ tables });
            }

            // Ambil data
            const [rows] = await db.query<RowDataPacket[]>(
                `SELECT * FROM \`${tableName}\` LIMIT 100`
            );

            const [desc] = await db.query(`DESCRIBE \`${tableName}\``);

            const columns = (desc as any[]).map((col) => `${col.Field}[]${col.Type}[]${col.Extra}`);

            return res.status(200).json({ rows, columns });
        }

        res.status(405).json({ message: "Method not allowed" });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message });
    } finally {
        db.end();
    }
}
