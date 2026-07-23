"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateWorkoutDate, getWorkoutTypeColor } from "@/lib/calendar-utils";
import type { TrainingPlan, Workout } from "@/lib/types";

const weekDayLabels = ["D", "S", "T", "Q", "Q", "S", "S"];

interface DayWorkout {
  date: Date;
  workout: Workout;
  weekNumber: number;
}

interface MonthCalendarProps {
  plan: TrainingPlan;
  raceDate?: string;
  onSelectWorkout: (workout: Workout, weekNumber: number) => void;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function MonthCalendar({ plan, raceDate, onSelectWorkout }: MonthCalendarProps) {
  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const dayWorkouts = React.useMemo<DayWorkout[]>(() => {
    const out: DayWorkout[] = [];
    plan.weeklyPlans.forEach((week) => {
      week.runs.forEach((run) => {
        if (run.type.includes("DESCANSO")) return;
        const date = calculateWorkoutDate(week.weekNumber, run.day, raceDate, plan.durationWeeks);
        out.push({ date, workout: run, weekNumber: week.weekNumber });
      });
    });
    return out.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [plan, raceDate]);

  const [viewDate, setViewDate] = React.useState(() => {
    const upcoming = dayWorkouts.find((d) => d.date >= today) || dayWorkouts[0];
    const ref = upcoming ? upcoming.date : today;
    return new Date(ref.getFullYear(), ref.getMonth(), 1);
  });

  const byDayKey = React.useMemo(() => {
    const map = new Map<string, DayWorkout[]>();
    dayWorkouts.forEach((dw) => {
      const key = dw.date.toDateString();
      const arr = map.get(key) || [];
      arr.push(dw);
      map.set(key, arr);
    });
    return map;
  }, [dayWorkouts]);

  const monthLabel = viewDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const cells = React.useMemo(() => {
    const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [viewDate]);

  const goMonth = (delta: number) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const legend = React.useMemo(() => Array.from(new Set(dayWorkouts.map((d) => d.workout.type))), [dayWorkouts]);

  return (
    <div className="card-plain">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h3 className="font-bold text-lg capitalize tracking-tight">{monthLabel}</h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => goMonth(-1)}
            className="size-8 rounded-lg border border-border flex items-center justify-center hover:border-primary/40 hover:text-primary transition-colors"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="text-[11px] font-semibold px-3 h-8 rounded-lg border border-border hover:border-primary/40 hover:text-primary transition-colors"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => goMonth(1)}
            className="size-8 rounded-lg border border-border flex items-center justify-center hover:border-primary/40 hover:text-primary transition-colors"
            aria-label="Próximo mês"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {weekDayLabels.map((d, i) => (
          <div key={i} className="text-center text-[10px] uppercase tracking-widest text-muted-foreground font-semibold py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === viewDate.getMonth();
          const isToday = sameDay(d, today);
          const items = byDayKey.get(d.toDateString()) || [];
          return (
            <div
              key={i}
              className={cn(
                "min-h-[76px] sm:min-h-[96px] rounded-xl border p-1.5 flex flex-col gap-1 transition-colors",
                inMonth ? "border-border bg-secondary/20" : "border-transparent opacity-30",
                isToday && "border-primary/60 bg-primary/5"
              )}
            >
              <span className={cn("num text-[11px] font-semibold", isToday ? "text-primary" : "text-muted-foreground")}>
                {d.getDate()}
              </span>
              <div className="flex flex-col gap-1 overflow-hidden">
                {items.map((dw) => {
                  const color = getWorkoutTypeColor(dw.workout.type);
                  const label = `${dw.workout.type} · ${dw.workout.distance}`;
                  return (
                    <button
                      key={dw.workout.id}
                      type="button"
                      onClick={() => onSelectWorkout(dw.workout, dw.weekNumber)}
                      title={label}
                      aria-label={label}
                      className={cn("transition-transform hover:scale-[1.03]", dw.workout.completed && "opacity-50")}
                    >
                      {/* Mobile: só um ponto colorido — texto truncava pra 1 letra em colunas estreitas. */}
                      <span
                        className="sm:hidden block size-2.5 rounded-full mx-auto"
                        style={{ background: `hsl(${color})` }}
                      />
                      <span
                        className="hidden sm:block text-left rounded-md px-1.5 py-1 text-[10px] font-semibold leading-tight truncate"
                        style={{ background: `hsl(${color} / 0.16)`, color: `hsl(${color})` }}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!!legend.length && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-5 pt-4 border-t border-border">
          {legend.map((type) => {
            const color = getWorkoutTypeColor(type);
            return (
              <div key={type} className="flex items-center gap-1.5 text-[10.5px] font-semibold text-muted-foreground">
                <span className="size-2 rounded-full shrink-0" style={{ background: `hsl(${color})` }} />
                {type}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
