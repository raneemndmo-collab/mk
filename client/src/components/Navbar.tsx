import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Home, Search, Bell, MessageSquare, Menu, X, Globe, User,
  LogOut, LayoutDashboard, Building2, Plus, ChevronDown
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, lang, toggleLang } = useI18n();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadNotifs = trpc.notification.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });
  const unreadMsgs = trpc.message.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const getDashboardLink = () => {
    if (!user) return "/tenant";
    if (user.role === "admin") return "/admin";
    if (user.role === "landlord") return "/landlord";
    return "/tenant";
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-saudi flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold font-heading text-primary">
              {lang === "ar" ? "إيجار" : "Ijar"}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button variant={location === "/" ? "secondary" : "ghost"} size="sm">
                <Home className="h-4 w-4 me-1.5" />
                {t("nav.home")}
              </Button>
            </Link>
            <Link href="/search">
              <Button variant={location === "/search" ? "secondary" : "ghost"} size="sm">
                <Search className="h-4 w-4 me-1.5" />
                {t("nav.search")}
              </Button>
            </Link>
            {isAuthenticated && (
              <>
                <Link href={getDashboardLink()}>
                  <Button variant={["/tenant", "/landlord", "/admin"].includes(location) ? "secondary" : "ghost"} size="sm">
                    <LayoutDashboard className="h-4 w-4 me-1.5" />
                    {t("nav.dashboard")}
                  </Button>
                </Link>
                <Link href="/messages">
                  <Button variant={location.startsWith("/messages") ? "secondary" : "ghost"} size="sm" className="relative">
                    <MessageSquare className="h-4 w-4 me-1.5" />
                    {t("nav.messages")}
                    {(unreadMsgs.data?.count ?? 0) > 0 && (
                      <Badge className="absolute -top-1 -end-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-destructive">
                        {unreadMsgs.data?.count}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <Button variant="ghost" size="icon" onClick={toggleLang} className="h-9 w-9">
              <Globe className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            {isAuthenticated && (
              <Link href={getDashboardLink()}>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Bell className="h-4 w-4" />
                  {(unreadNotifs.data?.count ?? 0) > 0 && (
                    <Badge className="absolute -top-1 -end-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-destructive">
                      {unreadNotifs.data?.count}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            {/* List Property CTA */}
            {isAuthenticated && (
              <Link href="/list-property" className="hidden md:block">
                <Button size="sm" className="gradient-saudi text-white border-0">
                  <Plus className="h-4 w-4 me-1.5" />
                  {t("nav.listProperty")}
                </Button>
              </Link>
            )}

            {/* User menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm">{user?.name}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => window.location.href = getDashboardLink()}>
                    <LayoutDashboard className="h-4 w-4 me-2" />
                    {t("nav.dashboard")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = "/list-property"}>
                    <Plus className="h-4 w-4 me-2" />
                    {t("nav.listProperty")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 me-2" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={() => window.location.href = getLoginUrl()}>
                <User className="h-4 w-4 me-1.5" />
                {t("nav.login")}
              </Button>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-3 space-y-1">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <Home className="h-4 w-4 me-2" />
                {t("nav.home")}
              </Button>
            </Link>
            <Link href="/search" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <Search className="h-4 w-4 me-2" />
                {t("nav.search")}
              </Button>
            </Link>
            {isAuthenticated && (
              <>
                <Link href={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <LayoutDashboard className="h-4 w-4 me-2" />
                    {t("nav.dashboard")}
                  </Button>
                </Link>
                <Link href="/messages" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 me-2" />
                    {t("nav.messages")}
                  </Button>
                </Link>
                <Link href="/list-property" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Plus className="h-4 w-4 me-2" />
                    {t("nav.listProperty")}
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
