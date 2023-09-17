import type { NextPage } from "next";
import Head from "next/head";
import { BasicsView } from "../views";

const Basics: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Basics | Solar Saloon</title>
        <meta name="description" content="Solar Saloon" />
      </Head>
      <BasicsView />
    </div>
  );
};

export default Basics;
