import { jwtVerify } from "jose";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "swas-secret";

export function signToken(payload: object) {
    return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export async function verifyJwtToken(token: string) {
    try {
        const verified = await jwtVerify(token, new TextEncoder().encode(SECRET));
        return verified.payload;
    } catch (error) {
        throw new Error("Your token is expired");
    }
}
