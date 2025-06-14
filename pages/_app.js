import '../styles/globals.css';  // <-- this file contains your @tailwind directives
import Layout from '../components/Layout';

export default function CrankSmithApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
