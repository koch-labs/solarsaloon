import { useRouter } from "next/router";
import useSaloon from "../../../hooks/useSaloon";
import SaloonView from "../../../views/saloon/SaloonView";
import Head from "next/head";
import NavigationPath from "../../../components/NavigationPath";

const SingleSaloonView: React.FC = () => {
  const router = useRouter();
  const saloonMint = router.query.mint as string;
  const saloon = useSaloon(saloonMint);
  return (
    <div>
      <Head>
        <title>
          {saloon?.data.metadata?.name || "Unknown saloon"} | Solar Saloon
        </title>
        <meta name="description" content="Solar Saloon" />
      </Head>
      <NavigationPath
        path={[
          { href: "/", name: "home" },
          { href: "/saloons", name: "saloons list" },
          saloon
            ? {
                href: `/saloon/${saloon?.data.collectionMint}/edit`,
                name: `${saloon?.data.metadata.name}`,
              }
            : undefined,
        ].filter(Boolean)}
      />
      {saloon ? <SaloonView saloon={saloon} /> : null}
    </div>
  );
};

export default SingleSaloonView;
