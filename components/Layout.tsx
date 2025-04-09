import React, { useState } from "react";
import { LayoutDashboard, Menu } from "lucide-react";

interface Props {
    children: React.ReactNode;
    tables: string[];
    selected: string | null;
    onSelect: (name: string) => void;
}

export default function Layout({ children, tables, selected, onSelect }: Props) {
    const [showSidebar, setShowSidebar] = useState(false);

    const handleCreateTable = async () => {
        const tableName = prompt("Enter table name:");
        if (tableName) {
            const res = await fetch(`/api/create-table`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ table: tableName }),
            });
            if (res.ok) {
                const data = await res.json();
                console.log("Table created:", data);
            } else {
                const error = await res.json();
                console.error("Error creating table:", error);
            }
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-background text-white">
            {/* Mobile topbar */}
            <div className="md:hidden flex justify-between items-center p-4 bg-slate-900 border-b border-slate-700">
                <h2 className="text-lg font-bold text-primary">SwasPanel</h2>
                <button onClick={() => setShowSidebar(!showSidebar)}>
                    <Menu className="w-6 h-6 text-white" />
                </button>
            </div>

            {/* Sidebar */}
            <aside
                className={`fixed z-20 md:static top-0 left-0 h-full w-64 bg-slate-900 p-6 border-r border-slate-700 transform ${
                    showSidebar ? "translate-x-0" : "-translate-x-full"
                } md:translate-x-0 transition-transform duration-200 ease-in-out`}
            >
                {/* Branding */}
                <div className="mb-8 flex items-center gap-3">
                    <LayoutDashboard className="text-primary w-6 h-6" />
                    <div>
                        <h2 className="text-xl font-bold text-primary">SwasPanel</h2>
                        <p className="text-xs text-slate-400">Smart Workspace</p>
                    </div>
                </div>

                {/* Menu Tables */}
                <div className="space-y-2 flex-1 overflow-y-auto">
                    <button
                        onClick={handleCreateTable}
                        className="w-full text-left px-4 py-2 rounded font-medium bg-green-600 hover:bg-green-700"
                    >
                        <div className="flex items-center gap-2">
                            Create Table
                        </div>
                    </button>
                    {tables.map((table) => (
                        <button
                            key={table}
                            onClick={() => {
                                onSelect(table);
                                setShowSidebar(false); // auto close on mobile
                            }}
                            className={`w-full text-left px-4 py-2 rounded font-medium ${
                                selected === table
                                    ? "bg-primary text-white"
                                    : "bg-slate-700 hover:bg-slate-600"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                                {table}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-8 text-xs text-slate-500 text-center hidden md:block">
                    &copy; {new Date().getFullYear()} SwasPanel
                </div>
            </aside>

            {/* Overlay for mobile */}
            {showSidebar && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
                    onClick={() => setShowSidebar(false)}
                ></div>
            )}

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-auto mt-4 md:mt-0 z-0">{children}</main>
        </div>
    );
}
