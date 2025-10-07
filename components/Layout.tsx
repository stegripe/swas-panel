import { LayoutDashboard, Trash2 } from "lucide-react";
import type React from "react";

interface Props {
    children: React.ReactNode;
    tables: string[];
    selected: string | null;
    onSelect: (name: string) => void;
    onDeleteTable?: (name: string) => void;
    onCreateTableClick?: () => void;
}

export default function Layout({
    children,
    tables,
    selected,
    onSelect,
    onDeleteTable,
    onCreateTableClick,
}: Props) {
    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-background text-white">
            <aside className="w-64 bg-slate-900 p-6 border-r border-slate-700 flex flex-col">
                <div className="mb-8 flex items-center gap-3">
                    <LayoutDashboard className="text-primary w-6 h-6" />
                    <div>
                        <h2 className="text-xl font-bold text-primary">SwasPanel</h2>
                        <p className="text-xs text-slate-400">Smart Workspace</p>
                    </div>
                </div>

                {onCreateTableClick && (
                    <button
                        type="button"
                        onClick={onCreateTableClick}
                        className="w-full mb-4 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-sm text-sm"
                    >
                        + Buat Tabel
                    </button>
                )}

                <div className="space-y-2 flex-1 overflow-y-auto">
                    {tables.map((table) => (
                        <div key={table} className="flex items-center justify-between group">
                            <button
                                type="button"
                                onClick={() => onSelect(table)}
                                className={`flex-1 text-left px-4 py-2 rounded font-medium ${
                                    selected === table
                                        ? "bg-primary text-white"
                                        : "bg-slate-700 hover:bg-slate-600"
                                }`}
                            >
                                {table}
                            </button>
                            {onDeleteTable && (
                                <button
                                    type="button"
                                    onClick={() => onDeleteTable(table)}
                                    className="ml-2 p-1 text-red-400 hover:text-red-600"
                                    title={`Hapus tabel ${table}`}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={async () => {
                        await fetch("/api/logout");
                        window.location.href = "/login";
                    }}
                    className="mt-4 px-4 py-2 rounded-sm bg-red-600 hover:bg-red-700 text-white text-sm"
                >
                    Logout
                </button>

                <div className="mt-8 text-xs text-slate-500 text-center">
                    &copy; {new Date().getFullYear()} Stegripe Development
                </div>
            </aside>

            <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
    );
}
