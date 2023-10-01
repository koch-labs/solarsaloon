import { useRouter } from "next/router";
import UserView from "../../views/user/UserView";
import NavigationPath from "../../components/NavigationPath";
import Head from "next/head";

const UserPage: React.FC = () => {
  const router = useRouter();
  const publicKey = router.query.key as string;
  return (
    <>
      <Head>
        <title>Create a saloon | Solar Saloon</title>
        <meta name="description" content="Solar Saloon" />
      </Head>
      <NavigationPath
        path={[
          { href: "/", name: "home" },
          { href: "/saloons", name: "users list" },
          { href: `/${publicKey}`, name: "user" },
        ]}
      />
      <UserView publicKey={publicKey} />
    </>
  );
};

export default UserPage;
