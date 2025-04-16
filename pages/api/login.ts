import type { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { email, password } = req.body;

    try {
        const db = await getConnection();
        const [rows]: any = await db.query(
            "SELECT * FROM users WHERE email = ? AND password = ? LIMIT 1",
            [email, password]
        );

        if (rows.length > 0) {
            res.setHeader("Set-Cookie", `user=1; Path=/; HttpOnly`);
            res.status(200).json({ message: "Login success" });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
}
