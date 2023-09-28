import { FC, useEffect, useState } from "react";
import { Box } from "@radix-ui/themes";
import { User } from "../../models/types";
import { UsersList } from "./UsersList";

export const UsersListView: FC = ({}) => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function fetchSaloons() {
      const { users } = await (await fetch("/api/user/all")).json();
      setUsers(users);
    }

    fetchSaloons();
  }, []);

  return (
    <Box className="flex flex-col gap-3">
      <UsersList users={users} />
    </Box>
  );
};
