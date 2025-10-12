import { type NextApiRequest, type NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = await getConnection();
    try {
        // Ensure settings table exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value VARCHAR(255) NOT NULL,
                description TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        if (req.method === "GET") {
            const [rows] = await db.query("SELECT * FROM settings");
            
            // Convert to key-value object for easier access
            const settings: any = {};
            (rows as any[]).forEach((row: any) => {
                settings[row.setting_key] = row.setting_value;
            });

            // Set defaults if not exist
            if (!settings.jam_masuk) {
                await db.query(
                    "INSERT INTO settings (setting_key, setting_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = setting_value",
                    ["jam_masuk", "08:00", "Jam masuk yang diharapkan (format HH:mm)"]
                );
                settings.jam_masuk = "08:00";
            }
            if (!settings.jam_pulang) {
                await db.query(
                    "INSERT INTO settings (setting_key, setting_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = setting_value",
                    ["jam_pulang", "17:00", "Jam pulang yang diharapkan (format HH:mm)"]
                );
                settings.jam_pulang = "17:00";
            }

            return res.status(200).json(settings);
        }

        if (req.method === "POST" || req.method === "PUT") {
            const { jam_masuk, jam_pulang } = req.body;

            if (jam_masuk) {
                await db.query(
                    "INSERT INTO settings (setting_key, setting_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
                    ["jam_masuk", jam_masuk, "Jam masuk yang diharapkan (format HH:mm)", jam_masuk]
                );
            }

            if (jam_pulang) {
                await db.query(
                    "INSERT INTO settings (setting_key, setting_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
                    ["jam_pulang", jam_pulang, "Jam pulang yang diharapkan (format HH:mm)", jam_pulang]
                );
            }

            return res.status(200).json({ message: "Settings updated successfully" });
        }

        res.status(405).json({ message: "Method not allowed" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    } finally {
        await db.end();
    }
}

