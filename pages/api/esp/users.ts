import { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = await getConnection();

    try {
        switch (req.method) {
            case "GET":
                const userId = req.query.userId;
                const fingerprint = req.query.fingerprint;

                if (!userId && !fingerprint) {
                    res.status(400).json({
                        message: "Setidaknya satu parameter diperlukan",
                        fields: ["userId", "fingerprint"],
                    });
                    return;
                }

                let whereClause = "";
                const params: any[] = [];

                if (userId) {
                    whereClause += (whereClause ? " AND" : " WHERE") + " nim = ?";
                    params.push(userId);
                }
                if (fingerprint) {
                    whereClause += (whereClause ? " AND" : " WHERE") + " fingerprint = ?";
                    params.push(fingerprint);
                }

                // Query from temp_users table (ESP32 structure)
                const [rows]: any = await db.query("SELECT * FROM temp_users" + whereClause, params);
                if (!rows || rows.length === 0) {
                    res.status(404).json({ message: "User tidak ditemukan" });
                    return;
                }

                const user = rows[0] as UserT;
                const userData: GetUserResponse = {
                    id: 0, // temp_users doesn't have id column
                    email: user.email || "",
                    isAdmin: user.isAdmin || 0,
                    isDosen: user.isDosen || 0,
                    fingerprint: user.fingerprint,
                    nim: user.nim,
                    nama: user.nama,
                    kelas: user.kelas,
                    createdAt: user.createdAt || new Date().toISOString(),
                    updatedAt: user.updatedAt || new Date().toISOString(),
                };

                res.status(200).json(userData);
                break;
            case "POST":
                const createData = req.body as CreateUserRequest;
                const isSiswaA = createData.isAdmin === 0 && createData.isDosen === 0;

                const userValidationErrors = validateUserData(createData);
                const siswaValidationErrors = isSiswaA ? validateSiswaData(createData) : [];

                const allErrors = [...userValidationErrors, ...siswaValidationErrors];
                if (allErrors.length > 0) {
                    res.status(400).json({
                        message: "Beberapa field diperlukan",
                        fields: allErrors,
                    });
                    return;
                }

                // Insert into temp_users table (ESP32 structure)
                await db.query(
                    "INSERT INTO temp_users (nim, nama, kelas, fingerprints, email, password, isAdmin, isDosen, fingerprint, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        createData.nim || null,
                        createData.nama || null,
                        createData.kelas || null,
                        createData.fingerprint || null,
                        createData.email,
                        createData.password,
                        createData.isAdmin,
                        createData.isDosen,
                        createData.fingerprint,
                        createData.createdAt || new Date().toISOString(),
                        createData.updatedAt || new Date().toISOString(),
                    ]
                );

                res.status(201).json({ message: "User berhasil dibuat" });
                break;
            case "PATCH":
                const updateData = req.body as UpdateUserRequest;
                const identifier = req.query.userId || req.query.fingerprint;
                
                if (!identifier) {
                    res.status(400).json({ message: "userId atau fingerprint diperlukan" });
                    return;
                }

                let whereClauseUpdate = "";
                if (req.query.userId) {
                    whereClauseUpdate = "WHERE nim = ?";
                } else if (req.query.fingerprint) {
                    whereClauseUpdate = "WHERE fingerprint = ?";
                }

                const [rowsU2]: any = await db.query(`SELECT * FROM temp_users ${whereClauseUpdate}`, [
                    identifier,
                ]);

                if (!rowsU2 || rowsU2.length === 0) {
                    res.status(404).json({ message: "User tidak ditemukan" });
                    return;
                }

                const user2 = rowsU2[0] as UserT;

                // Update temp_users table (ESP32 structure)
                const validKeys = ["email", "password", "isAdmin", "isDosen", "fingerprint", "nim", "nama", "kelas", "fingerprints", "createdAt", "updatedAt"];
                const updates = Object.keys(updateData)
                    .filter((key) => validKeys.includes(key))
                    .map((key) => `${key} = ?`)
                    .join(", ");

                if (updates.length === 0) {
                    res.status(400).json({ message: "Tidak ada field valid untuk diperbarui" });
                    return;
                }

                const updateKeys = Object.keys(updateData).filter((key) => validKeys.includes(key));
                const updateValues = updateKeys.map((key) => (updateData as any)[key]);
                await db.query(`UPDATE temp_users SET ${updates} ${whereClauseUpdate}`, [
                    ...updateValues,
                    identifier,
                ]);

                res.status(200).json({ message: "User berhasil diperbarui" });
                break;
            case "DELETE":
                const userIdToDelete = req.query.userId;
                const fingerprintToDelete = req.query.fingerprint;

                if (!userIdToDelete && !fingerprintToDelete) {
                    res.status(400).json({
                        message: "Setidaknya satu parameter diperlukan",
                        fields: ["userId", "fingerprint"],
                    });
                    return;
                }

                let whereClauseDelete = "";
                const paramsDelete: any[] = [];

                if (userIdToDelete) {
                    whereClauseDelete += (whereClauseDelete ? " AND" : " WHERE") + " nim = ?";
                    paramsDelete.push(userIdToDelete);
                }
                if (fingerprintToDelete) {
                    whereClauseDelete +=
                        (whereClauseDelete ? " AND" : " WHERE") + " fingerprint = ?";
                    paramsDelete.push(fingerprintToDelete);
                }

                const [rowsD]: any = await db.query(
                    "SELECT * FROM temp_users" + whereClauseDelete,
                    paramsDelete
                );
                if (!rowsD || rowsD.length === 0) {
                    res.status(404).json({ message: "User tidak ditemukan" });
                    return;
                }

                const userD = rowsD[0] as UserT;

                // Delete from temp_users table (ESP32 structure)
                if (userIdToDelete) {
                    await db.query("DELETE FROM temp_users WHERE nim = ?", [userIdToDelete]);
                } else if (fingerprintToDelete) {
                    await db.query("DELETE FROM temp_users WHERE fingerprint = ?", [fingerprintToDelete]);
                }
                res.status(200).json({ message: "User berhasil dihapus" });
                break;
            default:
                res.setHeader("Allow", ["GET", "POST", "PATCH"]);
                res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    } finally {
        await db.end();
    }
}

function validateUserData(data: CreateUserRequest) {
    const errors = [];
    if (!data.email) errors.push("email");
    if (!data.password) errors.push("password");
    if (typeof data.isAdmin !== "number" || data.isAdmin < 0 || data.isAdmin > 1)
        errors.push("isAdmin");
    if (typeof data.isDosen !== "number" || data.isDosen < 0 || data.isDosen > 1)
        errors.push("isDosen");
    return errors;
}

function validateSiswaData(data: CreateUserRequest | UpdateUserRequest) {
    const errors = [];
    if (!data.nim) errors.push("nim");
    if (!data.nama) errors.push("nama");
    if (!data.kelas) errors.push("kelas");
    if (!data.createdAt) errors.push("createdAt");
    if (!data.updatedAt) errors.push("updatedAt");
    return errors;
}
