import { type NextApiRequest, type NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "PUT") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { table, oldName, newName, newType } = req.body;
    if (!table || !oldName || !newName || !newType) {
        return res.status(400).json({ message: "Missing fields" });
    }

    const db = await getConnection();
    try {
        await db.execute(
            `ALTER TABLE \`${table}\` CHANGE \`${oldName}\` \`${newName}\` ${newType}`,
        );
        res.status(200).json({ message: "Column updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    } finally {
        await db.end();
    }
}
