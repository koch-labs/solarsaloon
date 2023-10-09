import {
  Badge,
  Button,
  Card,
  Checkbox,
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { FullSubscription } from "../../models/types";
import { useCurrentUser } from "../../contexts/UserContextProvider";
import { Fetchable } from "../../models/types";
import toast from "react-hot-toast";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

export default function CreatePostCard({
  subscription,
  reload,
}: {
  subscription: Fetchable<FullSubscription>;
  reload: () => {};
}) {
  const { token } = useCurrentUser();
  const [content, setContent] = useState<string>();
  const timeUntilNextPost =
    Date.now() -
    new Date(subscription?.data?.subscription?.lastPost).valueOf() -
    Number(subscription?.data?.saloon?.postCooldown) * 1000;
  console.log(
    timeUntilNextPost,
    Date.now() - new Date(subscription?.data?.subscription?.lastPost).valueOf(),
    subscription?.data?.saloon?.postCooldown,
    new Date(subscription?.data?.subscription?.lastPost).valueOf()
  );

  const handlePost = useCallback(async () => {
    try {
      console.log("ok");
      await fetch(`/api/create/post`, {
        method: "POST",
        body: JSON.stringify({
          tokenMint: subscription?.data.subscription?.tokenMint,
          collectionMint: subscription?.data.saloon.collectionMint,
          content,
        }),
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      reload();
      setContent("");
    } catch (err) {
      toast.error(err);
      console.log(err);
    }
  }, [subscription, reload, content, token]);

  return (
    <Flex m="5" direction="column" gap="2">
      <Heading size={"3"}>write your next post:</Heading>
      <Card>
        <MDEditor value={content} onChange={setContent} color="gray" />
      </Card>
      <Flex justify="center" gap="4">
        <Button onClick={() => handlePost()} disabled={timeUntilNextPost > 0}>
          create a post
        </Button>
      </Flex>
    </Flex>
  );
}
