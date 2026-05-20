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

const items = [
  { title: "DASHBOARD", url: "/", icon: LayoutDashboard },
  { title: "MEU PLANO", url: "/training", icon: Target },
  { title: "EVOLUÇÃO", url: "/analysis", icon: Activity },
  { title: "CONQUISTAS", url: "/vault", icon: Trophy },
  { title: "COACH IA", url: "/coach", icon: MessageSquare },
  { title: "CALCULADORAS", url: "/calculators", icon: Calculator },
  { title: "DICIONÁRIO", url: "/dictionary", icon: BookOpen },
  { title: "INTEGRAÇÕES", url: "/integrations", icon: Link2 },
  { title: "MEUS DADOS", url: "/profile", icon: UserIcon },
  { title: "SOBRE", url: "/about", icon: Info },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const context = React.useContext(TrainingContext);
  const [showKeyModal, setShowKeyModal] = React.useState(false);
  const [tempKey, setTempKey] = React.useState("");

  // Hydration safety
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
                  onClick={() => context?.login()}
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
              <div className="flex items-center gap-3">
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
                      <DropdownMenuItem onClick={() => context?.login()} className="rounded-xl focus:bg-primary focus:text-black cursor-pointer py-3 flex items-center gap-3 font-black text-[11px] uppercase italic tracking-widest text-primary">
                        <LogIn className="size-4" /> Entrar / Sincronizar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16 custom-scrollbar">
            {children}
          </main>
        </SidebarInset>
      </div>

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
                Sua Gemini API Key alimenta as análises biomecânicas e a geração de planilhas. Tudo é salvo localmente e sincronizado na sua nuvem privada.
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
    </SidebarProvider>
  );
}

function LogoDisplay() {
  const { state } = useSidebar();
  
  if (state === "collapsed") {
    return (
      <div className="font-headline font-black text-2xl italic tracking-tighter flex flex-col items-center leading-none">
        <span className="text-white">C</span>
        <span className="text-primary">J</span>
      </div>
    );
  }

  return (
    <div className="font-headline font-black text-4xl italic tracking-tighter flex flex-col items-center leading-none">
      <span className="text-white">CORRE</span>
      <span className="text-primary">JUNTO</span>
    </div>
  );
}
