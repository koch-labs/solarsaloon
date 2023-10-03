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

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

export default function CreatePostCard({
  subscription,
}: {
  subscription: Fetchable<FullSubscription>;
}) {
  const { token } = useCurrentUser();
  const [content, setContent] = useState<string>();

  const handlePost = useCallback(async () => {
    await fetch(`/api/create/post`, {
      method: "POST",
      body: JSON.stringify({
        tokenMint: subscription.subscription.tokenMint,
        collectionMint: subscription.saloon.collectionMint,
        content,
      }),
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    subscription.reload();
    setContent("");
  }, [subscription, content, token]);

  return (
    <Flex m="5" direction="column" gap="2">
      <Heading size={"3"}>write your next post:</Heading>
      <Card>
        <MDEditor value={content} onChange={setContent} color="gray" />
      </Card>
      <Flex justify="center" gap="4">
        <Button onClick={handlePost}>create a post</Button>
      </Flex>
    </Flex>
  );
}
