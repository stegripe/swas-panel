import { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "PUT") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { table, data, primaryKey, id, criteria } = req.body;

    if (!table || !data) {
        return res.status(400).json({ message: "Missing table or data" });
    }

    if (!primaryKey && !criteria) {
        return res.status(400).json({ message: "Missing primary key or criteria for update" });
    }

    const db = await getConnection();
    try {
        // Format data for the SET clause
        const formattedData: { [key: string]: any } = {};
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:.+/)) {
                formattedData[key] = new Date(value).toISOString().slice(0, 19).replace("T", " ");
            } else {
                formattedData[key] = value;
            }
        }

        const setClause = Object.keys(formattedData)
            .map((key) => `\`${key}\` = ?`)
            .join(", ");
        const setValues = Object.values(formattedData);

        // Prepare the WHERE clause
        let query = `UPDATE \`${table}\` SET ${setClause}`;
        let params: any[] = [...setValues];

        if (primaryKey && typeof id !== "undefined") {
            // Use primary key for WHERE clause
            query += ` WHERE \`${primaryKey}\` = ?`;
            params.push(id);
        } else if (criteria) {
            // Build WHERE clause for criteria
            const whereClauses = Object.keys(criteria).map((key) => {
                if (criteria[key] === null) {
                    return `\`${key}\` IS NULL`; // Handle NULL values
                } else {
                    return `\`${key}\` = ?`;
                }
            });

            query += ` WHERE ${whereClauses.join(" AND ")}`;
            params.push(...Object.values(criteria).filter((value) => value !== null)); // Exclude NULL values from params
        } else {
            throw new Error("No primary key or criteria provided for update");
        }

        // Execute the query
        const [result]: any = await db.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No matching row found to update" });
        }

        res.status(200).json({ message: "Update success" });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message });
    } finally {
        db.end();
    }
}
