import { Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import CreatePostCard from "./CreatePostCard";
import { PostsList } from "./PostsList";
import { useCurrentUser } from "../../contexts/UserContextProvider";
import { Fetchable, FullSubscription } from "../../models/types";
import SubscriptionHeader from "./SubscriptionHeader";
import usePosts from "../../hooks/usePosts";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function ManageSubscription({
  subscription,
}: {
  subscription?: Fetchable<FullSubscription>;
}) {
  const wallet = useWallet();
  const modal = useWalletModal();
  const { user, signIn } = useCurrentUser();
  const posts = usePosts(subscription?.data?.subscription?.tokenMint);

  return (
    <Flex gap="2" direction="column">
      <Container>
        <SubscriptionHeader subscription={subscription} />
      </Container>
      <Flex gap={"3"} direction={"column"} mt="5">
        {user ? (
          <>
            <Heading align="center">
              {subscription?.data?.saloon?.metadata?.name}&apos;s feed
            </Heading>
            {user?.publicKey &&
            ((subscription?.data?.subscription?.currentOwner &&
              subscription?.data?.subscription.currentOwner?.publicKey ===
                user?.publicKey) ||
              (subscription?.data?.saloon?.owner?.publicKey &&
                subscription?.data?.saloon.owner.publicKey ===
                  user?.publicKey)) ? (
              <CreatePostCard
                subscription={subscription}
                reload={async () => {
                  subscription.reload();
                  posts.reload();
                }}
              />
            ) : null}
            {user?.publicKey === subscription?.data?.ownerBidState?.bidder ||
            user?.publicKey === subscription?.data?.saloon?.owner.publicKey ? (
              <PostsList subscription={subscription} posts={posts} />
            ) : (
              <Text size="5" align="center" m="5">
                Buy this subscription to see posts
              </Text>
            )}
          </>
        ) : wallet?.connected ? (
          <Flex justify="center">
            <Button onClick={signIn}>sign in to access features</Button>
          </Flex>
        ) : (
          <Flex justify="center">
            <Button onClick={() => modal.setVisible(true)}>
              connect to access features
            </Button>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}
