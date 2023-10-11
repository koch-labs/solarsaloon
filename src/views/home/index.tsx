// Next, React
import { FC, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";
import Link from "next/link";
import { CirclesSvg } from "./svgs";
import LazyShow from "../../components/LazyShow";

export const HomeView: FC = ({}) => {
  return (
    <Box className="relative overflow-x-hidden">
      <LazyShow>
        <Flex className="absolute z-0 sm:inset-0 -inset-x-1/2" justify="center">
          <CirclesSvg />
        </Flex>
      </LazyShow>
      <LazyShow>
        <Flex align="center" direction="column" p="3">
          <Flex
            align="center"
            direction="column"
            gap="2"
            className="mt-64 max-w-md z-10"
          >
            <Flex direction={"column"}>
              <Heading size="9">saloons</Heading>
              <Text weight="medium">
                saloons are exclusive spaces
                <br />
              </Text>
              <Text>
                saloon owners can create exclusive members-only content and get
                fairly paid for it.
              </Text>
            </Flex>
            <Flex gap="3">
              <Link href={"/saloon/create"}>
                <Button color="gray">create a saloon</Button>
              </Link>
              <Link href={"/saloons"}>
                <Button color="gray" highContrast>
                  browse saloons
                </Button>
              </Link>
            </Flex>
          </Flex>
        </Flex>
      </LazyShow>
      <LazyShow>
        <Flex
          align="center"
          className="max-w-4xl my-96 m-auto px-5 grid grid-cols-2 z-30"
        >
          <Flex className="col-span-1" direction="column" align="center">
            <Heading size="9" align="center">
              always <br /> connected
            </Heading>
          </Flex>
          <Flex className="col-span-1" direction="column" align="center">
            <Text>
              once you found the saloons that fit you best, you can stay of top
              of the news, thanks to in-wallet notifications. not only you will
              get the freshest content, you can also post and may influence your
              favorite creators.
            </Text>
          </Flex>
        </Flex>
      </LazyShow>
    </Box>
  );
};
