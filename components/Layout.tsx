import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md p-4">
                <h2 className="text-xl font-bold mb-4">Swas Panel</h2>
                <div id="sidebar-content" className="flex flex-col gap-2 text-sm text-gray-700">
                    {/* Sidebar content diisi dari dashboard */}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
    );
}
