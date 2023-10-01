import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";
import NavigationPath from "../components/NavigationPath";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Solar Saloon</title>
        <meta name="description" content="Solar Saloon" />
      </Head>
      <NavigationPath path={[{ href: "/", name: "home" }]} />
      <HomeView />
    </div>
  );
};

export default Home;
