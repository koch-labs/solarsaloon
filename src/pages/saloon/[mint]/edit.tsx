import { useRouter } from "next/router";
import useSaloon from "../../../hooks/useSaloon";
import EditSaloonView from "../../../views/saloon/EditSaloonView";
import NavigationPath from "../../../components/NavigationPath";
import Head from "next/head";

const EditSaloonPage: React.FC = () => {
  const router = useRouter();
  const saloonMint = router.query.mint as string;
  const saloon = useSaloon(saloonMint);
  return (
    <div>
      <Head>
        <title>Edit the saloon | Solar Saloon</title>
        <meta name="description" content="Solar Saloon" />
      </Head>
      <NavigationPath
        path={[
          { href: "/", name: "home" },
          { href: "/saloons", name: "saloons list" },
          saloon
            ? {
                href: `/saloon/${saloon.data?.collectionMint}/edit`,
                name: `${saloon.data?.metadata.name}`,
              }
            : undefined,
        ].filter(Boolean)}
      />
      {saloon ? <EditSaloonView saloon={saloon} /> : null}
    </div>
  );
};

export default EditSaloonPage;
