import { Badge, Flex, IconButton, Text } from "@radix-ui/themes";
import { PublicKey } from "@solana/web3.js";
import { shortKey } from "../utils";
import Link from "next/link";
import { EnterIcon, ExitIcon, ExternalLinkIcon } from "@radix-ui/react-icons";
import { getExplorerUrl } from "../utils/explorer";
import { User } from "../models/types";

export default function UserBadge({ user }: { user: User }) {
  return (
    <Badge>
      {user ? (
        <Flex align="center" gap="1" p="1">
          <Text>
            {user.username ? user.username : shortKey(user.publicKey)}
          </Text>
          <Link href={`/user/${user.publicKey}`} target="_blank">
            <IconButton variant="ghost" size="1">
              <EnterIcon />
            </IconButton>
          </Link>
          <Link href={getExplorerUrl(user.publicKey)} target="_blank">
            <IconButton variant="ghost" size="1">
              <ExitIcon />
            </IconButton>
          </Link>
        </Flex>
      ) : (
        "???"
      )}
    </Badge>
  );
}
