import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";

const Saloons: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Saloons | Solar Saloon</title>
        <meta name="description" content="Solar Saloon" />
      </Head>
      <HomeView />
    </div>
  );
};

export default Saloons;
