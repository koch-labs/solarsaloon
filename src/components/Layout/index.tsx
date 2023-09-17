import Header from "./Header";
import Sidebar from "./Sidebar";
import React, { ReactNode } from "react";

export const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="mx-auto flex flex-col h-screen space-y-6 overflow-hidden">
      <Header />
      <div id="content" className="grid gap-12 md:grid-cols-[210px_2fr]">
        <Sidebar />
        {children}
      </div>
    </div>
  );
};

export default Layout;
