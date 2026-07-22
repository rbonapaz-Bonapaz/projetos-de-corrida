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
  ChevronDown,
  Mail,
  Lock,
  ClipboardList,
  Cloud,
  Smartphone,
  Fingerprint
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarHeader, 
  SidebarInset, 
  SidebarProvider,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from "@/components/ui/sidebar";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ==========================================
// 🏃‍♂️ CAMINHO DO MASCOTE LOCAL (Pasta public)
// ==========================================
const MASCOT_IMAGE_URL = "/mascote.png";

const items = [
  { title: "DASHBOARD", url: "/", icon: LayoutDashboard },
  { title: "MEU PLANO", url: "/training", icon: Target },
  { title: "WIDGET MÓVEL", url: "/widget", icon: Smartphone },
  { title: "EVOLUÇÃO", url: "/analysis", icon: Activity },
  { title: "CONQUISTAS", url: "/vault", icon: Trophy },
  { title: "COACH IA", url: "/coach", icon: MessageSquare },
  { title: "CALCULADORAS", url: "/calculators", icon: Calculator },
  { title: "ANAMNESE", url: "/anamnesis", icon: ClipboardList },
  { title: "DICIONÁRIO", url: "/dictionary", icon: BookOpen },
  { title: "INTEGRAÇÕES", url: "/integrations", icon: Link2 },
  { title: "MEUS DADOS", url: "/profile", icon: UserIcon },
  { title: "SOBRE", url: "/about", icon: Info },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const context = React.useContext(TrainingContext);
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  const [authEmail, setAuthEmail] = React.useState("");
  const [authPass, setAuthPass] = React.useState("");
  const [authLoading, setAuthLoading] = React.useState(false);

  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !context?.isHydrated) {
    return (
      <div className="min-h-svh w-full flex flex-col items-center justify-center bg-background gap-4 p-6 text-center">
        <Loader2 className="size-12 animate-spin text-primary" />
        <p className="font-headline font-black uppercase italic tracking-widest text-primary animate-pulse text-sm md:text-base">Sincronizando Lab...</p>
      </div>
    );
  }

  const user = context.user;
  const anamnesisFilled = !!context?.activeProfile?.anamnesis?.whatsapp;

  const handleEmailAction = async (mode: 'login' | 'register') => {
    if (!authEmail || !authPass || !context) return;
    setAuthLoading(true);
    try {
      if (mode === 'login') await context.loginEmail(authEmail, authPass);
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
    } catch (e) {
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-svh bg-background w-full overflow-x-hidden">
        <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar/50 backdrop-blur-xl">
          <SidebarHeader className="py-8 px-4 flex items-center justify-center overflow-hidden border-b border-white/5">
            <LogoDisplay />
          </SidebarHeader>
          <SidebarContent className="custom-scrollbar">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1 md:gap-2 px-2 mt-4">
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.url}
                        tooltip={item.title}
                        className={cn(
                          "transition-all duration-300 h-10 md:h-11 px-4 md:px-6 rounded-xl",
                          pathname === item.url 
                            ? "bg-primary text-black shadow-lg shadow-primary/20" 
                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                      >
                        <Link href={item.url} className="relative w-full flex items-center gap-2">
                          <item.icon className={cn("size-4 shrink-0", pathname === item.url ? "text-black" : "text-primary/70")} />
                          <span className="font-headline font-black text-[9px] md:text-[10px] tracking-tight uppercase italic truncate flex-1">{item.title}</span>
                          {item.title === "ANAMNESE" && (
                            <div className="ml-auto shrink-0 flex items-center">
                               <div className={cn(
                                 "size-1.5 rounded-full",
                                 anamnesisFilled ? "bg-primary/40" : "bg-destructive animate-pulse"
                               )} />
                            </div>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border/20 space-y-3">
            {!user ? (
               <SidebarMenuItem>
                <SidebarMenuButton 
                  className="w-full h-10 md:h-12 bg-white text-black hover:bg-primary rounded-xl transition-all shadow-xl px-4" 
                  onClick={() => setShowAuthModal(true)}
                >
                  <LogIn className="size-4 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden font-headline font-black text-[10px] tracking-tight uppercase italic truncate">ENTRAR</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : (
              <div className="space-y-3">
                <div className="px-2 py-2 flex items-center gap-2 bg-primary/10 rounded-lg group-data-[collapsible=icon]:hidden">
                  <div className="size-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] font-black uppercase italic text-primary tracking-widest">Nuvem Ativa</span>
                </div>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    className="w-full h-10 md:h-12 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all px-4" 
                    onClick={() => context?.logout()}
                  >
                    <LogOut className="size-4 shrink-0" />
                    <span className="group-data-[collapsible=icon]:hidden font-headline font-black text-[10px] tracking-tight uppercase italic truncate">SAIR</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-[#06080a] min-h-svh relative overflow-y-auto custom-scrollbar">
          <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b border-border/50 px-4 md:px-6 sticky top-0 bg-background/60 backdrop-blur-xl z-30 justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors size-8 md:size-10" />
              <div className="font-headline font-black text-base md:text-xl uppercase italic tracking-tighter flex items-center gap-2 md:gap-3">
                <span className="text-white truncate max-w-[140px] md:max-w-none">
                   {items.find(i => i.url === pathname)?.title || "PORTAL"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 md:gap-3 focus:outline-none group">
                    <div className="text-right hidden md:block leading-none">
                      <p className="text-[10px] font-black text-white tracking-widest uppercase italic group-hover:text-primary transition-colors">
                        {context?.activeProfile?.name?.toUpperCase() || user?.displayName?.split(' ')[0].toUpperCase() || 'CONVIDADO'}
                      </p>
                      <p className={cn(
                        "text-[9px] font-bold uppercase tracking-tighter mt-1 flex items-center justify-end gap-1",
                        user ? "text-primary" : "text-muted-foreground"
                      )}>
                        {user ? <><Cloud size={10}/> Cloud</> : "Local"}
                      </p>
                    </div>
                    <div className="size-8 md:size-10 rounded-lg md:rounded-xl bg-secondary border border-border flex items-center justify-center font-headline font-black text-white shadow-2xl overflow-hidden group-hover:border-primary transition-all duration-300">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-secondary">
                          <UserIcon size={16} className="text-primary" />
                        </div>
                      )}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-card/95 backdrop-blur-xl border-border shadow-2xl rounded-2xl p-2">
                  <DropdownMenuItem asChild className="rounded-xl focus:bg-primary focus:text-black cursor-pointer py-3">
                    <Link href="/profile" className="flex items-center gap-3 font-black text-[11px] uppercase italic tracking-widest">
                      <UserIcon className="size-4" /> Meus Dados
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  {user ? (
                    <DropdownMenuItem 
                      onClick={() => context?.logout()} 
                      className="rounded-xl focus:bg-destructive/10 focus:text-destructive cursor-pointer py-3 flex items-center gap-3 font-black text-[11px] uppercase italic tracking-widest text-destructive"
                    >
                      <LogOut className="size-4" /> SAIR
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem 
                      onSelect={(e) => {
                        e.preventDefault();
                        setShowAuthModal(true);
                      }}
                      className="rounded-xl focus:bg-primary focus:text-black cursor-pointer py-3 items-center gap-3 font-black text-[11px] uppercase italic tracking-widest text-primary"
                    >
                      <LogIn className="size-4" /> ENTRAR
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-12 lg:p-16 relative overflow-y-auto custom-scrollbar">
            {children}
          </main>
        </SidebarInset>
      </div>

      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="w-[95vw] md:max-w-[420px] bg-[#0c0e12] border-border rounded-[2rem] md:rounded-[2.5rem] shadow-2xl p-0 overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
          <DialogHeader className="sr-only">
            <DialogTitle>Portal de Acesso</DialogTitle>
          </DialogHeader>
          <div className="p-6 md:p-12 text-center border-b border-white/5 shrink-0 bg-gradient-to-b from-primary/5 to-transparent flex flex-col items-center">
             <div className="size-24 md:size-32 flex items-center justify-center mb-4 md:mb-6 animate-in zoom-in-50 duration-500 bg-white rounded-full p-2 shadow-2xl border-4 border-primary/20 overflow-hidden">
                <img 
                  src={MASCOT_IMAGE_URL} 
                  alt="Mascote CorreJunto" 
                  className="w-full h-full object-contain"
                />
             </div>
             <h2 className="text-xl md:text-3xl font-headline font-black uppercase italic tracking-tighter text-white leading-none">PORTAL ELITE</h2>
             <DialogDescription className="text-[9px] md:text-xs uppercase font-bold text-muted-foreground/80 italic tracking-wide mt-3 md:mt-4 leading-relaxed text-center">
               Sincronize sua evolução técnica na nuvem CorreJunto.
             </DialogDescription>
          </div>
          
          <div className="p-6 md:p-12 space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar flex-1 bg-[#0c0e12]">
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              <Button 
                onClick={handleGoogleLogin}
                className="w-full h-11 md:h-14 bg-white text-black font-black uppercase italic tracking-widest rounded-xl shadow-xl hover:bg-primary transition-all gap-3 text-[10px] md:text-xs"
              >
                Acessar com Google
              </Button>

              <Button 
                onClick={() => { context?.loginBiometric(); setShowAuthModal(false); }}
                variant="outline"
                className="w-full h-11 md:h-14 border-primary/20 text-primary font-black uppercase italic tracking-widest rounded-xl md:rounded-2xl hover:bg-primary hover:text-black transition-all gap-3 text-[10px] md:text-xs"
              >
                <Fingerprint className="size-4 md:size-5" />
                Biometria Elite
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
              <div className="relative flex justify-center text-[8px] md:text-[9px] font-black uppercase italic"><span className="bg-[#0c0e12] px-3 text-muted-foreground/40">ou via e-mail</span></div>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid grid-full grid-cols-2 bg-black/40 h-10 md:h-12 p-1 rounded-xl gap-1">
                <TabsTrigger value="login" className="font-black italic uppercase text-[9px] md:text-[11px] data-[state=active]:bg-primary data-[state=active]:text-black rounded-lg">LOGIN</TabsTrigger>
                <TabsTrigger value="register" className="font-black italic uppercase text-[9px] md:text-[11px] data-[state=active]:bg-primary data-[state=active]:text-black rounded-lg">CRIAR</TabsTrigger>
              </TabsList>
              
              <div className="mt-4 md:mt-6 space-y-3 md:space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3.5 md:left-4 top-3 md:top-3.5 size-3.5 md:size-4 text-muted-foreground/40" />
                  <Input 
                    placeholder="E-mail" 
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="bg-black/30 border-white/5 h-10 md:h-11 pl-10 md:pl-12 rounded-xl focus:border-primary font-bold italic text-[10px] md:text-xs" 
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 md:left-4 top-3 md:top-3.5 size-3.5 md:size-4 text-muted-foreground/40" />
                  <Input 
                    type="password"
                    placeholder="Senha" 
                    value={authPass}
                    onChange={(e) => setAuthPass(e.target.value)}
                    className="bg-black/30 border-white/5 h-10 md:h-11 pl-10 md:pl-12 rounded-xl focus:border-primary font-bold italic text-[10px] md:text-xs" 
                  />
                </div>

                <TabsContent value="login" className="mt-4 md:mt-6">
                  <Button 
                    disabled={authLoading}
                    onClick={() => handleEmailAction('login')}
                    className="w-full h-10 md:h-11 bg-secondary text-primary font-black uppercase italic tracking-widest rounded-xl hover:bg-primary hover:text-black transition-all text-[10px] md:text-xs"
                  >
                    {authLoading ? <Loader2 className="animate-spin size-4 md:size-5" /> : 'ACESSAR AGORA'}
                  </Button>
                </TabsContent>
                
                <TabsContent value="register" className="mt-4 md:mt-6">
                  <Button 
                    disabled={authLoading}
                    onClick={() => handleEmailAction('register')}
                    className="w-full h-10 md:h-11 bg-primary text-black font-black uppercase italic tracking-widest rounded-xl hover:bg-white transition-all text-[10px] md:text-xs"
                  >
                    {authLoading ? <Loader2 className="animate-spin size-4 md:size-5" /> : 'CRIAR CONTA'}
                  </Button>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

function LogoDisplay() {
  const { state } = useSidebar();
  if (state === "collapsed") {
    return (
      <div className="font-headline font-black text-xl italic flex items-center">
        <span className="text-white">C</span>
        <span className="text-primary ml-0.5">J</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-headline font-black text-2xl md:text-3xl italic tracking-tighter flex flex-col items-center leading-[0.85]">
        <span className="text-white">CORRE</span>
        <span className="text-primary">JUNTO</span>
      </div>
      <p className="text-[7px] font-bold uppercase tracking-[0.4em] text-muted-foreground/40 italic">LABORATÓRIO</p>
    </div>
  );
}
