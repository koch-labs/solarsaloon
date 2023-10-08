import { Button, Card, Container, Flex, Heading, Text } from "@radix-ui/themes";
import Link from "next/link";

export const CreateSaloonCard = () => {
  return (
    <Container size={"3"}>
      <Card>
        <Flex
          direction="column"
          align="center"
          gap="2"
          my={"3"}
          color="crimson"
        >
          <Text align="center">
            Your saloon is your members-only room.
            <br />
            Publish exclusive content for a limited number of paid members.
          </Text>
          <Link href="/saloon/create">
            <Button className="bg-crimson-200">create a saloon</Button>
          </Link>
        </Flex>
      </Card>
    </Container>
  );
};
