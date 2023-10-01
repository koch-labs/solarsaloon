import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";
import NavigationPath from "../components/NavigationPath";

const Saloons: NextPage = (props) => {
  return (
    <>
      <Head>
        <title>Saloons | Solar Saloon</title>
        <meta name="description" content="Solar Saloon" />
      </Head>
      <NavigationPath
        path={[
          { href: "/", name: "home" },
          { href: "/saloons", name: "saloons list" },
        ]}
      />
      <HomeView />
    </>
  );
};

export default Saloons;
