"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TrainingContext } from "@/contexts/TrainingContext";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const StravaLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-8">
    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.637h4.122L10.379 0 3 14.702h4.122" />
  </svg>
);

const CorosLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-8">
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
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        <header className="space-y-3 px-2">
          <h1 className="text-4xl font-headline font-bold text-white">Integrações</h1>
          <p className="text-[#8a8d98] text-sm md:text-base max-w-2xl font-medium">
            Conecte suas plataformas para importar treinos realizados e exportar treinos planejados.
          </p>
        </header>

        <Card className="bg-[#0f1116] border-none rounded-[2rem] shadow-2xl p-8 md:p-12">
          <CardContent className="p-0 space-y-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-headline font-bold text-white">Conexões</h3>
              <p className="text-[#8a8d98] text-sm font-medium">
                Conecte suas plataformas para sincronização automática.
              </p>
            </div>

            <div className="flex flex-wrap gap-6 pt-4">
              {/* Strava Button */}
              <button 
                onClick={() => handleToggle('strava')}
                className={cn(
                  "group relative flex flex-col items-center justify-center size-36 md:size-44 rounded-[2rem] transition-all duration-300",
                  stravaConnected 
                    ? "bg-[#FC6100] text-white shadow-lg shadow-orange-500/20" 
                    : "bg-[#191b21] text-[#FC6100] hover:bg-[#20232b] hover:scale-105"
                )}
              >
                <StravaLogo />
                <span className={cn(
                  "mt-3 text-[10px] font-black uppercase tracking-[0.2em] italic",
                  stravaConnected ? "text-white" : "text-[#8a8d98]"
                )}>Strava</span>
                {stravaConnected && (
                  <div className="absolute top-4 right-4 p-1 bg-white rounded-full">
                    <CheckCircle2 className="size-4 text-[#FC6100]" />
                  </div>
                )}
              </button>

              {/* Coros Button */}
              <button 
                onClick={() => handleToggle('coros')}
                className={cn(
                  "group relative flex flex-col items-center justify-center size-36 md:size-44 rounded-[2rem] transition-all duration-300",
                  corosConnected 
                    ? "bg-white text-black shadow-lg shadow-white/10" 
                    : "bg-[#191b21] text-white hover:bg-[#20232b] hover:scale-105"
                )}
              >
                <CorosLogo />
                <span className={cn(
                  "mt-3 text-[10px] font-black uppercase tracking-[0.2em] italic",
                  corosConnected ? "text-black" : "text-[#8a8d98]"
                )}>Coros</span>
                {corosConnected && (
                  <div className="absolute top-4 right-4 p-1 bg-black rounded-full">
                    <CheckCircle2 className="size-4 text-white" />
                  </div>
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}