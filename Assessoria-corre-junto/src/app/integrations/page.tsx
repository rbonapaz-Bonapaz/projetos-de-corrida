"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TrainingContext } from "@/contexts/TrainingContext";
import { cn } from "@/lib/utils";
import { CheckCircle2, Link2 } from "lucide-react";

const StravaLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-7">
    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.637h4.122L10.379 0 3 14.702h4.122" />
  </svg>
);

const CorosLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-7">
    <path d="M12 4.4L18.6 8.2V15.8L12 19.6L5.4 15.8V8.2L12 4.4ZM12 0L2 5.8V18.2L12 24L22 18.2V5.8L12 0Z" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export default function IntegrationsPage() {
  const context = React.useContext(TrainingContext);
  const stravaConnected = !!context?.activeProfile?.integrations?.strava?.connected;
  const corosConnected = !!context?.activeProfile?.integrations?.coros?.connected;

  const handleToggle = (service: 'strava' | 'coros') => {
    const isConnected = service === 'strava' ? stravaConnected : corosConnected;
    context?.toggleIntegration(service, !isConnected);
  };

  return (
    <DashboardLayout>
      <header className="mb-6">
        <h1 className="text-2xl md:text-[26px] font-bold tracking-tight flex items-center gap-2.5">
          <Link2 className="size-6 text-primary" /> Integrações
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Conecte suas plataformas para importar treinos realizados e exportar treinos planejados.
        </p>
      </header>

      <section className="card-plain">
        <h3 className="eyebrow mb-1">Conexões</h3>
        <p className="text-[12px] text-muted-foreground mb-5">Sincronização automática de dados dos seus dispositivos.</p>

        <div className="flex flex-wrap gap-5">
          <button
            onClick={() => handleToggle('strava')}
            className={cn(
              "group relative flex flex-col items-center justify-center w-36 h-36 rounded-2xl transition-all duration-300 border",
              stravaConnected
                ? "bg-[#FC6100] text-white border-[#FC6100]"
                : "bg-secondary/40 text-[#FC6100] border-border hover:border-[#FC6100]/40"
            )}
          >
            <StravaLogo />
            <span className={cn("mt-2.5 text-[11px] font-semibold", stravaConnected ? "text-white" : "text-muted-foreground")}>
              Strava
            </span>
            {stravaConnected && (
              <div className="absolute top-3 right-3 p-0.5 bg-white rounded-full">
                <CheckCircle2 className="size-4 text-[#FC6100]" />
              </div>
            )}
          </button>

          <button
            onClick={() => handleToggle('coros')}
            className={cn(
              "group relative flex flex-col items-center justify-center w-36 h-36 rounded-2xl transition-all duration-300 border",
              corosConnected
                ? "bg-foreground text-background border-foreground"
                : "bg-secondary/40 text-foreground border-border hover:border-foreground/30"
            )}
          >
            <CorosLogo />
            <span className={cn("mt-2.5 text-[11px] font-semibold", corosConnected ? "text-background" : "text-muted-foreground")}>
              Coros
            </span>
            {corosConnected && (
              <div className="absolute top-3 right-3 p-0.5 bg-background rounded-full">
                <CheckCircle2 className="size-4 text-foreground" />
              </div>
            )}
          </button>
        </div>
      </section>
    </DashboardLayout>
  );
}
