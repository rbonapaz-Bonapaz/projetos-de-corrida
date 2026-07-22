"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Trophy, Star, History, Calendar, Clock, MapPin, Milestone, Zap } from "lucide-react";

const records = [
  { distance: "5K", time: "18:42", date: "15 Ago, 2024", event: "Circuito de Verão", pace: "3:44/km" },
  { distance: "10K", time: "39:15", date: "22 Set, 2024", event: "Corrida da Cidade", pace: "3:55/km" },
  { distance: "Meia Maratona", time: "1:26:40", date: "05 Out, 2024", event: "Meia do Grande Canal", pace: "4:06/km" },
  { distance: "Maratona", time: "3:12:05", date: "20 Nov, 2023", event: "Maratona de Berlim", pace: "4:33/km" },
];

const milestones = [
  { title: "Quebra do sub 1:30 na meia", date: "Out 2024", desc: "Melhora de 4 minutos na Meia do Grande Canal" },
  { title: "Streak de 100 dias", date: "Set 2024", desc: "Completou 100 dias consecutivos de treinamento" },
  { title: "Evolução VO2 Max", date: "Ago 2024", desc: "Atingiu VDOT 54 pela primeira vez" },
];

export default function VaultPage() {
  return (
    <DashboardLayout>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-[26px] font-bold tracking-tight flex items-center gap-2.5">
            <Trophy className="size-6 text-primary" /> Cofre de recordes
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">Seu legado atlético e marcos pessoais.</p>
        </div>
        <span className="chip w-fit">
          <Trophy className="size-3.5 text-primary" /> Atleta nível 14
        </span>
      </header>

      <div className="bento mb-5">
        {records.map((record) => (
          <div key={record.distance} className="card-plain span-3">
            <p className="eyebrow !text-primary">{record.distance}</p>
            <div className="num text-3xl font-bold mt-1">{record.time}</div>
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <Calendar className="size-3" /> {record.date}
              </div>
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <MapPin className="size-3" /> <span className="truncate">{record.event}</span>
              </div>
            </div>
            <span className="tag num mt-3 inline-block">{record.pace}</span>
          </div>
        ))}
      </div>

      <div className="bento">
        <section className="card-plain span-8">
          <h3 className="eyebrow flex items-center gap-1.5 mb-5">
            <History className="size-3.5 text-primary" /> Histórico de marcos
          </h3>
          <div className="space-y-5">
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-4 relative">
                {i !== milestones.length - 1 && <div className="absolute left-[15px] top-9 bottom-[-20px] w-px bg-border" />}
                <div className="size-8 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 z-10">
                  <Star className="size-4 text-primary" />
                </div>
                <div className="pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[13px]">{m.title}</span>
                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-secondary rounded">{m.date}</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card-plain span-4 h-fit">
          <h3 className="eyebrow mb-4">Métricas vitalícias</h3>
          <div className="flex flex-col gap-3">
            <div className="stat-tile flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] text-muted-foreground"><Milestone className="size-4" /> Distância total</span>
              <b className="num !text-base !mt-0">4.285 km</b>
            </div>
            <div className="stat-tile flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] text-muted-foreground"><Clock className="size-4" /> Tempo de treino</span>
              <b className="num !text-base !mt-0">412 hrs</b>
            </div>
            <div className="stat-tile flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] text-muted-foreground"><Zap className="size-4" /> Calorias queimadas</span>
              <b className="num !text-base !mt-0">284k kcal</b>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
