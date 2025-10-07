/** biome-ignore-all lint/suspicious/noExplicitAny: needed */
import { type NextApiRequest, type NextApiResponse } from "next";
import { getConnection } from "../../../lib/db";
import { type AttendanceT, type CreateAttendanceRequest, type UserT } from "../../../types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = await getConnection();

    try {
        switch (req.method) {
            case "POST": {
                const { fingerprint } = req.body as CreateAttendanceRequest;

                // First try to find in users table (for admin/dosen)
                let [rowsU]: any = await db.query("SELECT * FROM users WHERE fingerprint = ?", [
                    fingerprint,
                ]);

                // If not found in users table, try temp_users table (for students)
                if (!rowsU || rowsU.length === 0) {
                    [rowsU] = await db.query("SELECT * FROM temp_users WHERE fingerprints LIKE ?", [
                        `%${fingerprint}%`,
                    ]);
                }

                if (!rowsU || rowsU.length === 0) {
                    return res.status(404).json({ message: "User tidak ditemukan" });
                }
                const user = rowsU[0] as UserT;

                // Make sure the user is a student (only students can have attendance)
                if (user.isAdmin === 1 || user.isDosen === 1) {
                    return res.status(403).json({ message: "User bukan mahasiswa" });
                }

                // Check if nim exists (students should have nim)
                if (!user.nim) {
                    return res.status(404).json({ message: "NIM tidak ditemukan" });
                }

                // Check if attendance already exists
                const [lastAttendance]: any = await db.query(
                    "SELECT * FROM attendances WHERE nim = ? ORDER BY createdAt DESC LIMIT 1",
                    [user.nim],
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
                    [user.nim, attendance],
                );

                if (result.affectedRows === 0) {
                    return res.status(500).json({ message: "Gagal membuat absensi" });
                }

                res.status(201).json({ message: "Absensi berhasil dibuat" });
                break;
            }
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
