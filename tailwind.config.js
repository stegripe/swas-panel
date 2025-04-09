/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#1e40af",
                    light: "#3b82f6",
                    dark: "#1e3a8a",
                },
                background: "#0f172a",
                surface: "#1e293b",
            },
        },
    },
    plugins: [],
};
