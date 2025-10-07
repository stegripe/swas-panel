import { type RowDataPacket } from "mysql2";
import { type NextApiRequest, type NextApiResponse } from "next";
import { getConnection } from "../../lib/db";
import { type ColumnData, type SQLResponse } from "../../types";

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
                `SELECT * FROM \`${tableName}\` LIMIT 100`,
            );

            const [desc] = await db.query(`DESCRIBE \`${tableName}\``);

            const columns = (desc as SQLResponse[]).map((col) => ({
                name: col.Field,
                type: col.Type,
                primary: col.Key === "PRI",
                autoIncrement: col.Extra.includes("auto_increment"),
                unique: col.Key === "UNI",
                nullable: col.Null === "YES",
            })) as ColumnData[];

            return res.status(200).json({ rows, columns });
        }

        res.status(405).json({ message: "Method not allowed" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    } finally {
        await db.end();
    }
}
