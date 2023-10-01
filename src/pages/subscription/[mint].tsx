import { useRouter } from "next/router";
import ManageSubscription from "../../views/subscription/ManageSubscription";
import Head from "next/head";
import NavigationPath from "../../components/NavigationPath";
import useSubscription from "../../hooks/useSubscription";

const ManageSubscriptionPage = () => {
  const router = useRouter();
  const { mint } = router.query;
  const subscription = useSubscription(mint as string);
  return (
    <>
      <Head>
        <title>Create a saloon | Solar Saloon</title>
        <meta name="description" content="Solar Saloon" />
      </Head>
      <NavigationPath
        path={[
          { href: "/", name: "home" },
          { href: "/saloons", name: "saloons list" },
          { href: "/create", name: "create" },
        ]}
      />
      <ManageSubscription subscription={subscription} />
    </>
  );
};

export default ManageSubscriptionPage;
