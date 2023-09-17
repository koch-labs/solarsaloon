import React from "react";
import { NavHorizontal, NavVertical } from "./Nav";

const Sidebar: React.FC = () => {
  return (
    <aside className="hidden w-[200px] flex-col md:flex">
      <NavHorizontal />
      {/* <NavVertical /> */}
    </aside>
  );
};
export default Sidebar;
