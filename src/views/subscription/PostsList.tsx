import {
  Button,
  Card,
  Table,
  Badge,
  Text,
  Flex,
  Heading,
} from "@radix-ui/themes";
import { Post } from "../../models/types";
import dynamic from "next/dynamic";

const MarkdownPreview = dynamic(
  () => import("@uiw/react-markdown-preview").then((mod) => mod.default),
  { ssr: false }
);

export const PostsList = ({ posts }: { posts: Post[] }) => {
  document.documentElement.setAttribute("data-color-mode", "light");
  return (
    <Card>
      <Heading align="center" size="5">
        Posts
      </Heading>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Sender</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Content</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body className="align-middle">
          {posts.map((p) => (
            <Table.Row key={`${p.id}-${p.creationTimestamp}`}>
              <Table.RowHeaderCell>
                <Flex gap={"2"}>
                  <Text>{p.creatorId}</Text>
                </Flex>
              </Table.RowHeaderCell>
              <Table.Cell>
                <MarkdownPreview source={p.content || ""} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Card>
  );
};