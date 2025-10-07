import "../styles/globals.css"; // WAJIB baris ini

import { type AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />;
}
