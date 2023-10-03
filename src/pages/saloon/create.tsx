import Head from "next/head";
import NavigationPath from "../../components/NavigationPath";
import CreateSaloon from "../../views/saloon/CreateSaloon";

const CreateSaloonPage = () => {
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
      <CreateSaloon />
    </>
  );
};

export default CreateSaloonPage;
