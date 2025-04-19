import type { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    let {
        table,
        columnName,
        columnType,
        primary,
        autoIncrement,
        unique,
        nullable,
    }: ColumnAddRequest = req.body;
    if (
        typeof table !== "string" ||
        typeof columnName !== "string" ||
        typeof columnType !== "string"
    ) {
        return res.status(400).json({ message: "Invalid request" });
    }
    // Validate column name and type
    const validColumnName = /^[a-zA-Z0-9_]+$/.test(columnName);
    const validColumnType =
        /^(int|varchar|text|date|datetime|timestamp|float|double|decimal)\(?[0-9]*\)?$/.test(
            columnType
        );
    if (!validColumnName || !validColumnType) {
        return res.status(400).json({ message: "Invalid column name or type" });
    }
    // Validate other fields
    const validPrimary = typeof primary === "boolean" ? primary : false;
    const validAutoIncrement = typeof autoIncrement === "boolean" ? autoIncrement : false;
    const validUnique = typeof unique === "boolean" ? unique : false;
    const validNullable = typeof nullable === "boolean" ? nullable : false;
    if (validPrimary && validAutoIncrement) {
        return res.status(400).json({ message: "Auto increment cannot be primary" });
    }
    if (validPrimary && validUnique) {
        return res.status(400).json({ message: "Primary key cannot be unique" });
    }
    if (validAutoIncrement && validNullable) {
        return res.status(400).json({ message: "Auto increment cannot be nullable" });
    }
    if (validUnique && validNullable) {
        return res.status(400).json({ message: "Unique cannot be nullable" });
    }
    if (validPrimary && validNullable) {
        return res.status(400).json({ message: "Primary key cannot be nullable" });
    }

    const db = await getConnection();
    try {
        let query = `ALTER TABLE \`${table}\` ADD COLUMN \`${columnName}\` ${columnType}`;
        if (validNullable) {
            query += " NULL";
        } else {
            query += " NOT NULL";
        }
        if (validPrimary) {
            query += " PRIMARY KEY";
        }
        if (validAutoIncrement) {
            query += " AUTO_INCREMENT";
        }
        if (validUnique) {
            query += " UNIQUE";
        }
        await db.execute(query);

        res.status(200).json({ message: "Column added successfully" });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message });
    } finally {
        await db.end();
    }
}
