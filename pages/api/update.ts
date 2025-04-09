import { NextApiRequest, NextApiResponse } from 'next';
import { getConnection } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { table, data, primaryKey, id } = req.body;

    try {
        const db = await getConnection();

        // Format datetime fields
        const formatDate = (value: any) => {
            const date = new Date(value);
            return date.toISOString().slice(0, 19).replace('T', ' ');
        };

        // Format fields if needed
        const formattedData: { [key: string]: any } = {};
        for (const [key, val] of Object.entries(data)) {
            if (['valid_from', 'valid_to', 'show_from'].includes(key) && val) {
                formattedData[key] = formatDate(val);
            } else {
                formattedData[key] = val;
            }
        }

        const columns = Object.keys(formattedData).map(col => `\`${col}\` = ?`).join(',');
        const values = Object.values(formattedData);

        await db.execute(
            `UPDATE \`${table}\` SET ${columns} WHERE \`${primaryKey}\` = ?`,
            [...values, id]
        );

        res.status(200).json({ message: 'Update success' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
