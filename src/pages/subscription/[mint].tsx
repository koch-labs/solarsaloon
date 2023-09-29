import { useRouter } from "next/router";
import ManageSubscription from "../../views/subscription/ManageSubscription";

const ManageSubscriptionPage = () => {
  const router = useRouter();
  const { mint } = router.query;
  return <ManageSubscription mint={mint as string} />;
};

export default ManageSubscriptionPage;
