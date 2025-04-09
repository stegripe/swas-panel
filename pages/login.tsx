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
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md w-80">
                <h1 className="text-xl mb-4">Login</h1>
                <input
                    type="text"
                    placeholder="Email"
                    className="w-full mb-2 p-2 border"
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="w-full mb-4 p-2 border"
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button onClick={handleLogin} className="w-full bg-blue-500 text-white p-2 rounded">
                    Login
                </button>
            </div>
        </div>
    );
}
