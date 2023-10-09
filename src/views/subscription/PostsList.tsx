import {
  Badge,
  Text,
  Flex,
  Heading,
  Container,
  Separator,
} from "@radix-ui/themes";
import InfiniteScroll from "react-infinite-scroller";
import { Fetchable, FullSubscription, Post } from "../../models/types";
import dynamic from "next/dynamic";
import { formatTime } from "../../utils";
import { useCurrentUser } from "../../contexts/UserContextProvider";
import UserBadge from "../../components/UserBadge";

const MarkdownPreview = dynamic(
  () => import("@uiw/react-markdown-preview").then((mod) => mod.default),
  { ssr: false }
);

export const PostsList = ({
  subscription,
  posts,
}: {
  subscription: Fetchable<FullSubscription>;
  posts: Fetchable<Post[]>;
}) => {
  document.documentElement.setAttribute("data-color-mode", "light");
  const { user } = useCurrentUser();

  const arrivalIndex = posts?.data
    ?.map(
      (p) =>
        new Date(p.creationTimestamp).valueOf() >
        new Date(
          subscription?.data?.subscription?.ownerChangedTimestamp
        ).valueOf()
    )
    .indexOf(false);

  return (
    <InfiniteScroll
      page={0}
      loadMore={posts?.fetchMore}
      hasMore={posts?.hasMore}
      loading={<Heading>Fetching more</Heading>}
    >
      {posts?.data?.map((post, index) => (
        <>
          {index === arrivalIndex ? (
            <Flex
              key={post.id + post.creationTimestamp + "separator"}
              align="center"
              justify="between"
            >
              <Separator orientation="horizontal" size="4" />
              <Badge color="gray">Subscription holder changed here</Badge>
              <Separator orientation="horizontal" size="4" />
            </Flex>
          ) : null}
          <Flex
            key={post.id + post.creationTimestamp}
            direction="column"
            align={
              post?.creator.publicKey !== user?.publicKey ? "start" : "end"
            }
          >
            <Container color="red" m={"3"} size={"3"}>
              <Flex direction="column" gap="2">
                <MarkdownPreview
                  source={post.content}
                  className="bg-brand-gray-2 p-5 rounded-xl"
                />
                <Flex gap="1" align="center">
                  <UserBadge user={post.creator} />
                  <Text size={"2"}>
                    {formatTime(
                      Date.now() -
                        (new Date(post.creationTimestamp).valueOf() + 7200000)
                    )}{" "}
                    ago
                  </Text>
                </Flex>
              </Flex>
            </Container>
          </Flex>
        </>
      ))}
    </InfiniteScroll>
  );
};
