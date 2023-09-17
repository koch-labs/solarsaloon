import { AppProps } from "next/app";
import Head from "next/head";
import { FC } from "react";
import { ContextProvider } from "../contexts/ContextProvider";
import Notifications from "../components/Notification";
import "@solana/wallet-adapter-react-ui/styles.css";
import "@radix-ui/themes/styles.css";
import "../styles/globals.css";
import Layout from "../components/Layout";

const App: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>Solana Scaffold Lite</title>
      </Head>

      <ContextProvider>
        <Layout>
          <Notifications />
          <Component {...pageProps} />
        </Layout>
      </ContextProvider>
    </>
  );
};

export default App;
