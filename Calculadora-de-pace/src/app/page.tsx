
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RunningEngine } from "@/components/RunningEngine";
import { StrategySimulator } from "@/components/StrategySimulator";
import { HRZoneMapper } from "@/components/HRZoneMapper";
import { HydrationPlanner } from "@/components/HydrationPlanner";
import { RunWalkCalculator } from "@/components/RunWalkCalculator";
import { RacePredictor } from "@/components/RacePredictor";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Calculator, LineChart, Heart, Droplets, Footprints, TrendingUp, Sparkles } from "lucide-react";
import { useUser } from "@/firebase";

export default function Home() {
  const { user, isLoading } = useUser();

  return (
    <div className="min-h-screen bg-background running-bg-gradient">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        <header className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl md:text-4xl font-bold text-primary mb-1 tracking-tight">Calculadora de pace</h1>
          <p className="text-muted-foreground text-xs md:text-base">Performance completa para seus treinos e provas.</p>
        </header>

        {!isLoading && !user && (
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-700">
            <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-primary">Melhore sua experiência!</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Entre para salvar seus <b>recordes</b> e <b>estratégias</b> automaticamente.
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue="engine" className="space-y-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full bg-secondary/30 h-auto p-1.5 gap-1.5 rounded-xl border border-border/20 overflow-x-auto">
            <TabsTrigger value="engine" className="flex flex-col items-center justify-center gap-1 py-2 text-[9px] md:text-xs font-bold uppercase tracking-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-lg text-center h-full">
              <Calculator className="w-3 h-3 md:w-4 md:h-4" />
              <span>Pace</span>
            </TabsTrigger>
            <TabsTrigger value="strategy" className="flex flex-col items-center justify-center gap-1 py-2 text-[9px] md:text-xs font-bold uppercase tracking-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-lg text-center h-full">
              <LineChart className="w-3 h-3 md:w-4 md:h-4" />
              <span>Estratégia</span>
            </TabsTrigger>
            <TabsTrigger value="prediction" className="flex flex-col items-center justify-center gap-1 py-2 text-[9px] md:text-xs font-bold uppercase tracking-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-lg text-center h-full">
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
              <span>Preditor</span>
            </TabsTrigger>
            <TabsTrigger value="zones" className="flex flex-col items-center justify-center gap-1 py-2 text-[9px] md:text-xs font-bold uppercase tracking-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-lg text-center h-full">
              <Heart className="w-3 h-3 md:w-4 md:h-4" />
              <span>Zonas</span>
            </TabsTrigger>
            <TabsTrigger value="hydration" className="flex flex-col items-center justify-center gap-1 py-2 text-[9px] md:text-xs font-bold uppercase tracking-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-lg text-center h-full">
              <Droplets className="w-3 h-3 md:w-4 md:h-4" />
              <span>Água</span>
            </TabsTrigger>
            <TabsTrigger value="runwalk" className="flex flex-col items-center justify-center gap-1 py-2 text-[9px] md:text-xs font-bold uppercase tracking-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-lg text-center h-full">
              <Footprints className="w-3 h-3 md:w-4 md:h-4" />
              <span>R/W</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="engine">
            <RunningEngine />
          </TabsContent>
          
          <TabsContent value="strategy">
            <StrategySimulator />
          </TabsContent>

          <TabsContent value="prediction">
            <RacePredictor />
          </TabsContent>

          <TabsContent value="zones">
            <HRZoneMapper />
          </TabsContent>

          <TabsContent value="hydration">
            <HydrationPlanner />
          </TabsContent>

          <TabsContent value="runwalk">
            <RunWalkCalculator />
          </TabsContent>
        </Tabs>

        <Footer />
      </main>
    </div>
  );
}
