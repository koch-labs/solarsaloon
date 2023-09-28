import { Avatar, Button, Card, Flex, Table, Text } from "@radix-ui/themes";
import { EnterIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import numeral from "numeral";
import { Saloon, User } from "../../models/types";
import UserBadge from "../../components/UserBadge";
import { formatTime } from "../../utils";

export const UsersList = ({ users }: { users: User[] }) => {
  return (
    <Card>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Last Online</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body className="align-middle">
          {users.map((u) => (
            <Table.Row key={u.publicKey}>
              <Table.RowHeaderCell>
                <UserBadge user={u} />
              </Table.RowHeaderCell>
              <Table.Cell>
                {formatTime(Date.now() - new Date(u.lastLogin).valueOf())} ago
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Card>
  );
};
