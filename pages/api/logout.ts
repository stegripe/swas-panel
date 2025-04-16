import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader("Set-Cookie", "user=; Path=/; Max-Age=0; HttpOnly");
    res.status(200).json({ message: "Logged out" });
}
