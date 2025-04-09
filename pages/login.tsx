import { useState } from "react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
            document.cookie = "token=1"; // dummy token
            window.location.href = "/dashboard";
        } else {
            alert("Login gagal");
        }
    };

    return (
        <div className="min-h-screen flex justify-center items-center bg-background text-white">
            <div className="bg-surface p-8 rounded-xl shadow-lg w-[320px]">
                <h1 className="text-2xl font-semibold mb-6 text-center text-primary">
                    Login Admin
                </h1>
                <input
                    type="text"
                    placeholder="Email"
                    className="w-full mb-4 p-2 rounded bg-slate-800 border border-slate-600 text-white"
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="w-full mb-6 p-2 rounded bg-slate-800 border border-slate-600 text-white"
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    onClick={handleLogin}
                    className="w-full bg-primary hover:bg-primary.light text-white p-2 rounded font-medium"
                >
                    Login
                </button>
            </div>
        </div>
    );
}
