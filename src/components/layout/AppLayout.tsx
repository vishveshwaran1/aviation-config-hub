import { Outlet } from "react-router-dom";
import Header from "./Header";
import Navbar from "./Navbar";
import Footer from "./Footer";

const AppLayout = () => (
  <div className="flex min-h-screen flex-col">
    <Header />
    <Navbar />
    <main className="flex-1 p-6">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default AppLayout;
