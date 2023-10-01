import { Button, Card, Container, Flex, Heading, Text } from "@radix-ui/themes";
import Link from "next/link";

export const CreateSaloonCard = () => {
  return (
    <Container size={"3"}>
      <Card>
        <Flex direction="column" align="center" gap="2" my={"3"}>
          <Text align="center">
            Your saloon is the place where people come to hear about YOU.
            <br />
            Publish exclusive content in here to attract a limited number of
            paid members.
          </Text>
          <Link href="/saloon/create">
            <Button>create a saloon</Button>
          </Link>
        </Flex>
      </Card>
    </Container>
  );
};
