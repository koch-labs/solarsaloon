import { Container, Flex, Heading, Text } from "@radix-ui/themes";
import CreatePostCard from "./CreatePostCard";
import { PostsList } from "./PostsList";
import { useCurrentUser } from "../../contexts/UserContextProvider";
import { Fetchable, FullSubscription } from "../../models/types";
import SubscriptionHeader from "./SubscriptionHeader";
import usePosts from "../../hooks/usePosts";

export default function ManageSubscription({
  subscription,
}: {
  subscription?: Fetchable<FullSubscription>;
}) {
  const { user } = useCurrentUser();
  const posts = usePosts(subscription?.data?.subscription?.tokenMint);

  return (
    <Flex gap="2" direction="column">
      <Container>
        <SubscriptionHeader subscription={subscription} />
      </Container>
      <Flex gap={"3"} direction={"column"} mt="5">
        <Heading align="center">
          {subscription?.data?.saloon?.metadata?.name}&apos;s feed
        </Heading>
        {user?.publicKey &&
        ((subscription?.data?.subscription?.currentOwner &&
          subscription?.data?.subscription.currentOwner?.publicKey ===
            user?.publicKey) ||
          (subscription?.data?.saloon?.owner?.publicKey &&
            subscription?.data?.saloon.owner.publicKey === user?.publicKey)) ? (
          <CreatePostCard subscription={subscription} reload={posts.reload} />
        ) : null}
        {user?.publicKey === subscription?.data?.ownerBidState?.bidder ||
        user?.publicKey === subscription?.data?.saloon?.owner.publicKey ? (
          <PostsList subscription={subscription} posts={posts} />
        ) : (
          <Text size="5" align="center" m="5">
            Buy this subscription to see posts
          </Text>
        )}
      </Flex>
    </Flex>
  );
}
