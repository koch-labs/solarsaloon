import { Badge, Flex, IconButton, Text } from "@radix-ui/themes";
import { PublicKey } from "@solana/web3.js";
import { shortKey } from "../utils";
import Link from "next/link";
import {
  EnterIcon,
  ExitIcon,
  ExternalLinkIcon,
  Link1Icon,
  Link2Icon,
} from "@radix-ui/react-icons";
import { getExplorerUrl } from "../utils/explorer";
import { User } from "../models/types";
import { LinkIcon, UserIcon } from "@heroicons/react/24/outline";

export default function UserBadge({ user }: { user: User }) {
  return (
    <Badge>
      {user ? (
        <Flex align="center" gap="1" p="1">
          <Text>
            {user.username ? user.username : shortKey(user.publicKey)}
          </Text>
          <Link href={`/user/${user.publicKey}`}>
            <IconButton variant="ghost" size="1">
              <UserIcon width="16" />
            </IconButton>
          </Link>
          <Link href={getExplorerUrl(user.publicKey)} target="_blank">
            <IconButton variant="ghost" size="1">
              <LinkIcon width="16" />
            </IconButton>
          </Link>
        </Flex>
      ) : (
        "???"
      )}
    </Badge>
  );
}
