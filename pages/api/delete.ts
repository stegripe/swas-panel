/** biome-ignore-all lint/suspicious/noExplicitAny: needed */
import { type NextApiRequest, type NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "DELETE") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { table, primaryKey, id, criteria } = req.body;

    if (!table) {
        return res.status(400).json({ message: "Missing table" });
    }

    if (!primaryKey && !criteria) {
        return res.status(400).json({ message: "Missing primary key or criteria for deletion" });
    }

    const db = await getConnection();
    try {
        let query = `DELETE FROM \`${table}\``;
        const params: any[] = [];

        if (primaryKey && typeof id !== "undefined") {
            // Use primary key for WHERE clause
            query += ` WHERE \`${primaryKey}\` = ?`;
            params.push(id);
        } else if (criteria) {
            // Build WHERE clause for criteria
            const whereClauses = Object.keys(criteria).map((key) => {
                if (criteria[key] === null) {
                    return `\`${key}\` IS NULL`; // Handle NULL values
                }
                return `\`${key}\` = ?`;
            });

            query += ` WHERE ${whereClauses.join(" AND ")}`;
            params.push(...Object.values(criteria).filter((value) => value !== null)); // Exclude NULL values from params
        } else {
            throw new Error("No primary key or criteria provided for deletion");
        }

        const [result]: any = await db.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No matching row found to delete" });
        }

        res.status(200).json({ message: "Delete success" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    } finally {
        await db.end();
    }
}
