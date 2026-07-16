"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, History, Calendar, Clock, MapPin, Milestone, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const records = [
  { distance: "5K", time: "18:42", date: "15 Ago, 2024", event: "Circuito de Verão", pace: "3:44/km" },
  { distance: "10K", time: "39:15", date: "22 Set, 2024", event: "Corrida da Cidade", pace: "3:55/km" },
  { distance: "Meia Maratona", time: "1:26:40", date: "05 Out, 2024", event: "Meia do Grande Canal", pace: "4:06/km" },
  { distance: "Maratona", time: "3:12:05", date: "20 Nov, 2023", event: "Maratona de Berlim", pace: "4:33/km" },
];

export default function VaultPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-headline font-bold">Cofre de Recordes</h1>
            <p className="text-muted-foreground">Seu legado atlético e marcos pessoais verificados.</p>
          </div>
          <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-xl border">
            <Trophy className="size-5 text-accent" />
            <span className="font-bold font-headline">Atleta Nível 14</span>
          </div>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {records.map((record) => (
            <Card key={record.distance} className="bg-card border-border hover:border-accent transition-all group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-accent/20 group-hover:bg-accent transition-colors" />
              <CardHeader className="pb-2">
                <CardDescription className="text-accent font-bold tracking-widest uppercase text-[10px]">{record.distance}</CardDescription>
                <CardTitle className="font-headline text-3xl font-bold">{record.time}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="size-3 text-muted-foreground" />
                    <span>{record.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="size-3 text-muted-foreground" />
                    <span className="truncate">{record.event}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-secondary/50 text-muted-foreground font-mono">
                  {record.pace}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <History className="size-5 text-accent" /> Histórico de Marcos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { title: "Quebra do Sub 1:30 na Meia", date: "Out 2024", desc: "Melhora de 4 minutos na Meia do Grande Canal" },
                  { title: "Streak de 100 Dias", date: "Set 2024", desc: "Completou 100 dias consecutivos de treinamento" },
                  { title: "Evolução VO2 Max", date: "Ago 2024", desc: "Atingiu VDOT 54 pela primeira vez" },
                ].map((m, i) => (
                  <div key={i} className="flex gap-4 relative">
                    {i !== 2 && <div className="absolute left-[15px] top-10 bottom-[-10px] w-0.5 bg-border" />}
                    <div className="size-8 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 z-10">
                      <Star className="size-4 text-accent" />
                    </div>
                    <div className="pb-6">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-headline">{m.title}</span>
                        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary rounded">{m.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border h-fit">
            <CardHeader>
              <CardTitle className="font-headline">Métricas Vitalícias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <Milestone className="size-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Distância Total</span>
                </div>
                <span className="font-bold font-headline">4.285 km</span>
              </div>
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <Clock className="size-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tempo de Treino</span>
                </div>
                <span className="font-bold font-headline">412 hrs</span>
              </div>
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <Zap className="size-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Calorias Queimadas</span>
                </div>
                <span className="font-bold font-headline">284k kcal</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
