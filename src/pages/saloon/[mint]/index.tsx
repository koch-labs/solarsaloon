import { useRouter } from "next/router";
import useSaloon from "../../../hooks/useSaloon";
import SaloonView from "../../../views/saloon/SaloonView";

const SingleSaloonView: React.FC = () => {
  const router = useRouter();
  const saloonMint = router.query.mint as string;
  const saloon = useSaloon(saloonMint);
  return saloon ? <SaloonView saloon={saloon} /> : null;
};

export default SingleSaloonView;
