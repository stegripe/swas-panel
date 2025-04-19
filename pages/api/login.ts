import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { getConnection } from "../../lib/db";
import { signToken } from "../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { email, password } = req.body;

    try {
        const db = await getConnection();
        const [rows]: any = await db.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = signToken({
            id: user.id,
            email: user.email,
            isAdmin: user.isAdmin,
            isDosen: user.isDosen,
        });

        res.setHeader("Set-Cookie", `token=${token}; Path=/; HttpOnly`);
        res.status(200).json({ message: "Login success" });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
}
