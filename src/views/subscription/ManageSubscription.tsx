import { Container, Flex, Heading, Text } from "@radix-ui/themes";
import CreatePostCard from "./CreatePostCard";
import { PostsList } from "./PostsList";
import { useCurrentUser } from "../../contexts/UserContextProvider";
import { Fetchable, FullSubscription } from "../../models/types";
import SubscriptionHeader from "./SubscriptionHeader";

export default function ManageSubscription({
  subscription,
}: {
  subscription?: Fetchable<FullSubscription>;
}) {
  const { user } = useCurrentUser();

  return (
    <Flex gap="2" direction="column">
      <Container>
        <SubscriptionHeader subscription={subscription} />
      </Container>
      <Flex gap={"3"} direction={"column"} mt="5">
        <Heading align="center">
          {subscription?.saloon?.metadata?.name}&apos;s feed
        </Heading>
        {user?.publicKey &&
        ((subscription.subscription?.currentOwner &&
          subscription.subscription.currentOwner.publicKey ===
            user.publicKey) ||
          (subscription.saloon?.owner?.publicKey &&
            subscription.saloon.owner.publicKey === user.publicKey)) ? (
          <CreatePostCard subscription={subscription} />
        ) : null}
        {subscription?.posts && subscription.posts.length > 0 ? (
          <PostsList subscription={subscription} />
        ) : (
          <Text size="5" align="center" m="5">
            Buy this subscription to see posts
          </Text>
        )}
      </Flex>
    </Flex>
  );
}
