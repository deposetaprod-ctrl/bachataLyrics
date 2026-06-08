import Head from 'next/head';
import Canonical from '../components/Canonical';
import Tracker from '../components/Tracker';
import '../styles/globals.css';
import { Analytics } from "@vercel/analytics/react"


export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover" />
      </Head>
      <Canonical />
      <Tracker />
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
