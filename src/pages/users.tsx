import type { NextPage } from "next";
import Head from "next/head";
import { UsersListView } from "../views/user/UsersListView";

const Users: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Users | Solar Saloon</title>
        <meta name="description" content="Solar Saloon" />
      </Head>
      <UsersListView />
    </div>
  );
};

export default Users;
