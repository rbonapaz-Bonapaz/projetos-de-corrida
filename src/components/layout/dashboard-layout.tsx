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
  Key,
  Link2,
  Info,
  Loader2,
  LogIn,
  LogOut,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Mail,
  Lock,
  ClipboardList
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
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { TrainingContext } from "@/contexts/TrainingContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

const items = [
  { title: "DASHBOARD", url: "/", icon: LayoutDashboard },
  { title: "MEU PLANO", url: "/training", icon: Target },
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
  const [showKeyModal, setShowKeyModal] = React.useState(false);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [tempKey, setTempKey] = React.useState("");

  // Email Auth State
  const [authEmail, setAuthEmail] = React.useState("");
  const [authPass, setAuthPass] = React.useState("");
  const [authLoading, setAuthLoading] = React.useState(false);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
    if (context?.apiKey) setTempKey(context.apiKey);
  }, [context?.apiKey]);

  const handleSaveKey = () => {
    if (tempKey.trim() && context) {
      context.setApiKey(tempKey.trim());
      setShowKeyModal(false);
    }
  };

  const handleEmailAction = async (mode: 'login' | 'register') => {
    if (!authEmail || !authPass || !context) return;
    setAuthLoading(true);
    try {
      if (mode === 'login') await context.loginEmail(authEmail, authPass);
      else await context.registerEmail(authEmail, authPass);
      setShowAuthModal(false);
    } finally {
      setAuthLoading(false);
    }
  };

  if (!mounted || !context?.isHydrated) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="size-12 animate-spin text-primary" />
        <p className="font-headline font-black uppercase italic tracking-widest text-primary animate-pulse">Sincronizando Laboratório Cloud...</p>
      </div>
    );
  }

  const isIAActive = !!(context?.apiKey && context.apiKey.trim() !== "");
  const user = context.user;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full">
        <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar/50 backdrop-blur-xl">
          <SidebarHeader className="py-10 px-4 flex items-center justify-center overflow-hidden">
            <LogoDisplay />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="gap-2 px-2">
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.url}
                        tooltip={item.title}
                        className={cn(
                          "transition-all duration-300 h-11 px-6 rounded-xl",
                          pathname === item.url 
                            ? "bg-primary text-black shadow-lg shadow-primary/20" 
                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                      >
                        <Link href={item.url}>
                          <item.icon className={cn("size-4", pathname === item.url ? "text-black" : "text-primary/70")} />
                          <span className="font-headline font-black text-[11px] tracking-widest uppercase italic">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border/20 space-y-3">
            <SidebarMenuItem>
              <SidebarMenuButton 
                className={cn(
                  "w-full h-12 border transition-all rounded-xl",
                  isIAActive ? "text-primary border-primary/20 bg-primary/5" : "text-muted-foreground border-border/20"
                )} 
                onClick={() => setShowKeyModal(true)}
              >
                <Key className="size-4 text-primary" />
                <span className="group-data-[collapsible=icon]:hidden font-headline font-black text-[11px] tracking-widest uppercase italic">
                  {isIAActive ? "IA ATIVA" : "Configurar IA"}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {!user && (
               <SidebarMenuItem>
                <SidebarMenuButton 
                  className="w-full h-12 bg-white text-black hover:bg-primary rounded-xl transition-all shadow-xl" 
                  onClick={() => setShowAuthModal(true)}
                >
                  <LogIn className="size-4" />
                  <span className="group-data-[collapsible=icon]:hidden font-headline font-black text-[11px] tracking-widest uppercase italic">Entrar / Sincronizar</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-[#06080a]">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 px-6 sticky top-0 bg-background/60 backdrop-blur-xl z-30 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors" />
              <div className="font-headline font-black text-xl uppercase italic tracking-tighter flex items-center gap-3">
                <span className="text-white">
                   {items.find(i => i.url === pathname)?.title || "PORTAL"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 focus:outline-none group">
                    <div className="text-right hidden md:block leading-none">
                      <p className="text-[10px] font-black text-white tracking-widest uppercase italic group-hover:text-primary transition-colors">
                        {context?.activeProfile?.name?.toUpperCase() || user?.displayName?.split(' ')[0].toUpperCase() || 'CONVIDADO'}
                      </p>
                      <p className={cn(
                        "text-[9px] font-bold uppercase tracking-tighter mt-1",
                        user ? "text-primary" : "text-muted-foreground"
                      )}>
                        {user ? "Sincronizado" : "Modo Local"}
                      </p>
                    </div>
                    <div className="size-10 rounded-xl bg-secondary border border-border flex items-center justify-center font-headline font-black text-white shadow-2xl overflow-hidden group-hover:border-primary transition-all duration-300">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-secondary">
                          {context?.activeProfile?.name?.[0] || <UserIcon size={18} className="text-primary" />}
                        </div>
                      )}
                    </div>
                    <ChevronDown size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-card/95 backdrop-blur-xl border-border shadow-2xl rounded-2xl p-2">
                  <DropdownMenuLabel className="font-headline font-black uppercase italic text-[10px] tracking-widest px-3 py-3 text-muted-foreground/60">Painel de Controle</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem asChild className="rounded-xl focus:bg-primary focus:text-black cursor-pointer py-3">
                    <Link href="/profile" className="flex items-center gap-3 font-black text-[11px] uppercase italic tracking-widest">
                      <UserIcon className="size-4" /> Meus Dados
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowKeyModal(true)} className="rounded-xl focus:bg-primary focus:text-black cursor-pointer py-3 flex items-center gap-3 font-black text-[11px] uppercase italic tracking-widest">
                    <Key className="size-4" /> Configurar IA
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  {user ? (
                    <DropdownMenuItem onClick={() => context?.logout()} className="rounded-xl focus:bg-destructive/10 focus:text-destructive cursor-pointer py-3 flex items-center gap-3 font-black text-[11px] uppercase italic tracking-widest text-destructive">
                      <LogOut className="size-4" /> Encerrar Sessão
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => setShowAuthModal(true)} className="rounded-xl focus:bg-primary focus:text-black cursor-pointer py-3 flex items-center gap-3 font-black text-[11px] uppercase italic tracking-widest text-primary">
                      <LogIn className="size-4" /> Entrar / Sincronizar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16 custom-scrollbar">
            <React.Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
              {children}
            </React.Suspense>
          </main>
        </SidebarInset>
      </div>

      {/* Key Modal */}
      <Dialog open={showKeyModal} onOpenChange={setShowKeyModal}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border rounded-[2rem] shadow-2xl p-8">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-primary font-headline italic font-black uppercase tracking-tighter text-3xl">IA DE PERFORMANCE</DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 italic">
              Conecte seu motor de processamento cloud.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <p className="text-[11px] text-muted-foreground leading-relaxed italic font-medium">
                Sua Gemini API Key alimenta as análises biomecânicas. No PC ou Celular, seus dados estarão sincronizados.
              </p>
              <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 space-y-3">
                <p className="text-[10px] font-black uppercase text-primary italic tracking-widest">Link Oficial:</p>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-[11px] font-black uppercase italic text-white hover:text-primary transition-all group tracking-wider"
                >
                  Gerar Chave no Google Studio
                  <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </a>
              </div>
              <Input
                placeholder="Cole sua API Key (AIza...)"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                className="bg-black/30 border-border h-14 font-mono text-xs rounded-xl focus:border-primary text-center tracking-widest"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveKey} className="w-full font-black uppercase tracking-widest bg-primary text-black h-16 rounded-2xl shadow-2xl shadow-primary/20 text-sm italic hover:bg-white transition-all">Ativar Laboratório</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth Modal Híbrido */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-[450px] bg-card border-border rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
          <div className="bg-primary/10 p-10 text-center border-b border-white/5">
             <ShieldCheck size={48} className="text-primary mx-auto mb-4" />
             <DialogTitle className="text-3xl font-headline font-black uppercase italic tracking-tighter text-white">PORTAL DE ACESSO</DialogTitle>
             <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground italic tracking-widest mt-2">Sincronize seu laboratório entre dispositivos.</DialogDescription>
          </div>
          
          <div className="p-10 space-y-8">
            <Button 
              onClick={() => { context?.loginGoogle(); setShowAuthModal(false); }}
              className="w-full h-14 bg-white text-black font-black uppercase italic tracking-widest rounded-2xl shadow-xl hover:bg-primary transition-all gap-3"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Entrar com Google
            </Button>

            <div className="relative flex items-center justify-center">
               <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
               <span className="relative bg-card px-4 text-[9px] font-black text-muted-foreground uppercase italic tracking-widest">OU USE E-MAIL</span>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black/40 h-11 p-1 rounded-xl gap-1">
                <TabsTrigger value="login" className="font-black italic uppercase text-[10px] data-[state=active]:bg-primary data-[state=active]:text-black rounded-lg">LOGIN</TabsTrigger>
                <TabsTrigger value="register" className="font-black italic uppercase text-[10px] data-[state=active]:bg-primary data-[state=active]:text-black rounded-lg">CRIAR CONTA</TabsTrigger>
              </TabsList>
              
              <div className="mt-6 space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-4 size-4 text-muted-foreground/40" />
                  <Input 
                    placeholder="E-mail" 
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="bg-black/30 border-white/5 h-12 pl-12 rounded-xl focus:border-primary font-bold italic text-xs" 
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 size-4 text-muted-foreground/40" />
                  <Input 
                    type="password"
                    placeholder="Senha" 
                    value={authPass}
                    onChange={(e) => setAuthPass(e.target.value)}
                    className="bg-black/30 border-white/5 h-12 pl-12 rounded-xl focus:border-primary font-bold italic text-xs" 
                  />
                </div>

                <TabsContent value="login" className="mt-4">
                  <Button 
                    disabled={authLoading}
                    onClick={() => handleEmailAction('login')}
                    className="w-full h-12 bg-secondary text-primary font-black uppercase italic tracking-widest rounded-xl hover:bg-primary hover:text-black transition-all"
                  >
                    {authLoading ? <Loader2 className="animate-spin size-4" /> : 'ACESSAR LABORATÓRIO'}
                  </Button>
                </TabsContent>
                
                <TabsContent value="register" className="mt-4">
                  <Button 
                    disabled={authLoading}
                    onClick={() => handleEmailAction('register')}
                    className="w-full h-12 bg-primary text-black font-black uppercase italic tracking-widest rounded-xl hover:bg-white transition-all"
                  >
                    {authLoading ? <Loader2 className="animate-spin size-4" /> : 'CADASTRAR ATLETA'}
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
      <div className="font-headline font-black text-2xl italic tracking-tighter flex flex-col items-center leading-none">
        <span className="text-white">C</span><span className="text-primary">J</span>
      </div>
    );
  }
  return (
    <div className="font-headline font-black text-4xl italic tracking-tighter flex flex-col items-center leading-none">
      <span className="text-white">CORRE</span><span className="text-primary">JUNTO</span>
    </div>
  );
}
