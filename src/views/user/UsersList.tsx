import { Card, Table } from "@radix-ui/themes";
import { User } from "../../models/types";
import UserBadge from "../../components/UserBadge";
import { formatTime } from "../../utils";

export const UsersList = ({ users }: { users: User[] }) => {
  return (
    <Table.Root className="bg-brand-gray-2">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Last Online</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body className="align-middle bg-brand-gray">
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
  );
};
