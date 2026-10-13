import { Outlet } from "react-router-dom";

import Header from "./Header";
import BottomNavigation from "./BottomNavigation";

function MainLayout() {
  return (
    <div className="app-shell min-h-screen bg-[var(--cream)]">
      <Header />

      <main className="has-bottom-nav">
        <Outlet />
      </main>

      <BottomNavigation />
    </div>
  );
}

export default MainLayout;