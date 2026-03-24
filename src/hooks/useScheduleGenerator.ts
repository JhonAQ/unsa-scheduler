import { useState, useMemo, useEffect } from "react";
import type { Course } from "../lib/types";
import { generateSchedules } from "../lib/scheduler";
import { getScheduleMetrics, COLORS } from "../utils/scheduler";

export type SortOrder = "default" | "compact" | "free_days" | "start_late" | "end_early";

export function useScheduleGenerator(activeCourses: Course[], allCourses: Course[]) {
  const [currentComboIdx, setCurrentComboIdx] = useState(0);

  const [sortBy, setSortBy] = useState<SortOrder>("default");
  const [wantedFreeDays, setWantedFreeDays] = useState<string[]>([]);
  const [minTime, setMinTime] = useState<number>(7 * 60); // 7:00
  const [maxTime, setMaxTime] = useState<number>(20 * 60 + 10); // 20:10
  const [maxTotalGaps, setMaxTotalGaps] = useState<number>(12 * 60); // Max hours empty

  // Restart combo idx when filters change
  useEffect(() => {
    setCurrentComboIdx(0);
  }, [sortBy, wantedFreeDays, minTime, maxTime, maxTotalGaps, activeCourses]);

  const toggleWantedFreeDay = (day: string) => {
    setWantedFreeDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const combinations = useMemo(() => {
    return generateSchedules(activeCourses);
  }, [activeCourses]);

  const processedCombinations = useMemo(() => {
    let processed = combinations.map((combo) => ({
      combo,
      metrics: getScheduleMetrics(combo),
    }));

    if (wantedFreeDays.length > 0) {
      processed = processed.filter((p) =>
        wantedFreeDays.every((d) => p.metrics.freeDays.includes(d))
      );
    }

    if (minTime > 7 * 60) {
      processed = processed.filter((p) => p.metrics.earliestStart >= minTime);
    }

    if (maxTime < 21 * 60) {
      processed = processed.filter((p) => p.metrics.latestEnd <= maxTime);
    }

    if (maxTotalGaps < 12 * 60) {
      processed = processed.filter(
        (p) => p.metrics.totalGapsMinutes <= maxTotalGaps
      );
    }

    if (sortBy === "compact") {
      processed.sort(
        (a, b) => a.metrics.totalGapsMinutes - b.metrics.totalGapsMinutes
      );
    } else if (sortBy === "free_days") {
      processed.sort(
        (a, b) => b.metrics.freeDays.length - a.metrics.freeDays.length
      );
    } else if (sortBy === "start_late") {
      processed.sort(
        (a, b) => b.metrics.earliestStart - a.metrics.earliestStart
      );
    } else if (sortBy === "end_early") {
      processed.sort((a, b) => a.metrics.latestEnd - b.metrics.latestEnd);
    }

    return processed.map((p) => p.combo);
  }, [combinations, sortBy, wantedFreeDays, minTime, maxTime, maxTotalGaps]);

  const activeCombo = processedCombinations[currentComboIdx];

  const activeComboSessions = useMemo(() => {
    if (!activeCombo) return [];
    const all: any[] = [];
    Object.entries(activeCombo.selection).forEach(([curso, sel]) => {
      const cIdx = allCourses.findIndex((c) => c.curso === curso);
      const bgColor = COLORS[cIdx % COLORS.length] || "bg-gray-800";
      if (sel.teoria) {
        sel.teoria.sesiones.forEach((sesion: any, idx: number) => {
          all.push({
            id: `${curso}-teo-${sel.teoria!.seccion}-${sesion.dia}-${idx}`,
            curso,
            seccion: sel.teoria!.seccion,
            tipoSec: "Teoría",
            tipo: sesion.tipo,
            dia: sesion.dia,
            hora_inicio: sesion.hora_inicio,
            hora_fin: sesion.hora_fin,
            bgColor,
          });
        });
      }
      if (sel.laboratorio) {
        sel.laboratorio.sesiones.forEach((sesion: any, idx: number) => {
          all.push({
            id: `${curso}-lab-${sel.laboratorio!.seccion}-${sesion.dia}-${idx}`,
            curso,
            seccion: sel.laboratorio!.seccion,
            tipoSec: "Laboratorio",
            tipo: sesion.tipo,
            dia: sesion.dia,
            hora_inicio: sesion.hora_inicio,
            hora_fin: sesion.hora_fin,
            bgColor,
          });
        });
      }
    });
    return all;
  }, [activeCombo, allCourses]);

  const resetComboIdx = () => setCurrentComboIdx(0);

  return {
    sortBy,
    setSortBy,
    wantedFreeDays,
    toggleWantedFreeDay,
    minTime,
    setMinTime,
    maxTime,
    setMaxTime,
    maxTotalGaps,
    setMaxTotalGaps,
    currentComboIdx,
    setCurrentComboIdx,
    processedCombinations,
    activeComboSessions,
    resetComboIdx,
  };
}
