import {
  Button,
  Card,
  Table,
  Badge,
  Text,
  Flex,
  Heading,
  Box,
  Container,
} from "@radix-ui/themes";
import InfiniteScroll from "react-infinite-scroll-component";
import { Fetchable, FullSubscription, Post } from "../../models/types";
import dynamic from "next/dynamic";
import { formatTime, shortKey } from "../../utils";
import { useCurrentUser } from "../../contexts/UserContextProvider";
import UserBadge from "../../components/UserBadge";

const MarkdownPreview = dynamic(
  () => import("@uiw/react-markdown-preview").then((mod) => mod.default),
  { ssr: false }
);

export const PostsList = ({
  subscription,
}: {
  subscription: Fetchable<FullSubscription>;
}) => {
  document.documentElement.setAttribute("data-color-mode", "light");
  const { user } = useCurrentUser();
  const posts = subscription.posts;

  return (
    <>
      <InfiniteScroll
        dataLength={posts?.length} //This is important field to render the next data
        next={subscription.fetchNextPage}
        hasMore={true}
        loader={<h4>Loading...</h4>}
        endMessage={
          <p style={{ textAlign: "center" }}>
            <b>Yay! You have seen it all</b>
          </p>
        }
        // below props only if you need pull down functionality
        // refreshFunction={this.refresh}
        // pullDownToRefresh
        // pullDownToRefreshThreshold={50}
        // pullDownToRefreshContent={
        //   <h3 style={{ textAlign: "center" }}>&#8595; Pull down to refresh</h3>
        // }
        // releaseToRefreshContent={
        //   <h3 style={{ textAlign: "center" }}>&#8593; Release to refresh</h3>
        // }
      >
        {posts.map((post) => (
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
        ))}
      </InfiniteScroll>
    </>
  );
};
