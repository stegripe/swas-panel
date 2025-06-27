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
                    whereClause += (whereClause ? " AND" : " WHERE") + " id = ?";
                    params.push(userId);
                }
                if (fingerprint) {
                    whereClause += (whereClause ? " AND" : " WHERE") + " fingerprint = ?";
                    params.push(fingerprint);
                }

                const [rowsU1]: any = await db.query("SELECT * FROM users" + whereClause, params);
                let userData: GetUserResponse | null = null;
                if (!rowsU1 || rowsU1.length === 0) {
                    res.status(404).json({ message: "User tidak ditemukan" });
                    return;
                }
                const user1 = rowsU1[0] as UserT;

                const [rowsM1]: any = await db.query("SELECT * FROM mahasiswa WHERE userId = ?", [
                    user1.id,
                ]);
                if (
                    user1.isAdmin === 0 &&
                    user1.isDosen === 0 &&
                    (!rowsM1 || rowsM1.length === 0)
                ) {
                    res.status(404).json({ message: "Mahasiswa tidak ditemukan" });
                    return;
                }

                let mahasiswaData: MahasiswaT | null = null;
                if (user1.isAdmin === 0 && user1.isDosen === 0 && rowsM1 && rowsM1.length > 0) {
                    mahasiswaData = rowsM1[0] as MahasiswaT;
                }

                userData = {
                    id: user1.id,
                    email: user1.email,
                    isAdmin: user1.isAdmin,
                    isDosen: user1.isDosen,
                    fingerprint: user1.fingerprint,
                    mahasiswaId: mahasiswaData ? mahasiswaData.id : null,
                    nim: mahasiswaData ? mahasiswaData.nim : null,
                    nama: mahasiswaData ? mahasiswaData.nama : null,
                    kelas: mahasiswaData ? mahasiswaData.kelas : null,
                    createdAt: mahasiswaData ? mahasiswaData.createdAt : null,
                    updatedAt: mahasiswaData ? mahasiswaData.updatedAt : null,
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

                await db.query(
                    "INSERT INTO users (email, password, isAdmin, isDosen, fingerprint) VALUES (?, ?, ?, ?, ?)",
                    [
                        createData.email,
                        createData.password,
                        createData.isAdmin,
                        createData.isDosen,
                        createData.fingerprint,
                    ]
                );

                if (isSiswaA) {
                    await db.query(
                        "INSERT INTO mahasiswa (nim, nama, kelas, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
                        [
                            createData.nim,
                            createData.nama,
                            createData.kelas,
                            createData.createdAt,
                            createData.updatedAt,
                        ]
                    );
                }

                res.status(201).json({ message: "User berhasil dibuat" });
                break;
            case "PATCH":
                const updateData = req.body as UpdateUserRequest;
                const [rowsU2]: any = await db.query("SELECT * FROM users WHERE id = ?", [
                    req.query.userId,
                ]);
                const [rowsM2]: any = await db.query("SELECT * FROM mahasiswa WHERE userId = ?", [
                    req.query.userId,
                ]);

                if (!rowsU2 || rowsU2.length === 0) {
                    res.status(404).json({ message: "User tidak ditemukan" });
                    return;
                }

                const user2 = rowsU2[0] as UserT;

                const isSiswaB = user2.isAdmin === 0 && user2.isDosen === 0;

                // User Update
                const validKeys = ["email", "password", "isAdmin", "isDosen", "fingerprint"];
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
                await db.query(`UPDATE users SET ${updates} WHERE id = ?`, [
                    ...updateValues,
                    req.query.userId,
                ]);

                // Mahasiswa Update
                const validSiswaKeys = ["nim", "nama", "kelas", "createdAt", "updatedAt"];
                const siswaUpdates = Object.keys(updateData)
                    .filter((key) => validSiswaKeys.includes(key))
                    .map((key) => `${key} = ?`)
                    .join(", ");

                if (isSiswaB && (updateData.isAdmin === 1 || updateData.isDosen === 1)) {
                    await db.query(`DELETE FROM mahasiswa WHERE userId = ?`, [user2.id]);
                }

                const siswaUpdateKeys = Object.keys(updateData).filter((key) =>
                    validSiswaKeys.includes(key)
                );
                const siswaUpdateValues = siswaUpdateKeys.map((key) => (updateData as any)[key]);
                if (isSiswaB && updateData.isAdmin === 0 && updateData.isDosen === 0) {
                    if (rowsM2 && rowsM2.length > 0) {
                        await db.query(`UPDATE mahasiswa SET ${siswaUpdates} WHERE userId = ?`, [
                            ...siswaUpdateValues,
                            user2.id,
                        ]);
                    } else {
                        const updateValidationErrors = validateSiswaData(updateData);
                        if (updateValidationErrors.length > 0) {
                            res.status(400).json({
                                message: "Data mahasiswa tidak valid",
                                errors: updateValidationErrors,
                            });
                            return;
                        }

                        await db.query(
                            `INSERT INTO mahasiswa (userId, nim, nama, kelas, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
                            [
                                user2.id,
                                updateData.nim,
                                updateData.nama,
                                updateData.kelas,
                                updateData.createdAt,
                                updateData.updatedAt,
                            ]
                        );
                    }
                }

                res.status(200).json({ message: "User berhasil diperbarui" });
                break;
            case "DELETE":
                const userIdToDelete = req.query.userId;
                const fingerprintToDelete = req.query.fingerprint;

                if (!userId && !fingerprint) {
                    res.status(400).json({
                        message: "Setidaknya satu parameter diperlukan",
                        fields: ["userId", "fingerprint"],
                    });
                    return;
                }

                let whereClauseDelete = "";
                const paramsDelete: any[] = [];

                if (userIdToDelete) {
                    whereClauseDelete += (whereClauseDelete ? " AND" : " WHERE") + " id = ?";
                    paramsDelete.push(userIdToDelete);
                }
                if (fingerprintToDelete) {
                    whereClauseDelete +=
                        (whereClauseDelete ? " AND" : " WHERE") + " fingerprint = ?";
                    paramsDelete.push(fingerprintToDelete);
                }

                const [rowsD]: any = await db.query(
                    "SELECT * FROM users" + whereClauseDelete,
                    paramsDelete
                );
                if (!rowsD || rowsD.length === 0) {
                    res.status(404).json({ message: "User tidak ditemukan" });
                    return;
                }

                const userD = rowsD[0] as UserT;

                if (userD.isAdmin === 0 && userD.isDosen === 0) {
                    const [rowsM]: any = await db.query(
                        "SELECT * FROM mahasiswa WHERE userId = ?",
                        [userD.id]
                    );
                    if (rowsM && rowsM.length > 0) {
                        await db.query("DELETE FROM mahasiswa WHERE userId = ?", [userD.id]);
                    }
                }

                await db.query("DELETE FROM users WHERE id = ?", [userD.id]);
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
    if (typeof data.kelas !== "number") errors.push("kelas");
    if (!data.createdAt) errors.push("createdAt");
    if (!data.updatedAt) errors.push("updatedAt");
    return errors;
}
