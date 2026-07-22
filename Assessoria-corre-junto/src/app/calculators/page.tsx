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
      <header className="mb-6">
        <h1 className="text-2xl md:text-[26px] font-bold tracking-tight flex items-center gap-2.5">
          <Calculator className="size-6 text-primary" /> Central de cálculos
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Performance completa para seus treinos e provas.
        </p>
      </header>

      <Tabs defaultValue="engine" className="space-y-5">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full h-auto p-1.5 gap-1.5 rounded-xl">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold transition-all rounded-lg text-center h-full"
            >
              <t.icon className="w-4 h-4" />
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
    </DashboardLayout>
  );
}
