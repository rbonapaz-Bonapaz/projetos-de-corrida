"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, LineChart, Heart, Droplets, Footprints, TrendingUp } from "lucide-react";

import { RunningEngine } from "@/components/calculators/RunningEngine";
import { StrategySimulator } from "@/components/calculators/StrategySimulator";
import { RacePredictor } from "@/components/calculators/RacePredictor";
import { HRZoneMapper } from "@/components/calculators/HRZoneMapper";
import { HydrationPlanner } from "@/components/calculators/HydrationPlanner";
import { RunWalkCalculator } from "@/components/calculators/RunWalkCalculator";

const TABS = [
  { value: "engine", label: "Pace", icon: Calculator },
  { value: "strategy", label: "Estratégia", icon: LineChart },
  { value: "prediction", label: "Preditor", icon: TrendingUp },
  { value: "zones", label: "Zonas", icon: Heart },
  { value: "hydration", label: "Água", icon: Droplets },
  { value: "runwalk", label: "R/W", icon: Footprints },
];

export default function CalculatorsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
        <header className="px-1">
          <h1 className="text-3xl md:text-6xl font-headline font-black uppercase italic tracking-tighter leading-none">
            <span className="text-white">CENTRAL DE</span>{" "}
            <span className="text-primary">CÁLCULOS</span>
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-medium mt-3">
            Performance completa para seus treinos e provas.
          </p>
        </header>

        <Tabs defaultValue="engine" className="space-y-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full bg-secondary/30 h-auto p-1.5 gap-1.5 rounded-xl border border-border/20">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="flex flex-col items-center justify-center gap-1 py-2 text-[9px] md:text-xs font-black uppercase italic tracking-tight data-[state=active]:bg-primary data-[state=active]:text-black transition-all rounded-lg text-center h-full"
              >
                <t.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="engine"><RunningEngine /></TabsContent>
          <TabsContent value="strategy"><StrategySimulator /></TabsContent>
          <TabsContent value="prediction"><RacePredictor /></TabsContent>
          <TabsContent value="zones"><HRZoneMapper /></TabsContent>
          <TabsContent value="hydration"><HydrationPlanner /></TabsContent>
          <TabsContent value="runwalk"><RunWalkCalculator /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
