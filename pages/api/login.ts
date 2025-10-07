import bcrypt from "bcryptjs";
import { type NextApiRequest, type NextApiResponse } from "next";
import { signToken } from "../../lib/auth";
import { getConnection } from "../../lib/db";
import { type UserT } from "../../types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { email, password } = req.body;

    const db = await getConnection();
    try {
        // biome-ignore lint/suspicious/noExplicitAny: needed
        const [rows]: any = await db.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = rows[0] as UserT;
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
    } catch (err) {
        res.status(500).json({ message: err.message });
    } finally {
        await db.end();
    }
}
