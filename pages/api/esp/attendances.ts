import { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = await getConnection();

    try {
        switch (req.method) {
            case "POST":
                const { fingerprint } = req.body as CreateAttendanceRequest;
                // Get user ID from fingerprint
                const [rowsU]: any = await db.query("SELECT id FROM users WHERE fingerprint = ?", [
                    fingerprint,
                ]);
                if (!rowsU || rowsU.length === 0) {
                    return res.status(404).json({ message: "User tidak ditemukan" });
                }
                const user = rowsU[0] as UserT;

                // Make sure the user is a student
                if (user.isAdmin === 1 || user.isDosen === 1) {
                    return res.status(403).json({ message: "User bukan mahasiswa" });
                }

                // Check if data mahasiswa exists
                const [rowsM]: any = await db.query("SELECT id FROM mahasiswa WHERE userId = ?", [
                    user.id,
                ]);
                if (!rowsM || rowsM.length === 0) {
                    return res.status(404).json({ message: "Mahasiswa tidak ditemukan" });
                }
                const mahasiswa = rowsM[0] as MahasiswaT;

                // Check if attendance already exists
                const [lastAttendance]: any = await db.query(
                    "SELECT * FROM attendances WHERE nim = ? ORDER BY createdAt DESC LIMIT 1",
                    [mahasiswa.nim]
                );

                // Determine attendance type
                let attendance = 0;
                if (lastAttendance) {
                    const last = lastAttendance as AttendanceT;
                    const lastDate = new Date(last.createdAt);
                    const now = new Date();

                    // Check if last attendance is today
                    const isSameDay =
                        lastDate.getFullYear() === now.getFullYear() &&
                        lastDate.getMonth() === now.getMonth() &&
                        lastDate.getDate() === now.getDate();

                    if (last.type === 1 && isSameDay) {
                        return res.status(409).json({ message: "Anda sudah checkout hari ini" });
                    }
                    if (last.type === 0 && isSameDay) {
                        attendance = 1; // Set to checkout
                    }
                    // If last attendance is not today, attendance stays 0 (check-in)
                }

                // Create attendance record
                const [result]: any = await db.query(
                    "INSERT INTO attendances (nim, type, createdAt) VALUES (?, ?, NOW())",
                    [mahasiswa.nim, attendance]
                );

                if (result.affectedRows === 0) {
                    return res.status(500).json({ message: "Gagal membuat absensi" });
                }

                res.status(201).json({ message: "Absensi berhasil dibuat" });
                break;
            default:
                res.setHeader("Allow", ["POST"]);
                res.status(405).end(`Method ${req.method} Not Allowed`);
                break;
        }
    } catch (error) {
        console.error("Error occurred while processing request:", error);
        res.status(500).json({ message: "Internal Server Error" });
    } finally {
        await db.end();
    }
}
