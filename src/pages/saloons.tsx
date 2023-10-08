import type { NextPage } from "next";
import Head from "next/head";
import NavigationPath from "../components/NavigationPath";
import { SaloonsListView } from "../views/saloon/SaloonsListView";

const Saloons: NextPage = () => {
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
      <SaloonsListView />
    </>
  );
};

export default Saloons;
