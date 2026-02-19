import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const isConfigActive = ["/config/aircraft", "/config/components", "/config/services"].includes(location.pathname);

  return (
    <nav className="flex h-14 items-center gap-1 px-4 bg-[#556ee6]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground",
              isConfigActive && "bg-primary-foreground/15 text-primary-foreground"
            )}
          >
            Configuration <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <Link to="/config/aircraft">Aircraft Setup</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/config/components">Component List Setup</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/config/services">Service List Setup</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Link
        to="/dashboard"
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground",
          isActive("/dashboard") && "bg-primary-foreground/15 text-primary-foreground"
        )}
      >
        Dashboard
      </Link>
    </nav>
  );
};

export default Navbar;
