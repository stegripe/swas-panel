import { useEffect, useState } from "react";
import MonitoringAbsensi from "../components/MonitoringAbsensi";

export default function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        fetch("/api/login", { method: "GET" })
            .then((res) => (res.ok ? setIsLoggedIn(true) : setIsLoggedIn(false)))
            .catch(() => setIsLoggedIn(false));
    }, []);

    if (isLoggedIn === null) return <div className="p-8">Loading...</div>;

    if (isLoggedIn) {
        if (typeof window !== "undefined") {
            window.location.href = "/dashboard";
        }
        return null;
    }

    return <MonitoringAbsensi />;
}
