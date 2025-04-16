import { useState } from "react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
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
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 mb-4 rounded bg-slate-800 border border-slate-600 text-white"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 mb-6 rounded bg-slate-800 border border-slate-600 text-white"
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
