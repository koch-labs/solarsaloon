import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div className="relative overflow-x-hidden">
      <Head>
        <title>Solar Saloon</title>
        <meta name="description" content="Solar Saloon" />
      </Head>
      <HomeView />
    </div>
  );
};

export default Home;
