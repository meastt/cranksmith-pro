// pages/_app.js
import '../styles/pro.css';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>CrankSmith Pro - Professional Drivetrain Analysis</title>
        <meta name="viewport" content="width=1400, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}