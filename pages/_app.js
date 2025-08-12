import { SessionProvider } from "next-auth/react";
import { UserProvider } from "../context/UserContext";
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import Head from 'next/head';
import ErrorBoundary from "../components/ErrorBoundary";

// Lazy load المكونات غير الحرجة لتحسين الأداء
const Layout = dynamic(() => import("../components/Layout").then(mod => ({ default: mod.LayoutWithErrorHandling })), {
  loading: () => <div className="min-h-screen bg-slate-900 animate-pulse" />,
  ssr: true
});

const ToastProvider = dynamic(() => import("../components/Toast"), {
  loading: () => null,
  ssr: false
});

const AudioProvider = dynamic(() => import("../components/AudioProvider"), {
  loading: () => null,
  ssr: false
});

// تحسين CSS loading
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  return (
    <ErrorBoundary componentName="App">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <SessionProvider session={pageProps.session}>
        <UserProvider>
          <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
            <Layout>
              <Component {...pageProps} />
            </Layout>
            <AudioProvider />
            <ToastProvider />
          </Suspense>
        </UserProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}

export default MyApp;