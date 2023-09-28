import {
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Text,
  TextFieldInput,
  TextArea,
} from "@radix-ui/themes";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useCurrentUser } from "../../contexts/UserContextProvider";
import useSaloon, { Fetchable } from "../../hooks/useSaloon";
import Image from "next/image";
import { Saloon } from "../../models/types";

const SaloonView: React.FC<{ saloon: Fetchable<Saloon> }> = ({ saloon }) => {
  const router = useRouter();
  const { token } = useCurrentUser();
  const [url, setUrl] = useState<string>(saloon.metadata?.image);
  const [name, setName] = useState<string>(saloon.metadata?.name);
  const [description, setDescription] = useState<string>(
    saloon.metadata?.description
  );

  const handleSave = useCallback(async () => {
    await fetch(`/api/saloon/${saloon.collectionMint}/edit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        mint: saloon.collectionMint,
        image: url,
        name,
        description,
      }),
    });
    router.push(`/saloon/${saloon.collectionMint}`);
  }, [description, name, url, saloon, token, router]);

  return (
    <Container>
      <Flex
        justify="center"
        align="center"
        gap="2"
        direction="column"
        width="min-content"
        className="m-auto"
      >
        <Card>
          <Flex
            gap={"3"}
            direction={"column"}
            align="center"
            justify={"center"}
          >
            <Flex
              align="center"
              justify="center"
              direction="column"
              gap="3"
              width={"min-content"}
            >
              <Heading align="center">Edit the saloon</Heading>
              <Card>
                <Flex direction="column" gap="1" width="max-content">
                  <Image
                    src={saloon.metadata?.image}
                    width="250"
                    height="250"
                    alt={saloon.metadata?.name}
                  />
                  <Text weight="medium">Set a new image URL</Text>
                  <TextFieldInput
                    onChange={(e) => setUrl(e.target.value)}
                    defaultValue={url}
                  />
                </Flex>
              </Card>
              <Flex direction="column" gap="1" width={"100%"}>
                <Card>
                  <Text weight="medium">Set a new name</Text>
                  <TextFieldInput
                    onChange={(e) => setName(e.target.value)}
                    defaultValue={name}
                  />
                </Card>
              </Flex>
              <Flex direction="column" gap="1" className="w-full">
                <Card>
                  <Text weight="medium">Set a new description</Text>
                  <TextArea
                    onChange={(e) => setDescription(e.target.value)}
                    defaultValue={description}
                  />
                </Card>
              </Flex>
              <Flex gap={"3"}>
                <Button color="crimson" onClick={router.back}>
                  Cancel
                </Button>
                <Button color="green" onClick={handleSave}>
                  Save
                </Button>
              </Flex>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
};

export default SaloonView;
