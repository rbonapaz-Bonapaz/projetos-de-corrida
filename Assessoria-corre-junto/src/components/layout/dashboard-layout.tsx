"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User as UserIcon,
  Activity,
  MessageSquare,
  Trophy,
  Calculator,
  BookOpen,
  Target,
  Link2,
  Info,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  Lock,
  ClipboardList,
  Cloud,
  Smartphone,
  Fingerprint,
  Apple,
  Menu,
  X,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TrainingContext } from "@/contexts/TrainingContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const MASCOT_IMAGE_URL = "/mascote.png";

const items = [
  { title: "Painel", url: "/", icon: LayoutDashboard },
  { title: "Meu Plano", url: "/training", icon: Target },
  { title: "Nutrição", url: "/nutrition", icon: Apple },
  { title: "Widget Móvel", url: "/widget", icon: Smartphone },
  { title: "Evolução", url: "/analysis", icon: Activity },
  { title: "Conquistas", url: "/vault", icon: Trophy },
  { title: "Coach IA", url: "/coach", icon: MessageSquare },
  { title: "Calculadoras", url: "/calculators", icon: Calculator },
  { title: "Anamnese", url: "/anamnesis", icon: ClipboardList },
  { title: "Dicionário", url: "/dictionary", icon: BookOpen },
  { title: "Integrações", url: "/integrations", icon: Link2 },
  { title: "Meus Dados", url: "/profile", icon: UserIcon },
  { title: "Sobre", url: "/about", icon: Info },
];

