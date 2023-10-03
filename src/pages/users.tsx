import type { NextPage } from "next";
import Head from "next/head";
import { UsersListView } from "../views/user/UsersListView";
import NavigationPath from "../components/NavigationPath";

const Users: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Users | Solar Saloon</title>
        <meta name="description" content="Solar Saloon" />
      </Head>
      <NavigationPath
        path={[
          { href: "/", name: "home" },
          { href: "/users", name: "users list" },
        ]}
      />
      <UsersListView />
    </div>
  );
};

export default Users;
