
"use client";

import Link from "next/link";
import { TrendingUp, BookOpen, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth, useUser } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const auth = useAuth();
  const { user, isLoading } = useUser();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Bem-vindo!" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro no Login" });
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try { await signOut(auth); } catch (error) { console.error(error); }
  };

  return (
    <nav className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 transition-all">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="text-xl font-bold text-primary flex items-center gap-2 shrink-0">
            <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="tracking-tight">Corre Junto</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Calculadoras</Link>
            <Link href="/insights" className="text-sm font-medium hover:text-primary transition-colors">Dicionário</Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                    <AvatarFallback>{user.displayName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/perfil" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Meu Perfil de Atleta</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/insights" className="cursor-pointer">
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>Dicionário do Corredor</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={handleLogin} variant="secondary" size="sm" className="gap-2">
              <User className="w-4 h-4" />
              <span>Entrar</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
