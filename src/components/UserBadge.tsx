import { Badge, Flex, IconButton, Text } from "@radix-ui/themes";
import { shortKey } from "../utils";
import Link from "next/link";
import { getExplorerUrl } from "../utils/explorer";
import { User } from "../models/types";
import { LinkIcon, UserIcon } from "@heroicons/react/24/outline";

export default function UserBadge({ user }: { user: User }) {
  const name = user.username ? user.username : shortKey(user.publicKey);
  return (
    <Badge className="max-w-32">
      {user ? (
        <Flex align="center" gap="1" p="1" className="max-w-sm ">
          <Text>{name.length > 16 ? name.substring(0, 13) + "..." : name}</Text>
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
