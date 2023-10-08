import { AppProps } from "next/app";
import Head from "next/head";
import { FC } from "react";
import { ContextProvider } from "../contexts/ContextProvider";
import "@solana/wallet-adapter-react-ui/styles.css";
import "@radix-ui/themes/styles.css";
import "../styles/globals.css";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import Layout from "../components/Layout";

const App: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>Solar Saloon</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ContextProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ContextProvider>
    </>
  );
};

export default App;