// Destinos fixos na barra inferior do celular — os mais usados no dia a dia.
const mobileTabs = [
  { title: "Painel", url: "/", icon: LayoutDashboard },
  { title: "Plano", url: "/training", icon: Target },
  { title: "Coach", url: "/coach", icon: MessageSquare },
  { title: "Dieta", url: "/nutrition", icon: Apple },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const context = React.useContext(TrainingContext);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);

  const [authEmail, setAuthEmail] = React.useState("");
  const [authPass, setAuthPass] = React.useState("");
  const [authLoading, setAuthLoading] = React.useState(false);

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    setMobileNavOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  if (!mounted || !context?.isHydrated) {
    return (
      <div className="min-h-svh w-full flex flex-col items-center justify-center bg-background gap-4 p-6 text-center">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-sm font-semibold uppercase tracking-widest text-primary/80 animate-pulse">
          Sincronizando…
        </p>
      </div>
    );
  }

  const user = context.user;
  const currentTitle = items.find((i) => i.url === pathname)?.title || "Painel";

  const handleEmailAction = async (mode: "login" | "register") => {
    if (!authEmail || !authPass || !context) return;
    setAuthLoading(true);
    try {
      if (mode === "login") await context.loginEmail(authEmail, authPass);
      else await context.registerEmail(authEmail, authPass);
      setShowAuthModal(false);
    } catch (e) {
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!context) return;
    try {
      await context.loginGoogle();
      setShowAuthModal(false);
    } catch (e) {}
  };

  const userInitial =
    context?.activeProfile?.name?.[0]?.toUpperCase() ||
    user?.displayName?.[0]?.toUpperCase() ||
    "R";
  const userName =
    context?.activeProfile?.name || user?.displayName?.split(" ")[0] || "Convidado";
  const anamnesisFilled = !!context?.activeProfile?.anamnesis?.whatsapp;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] min-h-svh bg-background w-full overflow-x-hidden">
      {/* RAIL — navegação fixa em telas largas */}
      <aside className="hidden lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-svh border-r border-border bg-card/60 backdrop-blur-xl px-3.5 py-5 gap-1.5">
        <Link href="/" className="flex items-center gap-2.5 px-2.5 pb-4">
          <div className="size-8 rounded-[10px] bg-white grid place-items-center shrink-0 overflow-hidden p-0.5">
            <img src={MASCOT_IMAGE_URL} alt="Mascote CorreJunto" className="w-full h-full object-contain" />
          </div>
          <span className="text-[15px] font-bold tracking-tight leading-none">
            Corre<span className="text-primary">Junto</span>
          </span>
        </Link>
        <nav className="flex flex-col gap-0.5 overflow-y-auto custom-scrollbar">
          {items.map((item) => {
            const active = pathname === item.url;
            return (
              <Link
                key={item.url}
                href={item.url}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[13px] font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="size-4 shrink-0" strokeWidth={1.8} />
                <span className="truncate flex-1">{item.title}</span>
                {item.url === "/anamnesis" && !anamnesisFilled && (
                  <span className="size-1.5 rounded-full bg-destructive shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-3 border-t border-border">
          {!user ? (
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full flex items-center gap-2.5 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground px-3 py-2.5 transition-colors text-left"
            >
              <LogIn className="size-4 shrink-0" />
              <span className="text-[12.5px] font-semibold">Entrar</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl bg-secondary px-3 py-2.5">
              <div className="size-7 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold text-xs shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate">{userName}</p>
                <p className="text-[10px] text-primary flex items-center gap-1">
                  <Cloud size={10} /> Nuvem ativa
                </p>
              </div>
              <button
                onClick={() => context?.logout()}
                className="text-muted-foreground hover:text-destructive shrink-0"
                aria-label="Sair"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex flex-col min-w-0">
        <header className="flex h-14 items-center gap-3 border-b border-border px-4 md:px-6 sticky top-0 bg-background/85 backdrop-blur-xl z-30">
          <button
            className="lg:hidden size-9 grid place-items-center rounded-lg border border-border text-muted-foreground shrink-0"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="size-4" />
          </button>
          <span className="text-sm font-semibold truncate flex-1 lg:flex-none">{currentTitle}</span>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <span className="hidden sm:inline-flex chip">
              <span
                className={cn(
                  "dot",
                  context?.activeProfile?.integrations?.coros?.connected ? "" : "opacity-30"
                )}
              />
              COROS {context?.activeProfile?.integrations?.coros?.connected ? "conectado" : "offline"}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 focus:outline-none group shrink-0">
                  <div className="size-8 rounded-lg bg-secondary border border-border grid place-items-center overflow-hidden group-hover:border-primary transition-colors">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={15} className="text-primary" />
                    )}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link href="/profile" className="flex items-center gap-2.5 text-[13px] font-medium">
                    <UserIcon className="size-4" /> Meus Dados
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user ? (
                  <DropdownMenuItem
                    onClick={() => context?.logout()}
                    className="rounded-lg cursor-pointer flex items-center gap-2.5 text-[13px] font-medium text-destructive focus:text-destructive"
                  >
                    <LogOut className="size-4" /> Sair
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setShowAuthModal(true);
                    }}
                    className="rounded-lg cursor-pointer flex items-center gap-2.5 text-[13px] font-medium text-primary"
                  >
                    <LogIn className="size-4" /> Entrar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 min-w-0 px-4 py-5 md:px-8 md:py-8 pb-24 lg:pb-8 max-w-[1560px] w-full mx-auto">
          {children}
        </main>

        {/* BARRA INFERIOR — navegação de polegar no celular */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur-xl px-2 pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5 flex items-stretch justify-around">
          {mobileTabs.map((tab) => {
            const active = pathname === tab.url;
            return (
              <Link
                key={tab.url}
                href={tab.url}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[9.5px] font-semibold min-w-0",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <tab.icon className="size-[19px]" strokeWidth={1.8} />
                {tab.title}
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[9.5px] font-semibold text-muted-foreground min-w-0"
          >
            <MoreHorizontal className="size-[19px]" strokeWidth={1.8} />
            Mais
          </button>
        </nav>
      </div>

      {/* Menu completo mobile (rail) */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2.5 text-left">
              <div className="size-8 rounded-[10px] bg-white grid place-items-center shrink-0 overflow-hidden p-0.5">
                <img src={MASCOT_IMAGE_URL} alt="Mascote CorreJunto" className="w-full h-full object-contain" />
              </div>
              <span className="text-[15px] font-bold tracking-tight">
                Corre<span className="text-primary">Junto</span>
              </span>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-0.5 p-3 overflow-y-auto custom-scrollbar">
            {items.map((item) => {
              const active = pathname === item.url;
              return (
                <Link
                  key={item.url}
                  href={item.url}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/15 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4 shrink-0" strokeWidth={1.8} />
                  <span className="flex-1">{item.title}</span>
                  {item.url === "/anamnesis" && !anamnesisFilled && (
                    <span className="size-1.5 rounded-full bg-destructive shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Bottom-sheet "Mais" no celular, com o restante das seções */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[75vh] overflow-y-auto">
          <SheetHeader className="mb-2">
            <SheetTitle className="text-left text-sm">Mais opções</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 pb-4">
            {items
              .filter((i) => !mobileTabs.some((t) => t.url === i.url))
              .map((item) => (
                <Link
                  key={item.url}
                  href={item.url}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/40 py-4 text-[11px] font-medium text-center"
                >
                  <item.icon className="size-5 text-primary" strokeWidth={1.8} />
                  {item.title}
                </Link>
              ))}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="w-[95vw] md:max-w-[420px] rounded-[1.75rem] p-0 overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
          <DialogHeader className="sr-only">
            <DialogTitle>Portal de Acesso</DialogTitle>
          </DialogHeader>
          <div className="p-6 md:p-10 text-center border-b border-border shrink-0 bg-gradient-to-b from-primary/5 to-transparent flex flex-col items-center">
            <div className="size-20 md:size-24 flex items-center justify-center mb-4 bg-white rounded-full p-2 shadow-xl border-4 border-primary/20 overflow-hidden">
              <img src={MASCOT_IMAGE_URL} alt="Mascote CorreJunto" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Entrar no CorreJunto</h2>
            <DialogDescription className="text-xs text-muted-foreground mt-2 text-center">
              Sincronize sua evolução na nuvem.
            </DialogDescription>
          </div>

          <div className="p-6 md:p-10 space-y-5 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={handleGoogleLogin}
                className="w-full h-11 bg-white text-black font-semibold rounded-xl shadow hover:bg-primary hover:text-primary-foreground transition-all text-sm"
              >
                Acessar com Google
              </Button>

              <Button
                onClick={() => {
                  context?.loginBiometric();
                  setShowAuthModal(false);
                }}
                variant="outline"
                className="w-full h-11 rounded-xl text-sm font-semibold gap-2"
              >
                <Fingerprint className="size-4" />
                Biometria
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wide">
                <span className="bg-card px-3 text-muted-foreground">ou via e-mail</span>
              </div>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-10 p-1 rounded-xl">
                <TabsTrigger value="login" className="text-xs font-semibold rounded-lg">
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="text-xs font-semibold rounded-lg">
                  Criar conta
                </TabsTrigger>
              </TabsList>

              <div className="mt-4 space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground/60" />
                  <Input
                    placeholder="E-mail"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="h-11 pl-10 rounded-xl text-sm"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 size-4 text-muted-foreground/60" />
                  <Input
                    type="password"
                    placeholder="Senha"
                    value={authPass}
                    onChange={(e) => setAuthPass(e.target.value)}
                    className="h-11 pl-10 rounded-xl text-sm"
                  />
                </div>

                <TabsContent value="login" className="mt-4">
                  <Button
                    disabled={authLoading}
                    onClick={() => handleEmailAction("login")}
                    className="w-full h-11 rounded-xl text-sm font-semibold"
                  >
                    {authLoading ? <Loader2 className="animate-spin size-4" /> : "Entrar"}
                  </Button>
                </TabsContent>

                <TabsContent value="register" className="mt-4">
                  <Button
                    disabled={authLoading}
                    onClick={() => handleEmailAction("register")}
                    className="w-full h-11 rounded-xl text-sm font-semibold"
                  >
                    {authLoading ? <Loader2 className="animate-spin size-4" /> : "Criar conta"}
                  </Button>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
