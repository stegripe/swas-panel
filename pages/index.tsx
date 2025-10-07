import { useEffect, useState } from "react";
import MonitoringAbsensi from "../components/MonitoringAbsensi";
import FloatingLoader from "../components/FloatingLoader";

export default function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        fetch("/api/login", { method: "GET" })
            .then((res) => (res.ok ? setIsLoggedIn(true) : setIsLoggedIn(false)))
            .catch(() => setIsLoggedIn(false));
    }, []);

    if (isLoggedIn === null) return (
        <div className="min-h-screen bg-background">
            <FloatingLoader isLoading={true} message="Checking authentication..." />
        </div>
    );

    if (isLoggedIn) {
        if (typeof window !== "undefined") {
            window.location.href = "/dashboard";
        }
        return null;
    }

    return <MonitoringAbsensi />;
}
