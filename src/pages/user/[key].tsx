import { useRouter } from "next/router";
import UserView from "../../views/user/UserView";

const UserPage: React.FC = () => {
  const router = useRouter();
  const publicKey = router.query.key as string;
  return <UserView publicKey={publicKey} />;
};

export default UserPage;
