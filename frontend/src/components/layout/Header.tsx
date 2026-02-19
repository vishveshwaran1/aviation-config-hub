import { Search, LogOut, Maximize, Minimize } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import img from "@/assets/image.png";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const Header = () => {
  const { user, signOut } = useAuth();
  const [dateTime, setDateTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "AT";

  return (
    <header className="flex h-18 items-center justify-between border-b bg-card px-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <img src={img} alt="Logo" className="h-8 w-8" />
          </div>
          <span className="text-2xl font-semibold text-foreground text-[#343a40]">AEROTREND</span>
        </div>

        <div className="hidden md:flex items-center ml-4">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("search")} className="pl-9 h-9" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-9 h-9">
              <span className="text-xl">
                {i18n.language === 'en' && '🇲🇾'}
                {i18n.language === 'es' && '🇪🇸'}
                {i18n.language === 'de' && '🇩🇪'}
                {i18n.language === 'ru' && '🇷🇺'}
                {i18n.language === 'it' && '🇮🇹'}
                {/* Fallback */}
                {!['en', 'es', 'de', 'ru', 'it'].includes(i18n.language) && '🌐'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => changeLanguage('en')}>
              <span className="mr-2">🇲🇾</span> English (Malaysia)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('es')}>
              <span className="mr-2">🇪🇸</span> Espagnol
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('de')}>
              <span className="mr-2">🇩🇪</span> Deutsch
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('ru')}>
              <span className="mr-2">🇷🇺</span> Russian
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('it')}>
              <span className="mr-2">🇮🇹</span> Italian
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={toggleFullScreen}
          className="p-2 text-muted-foreground hover:text-foreground focus:outline-none"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize className="h-5 w-5" />
          ) : (
            <Maximize className="h-5 w-5" />
          )}
        </button>
        <span className="hidden text-sm text-muted-foreground md:inline">
          {format(dateTime, "dd MMM yyyy, HH:mm")}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> {t("sign_out")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
