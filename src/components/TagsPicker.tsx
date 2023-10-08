import React, { useState } from "react";
import { CaretDownIcon, Cross2Icon, ReloadIcon } from "@radix-ui/react-icons";
import {
  Badge,
  Button,
  Container,
  DropdownMenu,
  Flex,
  IconButton,
  Text,
} from "@radix-ui/themes";
import { ButtonProps } from "@radix-ui/themes/dist/cjs/components/button";
import { PlusIcon } from "@heroicons/react/24/outline";

export const ALL_TAGS: string[] = [
  "freelance",
  "art",
  "alpha",
  "finance",
  "design",
  "meme",
  "nft",
];

export default function TagsPicker({
  tags,
  edit,
  setTags,
}: {
  edit?: boolean;
  tags: string[];
  setTags?: (tags: string[]) => void;
}) {
  return (
    <Flex wrap="wrap" gap="1">
      {tags.map((tag) => (
        <Badge key={tag} color={edit ? undefined : "gray"}>
          <Flex gap="3" align="center">
            <Text>#{tag}</Text>
            {edit ? (
              <IconButton
                variant="ghost"
                onClick={() => setTags(tags.filter((t) => t !== tag))}
              >
                <Cross2Icon />
              </IconButton>
            ) : null}
          </Flex>
        </Badge>
      ))}
      {edit ? (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <IconButton>
              <PlusIcon width="16" />
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            {ALL_TAGS.filter((t) => !tags.includes(t)).map((tag, i) => (
              <DropdownMenu.Item
                key={i + tag}
                onClick={() => setTags([...tags, tag])}
              >
                {tag}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      ) : null}
    </Flex>
  );
}
