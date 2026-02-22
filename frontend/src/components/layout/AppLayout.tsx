import { Outlet } from "react-router-dom";
import Header from "./Header";
import Navbar from "./Navbar";
import Footer from "./Footer";

const AppLayout = () => (
  <div className="flex min-h-screen flex-col">
    {/* Sticky top bar: Header + Navbar locked in place */}
    <div className="sticky top-0 z-50 shadow-sm">
      <Header />
      <Navbar />
    </div>
    <main className="flex-1 p-6 w-full max-w-full">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default AppLayout;
