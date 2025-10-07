import { type NextApiRequest, type NextApiResponse } from "next";

export default function handler(_: NextApiRequest, res: NextApiResponse) {
    res.setHeader("Set-Cookie", "token=; Path=/; Max-Age=0; HttpOnly");
    res.status(200).json({ message: "Logged out" });
}
