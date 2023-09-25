import { useRouter } from "next/router";
import useSaloon from "../../../hooks/useSaloon";
import EditSaloonView from "../../../views/saloon/EditSaloonView";

const EditSaloonPage: React.FC = () => {
  const router = useRouter();
  const saloonMint = router.query.mint as string;
  const saloon = useSaloon(saloonMint);
  return saloon ? <EditSaloonView saloon={saloon} /> : null;
};

export default EditSaloonPage;
