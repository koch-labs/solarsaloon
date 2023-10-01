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
import { FullSubscription } from "../../hooks/useSubscription";
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
    <Card>
      <Flex direction="column" gap="2">
        <Heading size={"3"}>Create a post</Heading>
        <MDEditor value={content} onChange={setContent} />
        <Flex justify="center" gap="4">
          <Button onClick={handlePost}>Create post</Button>
        </Flex>
      </Flex>
    </Card>
  );
}
