import React from "react";

interface Props {
  children: React.ReactNode;
  tables: string[];
  selected: string | null;
  onSelect: (name: string) => void;
}

export default function Layout({ children, tables, selected, onSelect }: Props) {
  return (
    <div className="flex min-h-screen bg-background text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 p-6 border-r border-slate-700 flex flex-col">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary tracking-wide">
            Swas<span className="text-white">Panel</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Smart Workspace Dashboard</p>
        </div>
        <div className="space-y-2 flex-1 overflow-y-auto">
          {tables.map((table) => (
            <button
              key={table}
              onClick={() => onSelect(table)}
              className={`w-full text-left px-4 py-2 rounded font-medium ${
                selected === table
                  ? "bg-primary text-white"
                  : "bg-slate-700 hover:bg-slate-600"
              }`}
            >
              {table}
            </button>
          ))}
        </div>
        <div className="mt-8 text-xs text-slate-500 text-center">
          &copy; {new Date().getFullYear()} SwasPanel
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
