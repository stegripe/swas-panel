import ExcelJS from "exceljs";
import { type NextApiRequest, type NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { table } = req.query;

    if (!table || typeof table !== "string") {
        return res.status(400).json({ message: "Missing or invalid table name" });
    }

    const db = await getConnection();
    try {
        // biome-ignore lint/suspicious/noExplicitAny: needed
        const [rows]: any = await db.query(`SELECT * FROM \`${table}\``);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(table);

        if (rows.length > 0) {
            const columns = Object.keys(rows[0]).map((key) => ({ header: key, key }));
            worksheet.columns = columns;
            worksheet.addRows(rows);
        }

        res.setHeader("Content-Disposition", `attachment; filename=${table}.xlsx`);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );

        const buffer = await workbook.xlsx.writeBuffer();
        res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    } finally {
        await db.end();
    }
}
