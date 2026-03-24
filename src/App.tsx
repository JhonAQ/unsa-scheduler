import React, { useState, useMemo } from "react";
import { AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { generateSchedules } from "./lib/scheduler";
import type { Course, ScheduleCombination } from "./lib/types";
import initialData from "../data/schedule.json";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function parseTimeStr(time: string) {
  const [h, m] = time.trim().split(":").map(Number);
  return h * 60 + m;
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const COLORS = [
  "bg-[#FF3366]",
  "bg-[#00E676]",
  "bg-[#2979FF]",
  "bg-[#FF9100]",
  "bg-[#D500F9]",
  "bg-[#00E5FF]",
  "bg-[#1DE9B6]",
];

function getInitialCourses(): Course[] {
  if (!initialData || !initialData.horario_academico) return [];
  return initialData.horario_academico.map((c: any) => {
    const teoriasMap: Record<string, any> = {};
    const laboratoriosMap: Record<string, any> = {};

    c.secciones.forEach((sec: any) => {
      sec.sesiones.forEach((ses: any) => {
        const tipoLower = ses.tipo.toLowerCase();
        if (
          tipoLower.includes("teoría") ||
          tipoLower.includes("teoria") ||
          tipoLower.includes("teor\u00c3\u00ada")
        ) {
          if (!teoriasMap[sec.seccion]) {
            teoriasMap[sec.seccion] = {
              seccion: sec.seccion,
              total_sesiones_semanales: 0,
              sesiones: [],
            };
          }
          teoriasMap[sec.seccion].sesiones.push(ses);
        } else if (
          tipoLower.includes("laboratorio") ||
          tipoLower.includes("práctica") ||
          tipoLower.includes("practica") ||
          tipoLower.includes("pr\u00c3\u00a1ctica")
        ) {
          if (!laboratoriosMap[sec.seccion]) {
            laboratoriosMap[sec.seccion] = {
              seccion: sec.seccion,
              total_sesiones_semanales: 0,
              sesiones: [],
            };
          }
          laboratoriosMap[sec.seccion].sesiones.push(ses);
        }
      });
    });

    return {
      curso: c.curso,
      secciones: c.secciones,
      teorias: Object.values(teoriasMap),
      laboratorios: Object.values(laboratoriosMap),
    };
  });
}

export default function App() {
  const [courses] = useState<Course[]>(getInitialCourses);
  const [errorError] = useState<string | null>(null);

  const [excludedCourses, setExcludedCourses] = useState<Set<string>>(
    new Set(),
  );
  const [excludedSections, setExcludedSections] = useState<Set<string>>(
    new Set(),
  );

  const [currentComboIdx, setCurrentComboIdx] = useState(0);
  const [viewMode, setViewMode] = useState<
    "generator" | "all_schedules" | "social"
  >("generator");

  const [sortBy, setSortBy] = useState<
    "default" | "compact" | "free_days" | "start_late" | "end_early"
  >("default");
  const [wantedFreeDays, setWantedFreeDays] = useState<string[]>([]);
  const [minTime, setMinTime] = useState<number>(7 * 60); // 7:00
  const [maxTime, setMaxTime] = useState<number>(20 * 60 + 10); // 20:10
  const [maxTotalGaps] = useState<number>(12 * 60); // Max hours empty

  // Restart combo idx when filters change
  React.useEffect(() => {
    setCurrentComboIdx(0);
  }, [sortBy, wantedFreeDays, minTime, maxTime, maxTotalGaps]);

  const toggleWantedFreeDay = (day: string) => {
    setWantedFreeDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const activeCourses = useMemo(() => {
    return courses
      .filter((c) => !excludedCourses.has(c.curso))
      .map((c) => ({
        ...c,
        teorias: c.teorias.filter(
          (s) => !excludedSections.has(`${c.curso}-teoria-${s.seccion}`),
        ),
        laboratorios: c.laboratorios.filter(
          (s) => !excludedSections.has(`${c.curso}-lab-${s.seccion}`),
        ),
      }))
      .filter((c) => c.teorias.length > 0 || c.laboratorios.length > 0);
  }, [courses, excludedCourses, excludedSections]);

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
        wantedFreeDays.every((d) => p.metrics.freeDays.includes(d)),
      );
    }

    if (minTime > 7 * 60) {
      processed = processed.filter((p) => p.metrics.earliestStart >= minTime);
    }

    if (maxTime < 21 * 60) {
      processed = processed.filter((p) => p.metrics.latestEnd <= maxTime);
    }

    // Default max gap filter ignores if maxTotalGaps is basically "infinite"
    if (maxTotalGaps < 12 * 60) {
      processed = processed.filter(
        (p) => p.metrics.totalGapsMinutes <= maxTotalGaps,
      );
    }

    if (sortBy === "compact") {
      processed.sort(
        (a, b) => a.metrics.totalGapsMinutes - b.metrics.totalGapsMinutes,
      );
    } else if (sortBy === "free_days") {
      processed.sort(
        (a, b) => b.metrics.freeDays.length - a.metrics.freeDays.length,
      );
    } else if (sortBy === "start_late") {
      processed.sort(
        (a, b) => b.metrics.earliestStart - a.metrics.earliestStart,
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
      const cIdx = courses.findIndex((c) => c.curso === curso);
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
  }, [activeCombo, courses]);

  const toggleCourse = (curso: string) => {
    setExcludedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(curso)) next.delete(curso);
      else next.add(curso);
      return next;
    });
    setCurrentComboIdx(0);
  };

  const toggleSection = (curso: string, seccion: string) => {
    const key = `${curso}-${seccion}`;
    setExcludedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setCurrentComboIdx(0);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col p-2 md:p-4 max-w-7xl mx-auto space-y-4">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-[#111] pb-2 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl tracking-tighter text-[#111] mb-1 leading-none uppercase">
            Schedule{" "}
            <span className="bg-[#FFEA00] px-2 py-0.5 select-none border-2 border-[#111] rotate-[-2deg] inline-block shadow-[2px_2px_0px_#111]">
              Generator
            </span>
          </h1>
          <p className="text-sm font-bold font-mono text-gray-700">
            EXPLORADOR UNIVERSITARIO V1.0
          </p>
        </div>

        {courses.length > 0 && (
          <div className="flex flex-wrap gap-2 font-mono font-bold text-sm shrink-0 items-center justify-end flex-1">
            <button
              onClick={() => setViewMode("generator")}
              className={cn(
                "px-4 py-2 border-2 border-black transition-transform uppercase",
                viewMode === "generator"
                  ? "bg-[#FFEA00] shadow-[2px_2px_0px_#111]"
                  : "bg-white hover:bg-gray-100 shadow-[2px_2px_0px_#111]",
              )}
            >
              Generador
            </button>
            <button
              onClick={() => setViewMode("all_schedules")}
              className={cn(
                "px-4 py-2 border-2 border-black transition-transform uppercase",
                viewMode === "all_schedules"
                  ? "bg-[#FFEA00] shadow-[2px_2px_0px_#111]"
                  : "bg-white hover:bg-gray-100 shadow-[2px_2px_0px_#111]",
              )}
            >
              Todos los horarios
            </button>
            <button
              onClick={() => setViewMode("social")}
              className={cn(
                "px-4 py-2 border-2 border-black transition-transform uppercase",
                viewMode === "social"
                  ? "bg-[#FF3366] text-white shadow-[2px_2px_0px_#111]"
                  : "bg-white hover:bg-gray-100 shadow-[2px_2px_0px_#111]",
              )}
            >
              Social
            </button>
          </div>
        )}
      </header>

      {errorError && (
        <div className="bg-[#FF3366] text-white p-2 neo-brutalist flex items-center gap-2 font-mono font-bold text-sm shrink-0">
          <AlertTriangle strokeWidth={3} className="w-4 h-4" /> {errorError}
        </div>
      )}

      {courses.length > 0 && viewMode === "generator" && (
        <main className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0 overflow-hidden">
          <aside className="lg:col-span-1 flex flex-col min-h-0 gap-3">
            <div className="bg-[#FF9100] border-4 border-black p-3 md:p-4 neo-brutalist shadow-[4px_4px_0px_#111] font-mono shrink-0">
              <div className="flex flex-col gap-4">
                {/* Select Ordenar */}
                <div className="space-y-2 w-full">
                  <label className="block text-black font-black uppercase text-xs leading-tight">
                    Ordenar
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full p-2 text-xs border-2 border-black bg-white appearance-none outline-none font-bold focus:ring-0 shadow-[2px_2px_0px_#111] cursor-pointer"
                  >
                    <option value="default">Por defecto</option>
                    <option value="compact">Compacto</option>
                    <option value="free_days">Días Libres</option>
                    <option value="start_late">Tardes</option>
                    <option value="end_early">Mañanas</option>
                  </select>
                </div>

                <div className="w-full grid grid-cols-2 gap-4">
                  {/* Días Libres */}
                  <div className="space-y-2 col-span-2 2xl:col-span-1">
                    <label className="block text-black font-black uppercase text-xs leading-tight">
                      Día Libre
                    </label>
                    <div className="flex gap-1.5 justify-start">
                      {[
                        "Lunes",
                        "Martes",
                        "Miércoles",
                        "Jueves",
                        "Viernes",
                      ].map((d) => (
                        <button
                          key={d}
                          onClick={() => toggleWantedFreeDay(d)}
                          className={cn(
                            "p-1 border-2 border-black font-bold uppercase transition-transform flex-1 text-xs text-center max-w-[32px]",
                            wantedFreeDays.includes(d)
                              ? "bg-black text-white shadow-[2px_2px_0px_#111] translate-y-0.5"
                              : "bg-white hover:bg-gray-100 shadow-[2px_2px_0px_#111]",
                          )}
                          title={"Exigir " + d + " libre"}
                        >
                          {d.charAt(0)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rango Horario */}
                  <div className="space-y-2 col-span-2 2xl:col-span-1">
                    <label className="block text-black font-black uppercase text-xs leading-tight">
                      Rango Horario
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        min="07:00"
                        max="21:00"
                        step="1800"
                        value={
                          String(Math.floor(minTime / 60)).padStart(2, "0") +
                          ":" +
                          String(minTime % 60).padStart(2, "0")
                        }
                        onChange={(e) => {
                          const [h, m] = e.target.value.split(":").map(Number);
                          setMinTime(h * 60 + m);
                        }}
                        className="border-2 border-black px-1.5 py-1 flex-1 bg-white font-bold outline-none font-mono text-xs"
                      />
                      <span className="font-black text-xs">-</span>
                      <input
                        type="time"
                        min="07:00"
                        max="21:00"
                        step="1800"
                        value={
                          String(Math.floor(maxTime / 60)).padStart(2, "0") +
                          ":" +
                          String(maxTime % 60).padStart(2, "0")
                        }
                        onChange={(e) => {
                          const [h, m] = e.target.value.split(":").map(Number);
                          setMaxTime(h * 60 + m);
                        }}
                        className="border-2 border-black px-1.5 py-1 flex-1 bg-white font-bold outline-none font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white border-4 border-black p-3 md:p-4 flex flex-col flex-1 min-h-0 shadow-[4px_4px_0px_#111]">
              <h2 className="text-xl mb-3 bg-black text-white px-2 py-1 inline-block uppercase shrink-0">
                Cursos
              </h2>

              <div className="space-y-2 font-mono overflow-y-auto flex-1 pr-2 custom-scrollbar">
                {courses.map((course) => {
                  const isExcluded = excludedCourses.has(course.curso);
                  return (
                    <details
                      key={course.curso}
                      open
                      className="space-y-2 group group-open:bg-gray-50 pb-2 border-b-2 border-dashed border-gray-200 last:border-b-0"
                    >
                      <summary className="flex items-center gap-2 font-bold cursor-pointer text-sm sm:text-base outline-none select-none py-1">
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={() => toggleCourse(course.curso)}
                          className="w-5 h-5 accent-black border-2 border-black"
                        />
                        <span
                          className={cn(
                            isExcluded && "line-through text-gray-400",
                          )}
                        >
                          {course.curso}
                        </span>
                      </summary>
                      <div className="pl-6 space-y-3 mt-2 pb-2">
                        {course.teorias.length > 0 && (
                          <div>
                            <span className="text-xs text-gray-500 font-bold uppercase mb-1 block">
                              Teoría
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {course.teorias.map((sec) => {
                                const key = `${course.curso}-teoria-${sec.seccion}`;
                                const secExcluded = excludedSections.has(key);
                                return (
                                  <button
                                    key={key}
                                    onClick={() =>
                                      toggleSection(
                                        course.curso,
                                        `teoria-${sec.seccion}`,
                                      )
                                    }
                                    disabled={isExcluded}
                                    className={cn(
                                      "px-2 py-1 border-2 border-black font-bold text-sm transition-transform",
                                      !secExcluded && !isExcluded
                                        ? "bg-[#00E676] shadow-[2px_2px_0px_#111]"
                                        : "bg-gray-200 text-gray-400",
                                      isExcluded &&
                                        "opacity-50 cursor-not-allowed",
                                    )}
                                  >
                                    Sec {sec.seccion}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {course.laboratorios.length > 0 && (
                          <div>
                            <span className="text-xs text-gray-500 font-bold uppercase mb-1 block">
                              Laboratorio
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {course.laboratorios.map((sec) => {
                                const key = `${course.curso}-lab-${sec.seccion}`;
                                const secExcluded = excludedSections.has(key);
                                return (
                                  <button
                                    key={key}
                                    onClick={() =>
                                      toggleSection(
                                        course.curso,
                                        `lab-${sec.seccion}`,
                                      )
                                    }
                                    disabled={isExcluded}
                                    className={cn(
                                      "px-2 py-1 border-2 border-black font-bold text-sm transition-transform",
                                      !secExcluded && !isExcluded
                                        ? "bg-[#00E676] shadow-[2px_2px_0px_#111]"
                                        : "bg-gray-200 text-gray-400",
                                      isExcluded &&
                                        "opacity-50 cursor-not-allowed",
                                    )}
                                  >
                                    Sec {sec.seccion}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="lg:col-span-3 flex flex-col min-h-0 space-y-4">
            {processedCombinations.length === 0 ? (
              <div className="bg-white neo-brutalist p-12 text-center border-4 border-black shadow-[8px_8px_0px_#111]">
                <h2 className="text-4xl text-gray-300 font-bold uppercase mb-4">
                  Cruces o Sin Opciones
                </h2>
                <p className="font-mono text-gray-500">
                  Relaja las restricciones o selecciona más secciones.
                </p>
              </div>
            ) : (
              <div className="bg-white border-4 border-black p-4 md:p-8 relative shadow-[8px_8px_0px_#111] flex flex-col flex-1 min-h-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-8 gap-4 shrink-0">
                  <h3 className="text-xl md:text-3xl font-black uppercase bg-black text-white inline-block px-4 py-2 rotate-[-1deg]">
                    HORARIO GENERADO
                  </h3>
                  <div className="flex items-center gap-2 font-mono text-sm sm:text-base font-bold bg-[#2979FF] text-white px-3 py-1 border-2 border-black neo-brutalist shadow-[2px_2px_0px_#111]">
                    <button
                      disabled={currentComboIdx === 0}
                      onClick={() => setCurrentComboIdx((i) => i - 1)}
                      className="hover:text-[#FFEA00] disabled:opacity-50 transition-colors bg-transparent border-none p-1"
                    >
                      <ArrowLeft className="w-5 h-5" strokeWidth={3} />
                    </button>
                    <span className="uppercase whitespace-nowrap">
                      Opción {currentComboIdx + 1} de{" "}
                      {processedCombinations.length}
                    </span>
                    <button
                      disabled={
                        currentComboIdx === processedCombinations.length - 1
                      }
                      onClick={() => setCurrentComboIdx((i) => i + 1)}
                      className="hover:text-[#FFEA00] disabled:opacity-50 transition-colors bg-transparent border-none p-1"
                    >
                      <ArrowRight className="w-5 h-5" strokeWidth={3} />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border-4 border-black box-border shadow-[4px_4px_0px_#111] flex-1">
                  <div className="min-w-[800px] h-full relative">
                    <ScheduleGrid sessions={activeComboSessions} />
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>
      )}

      {courses.length > 0 && viewMode === "all_schedules" && (
        <AllSchedulesView
          courses={courses}
          excludedCourses={excludedCourses}
          excludedSections={excludedSections}
          toggleSection={toggleSection}
        />
      )}

      {viewMode === "social" && <SocialView />}
    </div>
  );
}

function getScheduleMetrics(combo: ScheduleCombination) {
  const daysMap: Record<string, { start: number; end: number }[]> = {
    Lunes: [],
    Martes: [],
    Miércoles: [],
    Jueves: [],
    Viernes: [],
  };

  for (const course of Object.values(combo.selection)) {
    if (course.teoria) {
      for (const s of course.teoria.sesiones) {
        if (daysMap[s.dia])
          daysMap[s.dia].push({
            start: parseTimeStr(s.hora_inicio),
            end: parseTimeStr(s.hora_fin),
          });
      }
    }
    if (course.laboratorio) {
      for (const s of course.laboratorio.sesiones) {
        if (daysMap[s.dia])
          daysMap[s.dia].push({
            start: parseTimeStr(s.hora_inicio),
            end: parseTimeStr(s.hora_fin),
          });
      }
    }
  }

  let freeDays: string[] = [];
  let totalGapsMinutes = 0;
  let earliestStart = 24 * 60;
  let latestEnd = 0;

  for (const [day, sessions] of Object.entries(daysMap)) {
    if (sessions.length === 0) {
      freeDays.push(day);
      continue;
    }

    sessions.sort((a, b) => a.start - b.start);

    if (sessions[0].start < earliestStart) {
      earliestStart = sessions[0].start;
    }

    if (sessions[sessions.length - 1].end > latestEnd) {
      latestEnd = sessions[sessions.length - 1].end;
    }

    for (let i = 1; i < sessions.length; i++) {
      const gap = sessions[i].start - sessions[i - 1].end;
      if (gap > 0) {
        totalGapsMinutes += gap;
      }
    }
  }

  if (earliestStart === 24 * 60) earliestStart = 0;

  return { freeDays, totalGapsMinutes, earliestStart, latestEnd };
}

function checkSessionOverlap(s1: any, s2: any): boolean {
  if (s1.dia.trim().toLowerCase() !== s2.dia.trim().toLowerCase()) return false;
  const start1 = parseTimeStr(s1.hora_inicio);
  const end1 = parseTimeStr(s1.hora_fin);
  const start2 = parseTimeStr(s2.hora_inicio);
  const end2 = parseTimeStr(s2.hora_fin);
  return start1 < end2 && start2 < end1;
}

function checkSectionOverlapWithinGrid(
  newSec: any,
  gridSessions: any[],
): boolean {
  for (const s of newSec.sesiones) {
    for (const gs of gridSessions) {
      if (checkSessionOverlap(s, gs)) return true;
    }
  }
  return false;
}

function AllSchedulesView({
  courses,
  excludedCourses,
  excludedSections,
  toggleSection,
}: {
  courses: Course[];
  excludedCourses: Set<string>;
  excludedSections: Set<string>;
  toggleSection: (curso: string, seccion: string) => void;
}) {
  const { theoryGrids, labGrids } = useMemo(() => {
    const theories: any[] = [];
    const labs: any[] = [];

    courses.forEach((c, cIdx) => {
      const color = COLORS[cIdx % COLORS.length];

      c.teorias.forEach((t) => {
        theories.push({
          ...t,
          curso: c.curso,
          tipoSec: "Teoría",
          bgColor: color,
        });
      });
      c.laboratorios.forEach((l) => {
        labs.push({
          ...l,
          curso: c.curso,
          tipoSec: "Laboratorio",
          bgColor: color,
        });
      });
    });

    const packIntoGrids = (sections: any[]) => {
      const resultGrids: { id: number; sessions: any[] }[] = [];
      for (const sec of sections) {
        let placed = false;
        for (const grid of resultGrids) {
          if (!checkSectionOverlapWithinGrid(sec, grid.sessions)) {
            grid.sessions.push(
              ...sec.sesiones.map((s: any) => ({
                ...s,
                id: `${sec.curso}-${sec.seccion}-${s.dia}-${s.hora_inicio}-${Math.random()}`,
                curso: sec.curso,
                seccion: sec.seccion,
                tipoSec: sec.tipoSec,
                bgColor: sec.bgColor,
              })),
            );
            placed = true;
            break;
          }
        }

        if (!placed) {
          resultGrids.push({
            id: resultGrids.length + 1,
            sessions: [
              ...sec.sesiones.map((s: any) => ({
                ...s,
                id: `${sec.curso}-${sec.seccion}-${s.dia}-${s.hora_inicio}-${Math.random()}`,
                curso: sec.curso,
                seccion: sec.seccion,
                tipoSec: sec.tipoSec,
                bgColor: sec.bgColor,
              })),
            ],
          });
        }
      }
      return resultGrids;
    };

    return {
      theoryGrids: packIntoGrids(theories),
      labGrids: packIntoGrids(labs),
    };
  }, [courses]);

  const [activeTab, setActiveTab] = useState<{
    type: "theory" | "lab";
    id: number;
  }>({
    type: theoryGrids.length > 0 ? "theory" : "lab",
    id: 1,
  });

  const currentGrid =
    activeTab.type === "theory"
      ? theoryGrids.find((g) => g.id === activeTab.id) || theoryGrids[0]
      : labGrids.find((g) => g.id === activeTab.id) || labGrids[0];

  const gridToRender = currentGrid || theoryGrids[0] || labGrids[0];

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-8 font-mono flex-1 min-h-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <aside className="w-full lg:w-72 shrink-0 flex flex-col min-h-0 gap-4 md:gap-6 pb-2">
        <div className="bg-[#FFEA00] border-4 border-black p-4 neo-brutalist shadow-[4px_4px_0px_#111] shrink-0">
          <h2 className="text-xl font-black uppercase">Vistas Disponibles</h2>
        </div>

        <div className="overflow-y-auto custom-scrollbar pr-2 space-y-6 flex-1">
          {theoryGrids.length > 0 && (
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#111] space-y-2">
              <h3 className="font-bold uppercase mb-4 border-b-2 border-black pb-2 text-xl">
                Teoría
              </h3>
              {theoryGrids.map((g) => (
                <button
                  key={`teo-${g.id}`}
                  onClick={() => setActiveTab({ type: "theory", id: g.id })}
                  className={cn(
                    "w-full text-left px-4 py-3 border-2 border-black font-bold uppercase transition-transform flex justify-between items-center",
                    activeTab.type === "theory" && activeTab.id === g.id
                      ? "bg-[#00E676] shadow-[2px_2px_0px_#111] translate-x-1"
                      : "bg-gray-100 hover:bg-gray-200",
                  )}
                >
                  <span>Hoja {g.id}</span>
                  {activeTab.type === "theory" && activeTab.id === g.id && (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </button>
              ))}
            </div>
          )}

          {labGrids.length > 0 && (
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#111] space-y-2">
              <h3 className="font-bold uppercase mb-4 border-b-2 border-black pb-2 text-xl">
                Laboratorio
              </h3>
              {labGrids.map((g) => (
                <button
                  key={`lab-${g.id}`}
                  onClick={() => setActiveTab({ type: "lab", id: g.id })}
                  className={cn(
                    "w-full text-left px-4 py-3 border-2 border-black font-bold uppercase transition-transform flex justify-between items-center",
                    activeTab.type === "lab" && activeTab.id === g.id
                      ? "bg-[#00E676] shadow-[2px_2px_0px_#111] translate-x-1"
                      : "bg-gray-100 hover:bg-gray-200",
                  )}
                >
                  <span>Hoja {g.id}</span>
                  {activeTab.type === "lab" && activeTab.id === g.id && (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col min-h-0">
        {gridToRender ? (
          <div className="bg-white border-4 border-black p-4 md:p-8 relative shadow-[8px_8px_0px_#111] flex flex-col flex-1 min-h-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-8 gap-4 shrink-0">
              <h3 className="text-xl md:text-3xl font-black uppercase bg-black text-white inline-block px-4 py-2 rotate-[-1deg]">
                {activeTab.type === "theory" ? "TEORÍA" : "LABORATORIO"} - HOJA{" "}
                {gridToRender.id}
              </h3>
              <div className="bg-[#2979FF] text-white px-3 py-1 font-bold border-2 border-black neo-brutalist shadow-[2px_2px_0px_#111]">
                {gridToRender.sessions.length} CLASES
              </div>
            </div>

            <div className="overflow-auto border-4 border-black box-border shadow-[4px_4px_0px_#111] flex-1">
              <div className="min-w-[800px] h-full relative">
                <ScheduleGrid
                  sessions={gridToRender.sessions}
                  startHour={7}
                  endHour={20}
                  excludedCourses={excludedCourses}
                  excludedSections={excludedSections}
                  toggleSection={toggleSection}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border-4 border-black p-12 shadow-[8px_8px_0px_#111] text-center border-dashed">
            <p className="font-bold text-2xl uppercase text-gray-400">
              No hay grupos disponibles para mostrar en esta categoría.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// Reduced height to look like Google Calendar

function ScheduleGrid({
  sessions,
  startHour = 7,
  endHour = 20,
  excludedCourses = new Set(),
  excludedSections = new Set(),
  toggleSection,
}: {
  sessions: any[];
  startHour?: number;
  endHour?: number;
  excludedCourses?: Set<string>;
  excludedSections?: Set<string>;
  toggleSection?: (curso: string, seccion: string) => void;
}) {
  const dynamicHours = useMemo(() => {
    let minT = 24 * 60;
    let maxT = 0;

    if (sessions.length === 0) return { sH: startHour, eH: endHour };
    for (const s of sessions) {
      const st = parseTimeStr(s.hora_inicio);
      const et = parseTimeStr(s.hora_fin);
      if (st < minT) minT = st;
      if (et > maxT) maxT = et;
    }
    let sH = Math.floor(minT / 60) - 1;
    let eH = Math.ceil(maxT / 60);
    if (sH < 7) sH = 7;
    if (eH > 22) eH = 22;
    if (eH <= sH) eH = sH + 1;

    return { sH: Math.min(sH, startHour), eH: Math.max(eH, endHour) };
  }, [sessions, startHour, endHour]);

  const finalStart = dynamicHours.sH;
  const finalEnd = dynamicHours.eH;

  return (
    <div className="min-w-[800px] border-black font-mono relative bg-white">
      <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] bg-gray-100 font-bold text-center">
        <div className="border-r-2 border-b-2 border-black p-2 bg-black text-[#FFEA00]">
          HORA
        </div>
        {DAYS.map((d) => (
          <div
            key={d}
            className="border-r-2 border-b-2 border-black p-2 uppercase"
          >
            {d}
          </div>
        ))}
      </div>

      <div
        className="relative border-b-2 border-black bg-white bg-[linear-gradient(_transparent_99%,_#eaeaea_100%_)] bg-[length:100%_60px]"
        style={{ height: `${(finalEnd - finalStart + 1) * 60}px` }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-[80px] border-r-2 border-black bg-white/50 backdrop-blur-sm z-10 flex flex-col pointer-events-none">
          {Array.from({ length: finalEnd - finalStart + 1 }).map((_, i) => (
            <div
              key={i}
              className="h-[60px] border-b-2 border-gray-200 text-xs font-bold text-center pt-2 text-gray-800"
            >
              {String(finalStart + i).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        <div className="absolute left-[80px] right-0 top-0 bottom-0">
          <AnimatePresence>
            {sessions.map((s, i) => {
              const dayIdx = DAYS.findIndex(
                (d) => d.toLowerCase() === s.dia.toLowerCase(),
              );
              if (dayIdx === -1) return null;

              const startT = parseTimeStr(s.hora_inicio);
              const endT = parseTimeStr(s.hora_fin);

              const duration = endT - startT;
              const offsetFromStartDay = startT - finalStart * 60;

              const styleTop = offsetFromStartDay;
              const styleHeight = duration;
              const styleWidth = 100 / DAYS.length;
              const styleLeft = styleWidth * dayIdx;

              const isTheory = s.tipoSec === "Teoría";
              const secKey = `${s.curso}-${isTheory ? "teoria" : "lab"}-${s.seccion}`;
              const isExcluded =
                excludedCourses.has(s.curso) || excludedSections.has(secKey);

              return (
                <motion.div
                  key={s.id || `${s.curso}-${s.dia}-${s.hora_inicio}-${i}`}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  onClick={() =>
                    toggleSection &&
                    toggleSection(
                      s.curso,
                      isTheory ? `teoria-${s.seccion}` : `lab-${s.seccion}`,
                    )
                  }
                  className={cn(
                    "absolute p-2 border-2 border-black overflow-hidden hover:z-50 transition-all shadow-[2px_2px_0px_#111] text-black flex flex-col justify-start",
                    s.bgColor || "bg-gray-800",
                    toggleSection ? "cursor-pointer" : "cursor-default",
                    isExcluded
                      ? "opacity-30 saturate-0 scale-95 hover:opacity-100 hover:scale-[1.02] hover:saturate-100"
                      : "opacity-90 hover:scale-[1.02]",
                  )}
                  style={{
                    top: `${styleTop}px`,
                    height: `${styleHeight}px`,
                    width: `calc(${styleWidth}% - 10px)`,
                    left: `calc(${styleLeft}% + 5px)`,
                  }}
                  title={`${s.curso} | ${s.tipoSec === "Teoría" ? "TEORÍA" : "LABORATORIO"} ${s.seccion} (${s.tipo}) | ${s.hora_inicio} - ${s.hora_fin}`}
                >
                  <p className="font-bold text-[10px] sm:text-xs uppercase truncate w-full pb-1 mb-1 border-b border-black/20 leading-tight">
                    {s.curso}
                  </p>
                  <p className="text-[10px] font-sans font-black bg-black text-white px-1 inline-block mt-0.5 self-start">
                    {s.tipoSec === "Teoría" ? "TEORÍA" : "LABORATORIO"}{" "}
                    {s.seccion}
                  </p>
                  <p className="text-[10px] mt-0.5 font-bold truncate">
                    {s.tipo || "Presencial"}
                  </p>
                  <p className="text-[10px] mt-0.5 font-bold">
                    {s.hora_inicio} - {s.hora_fin}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SocialView() {
  const [messages] = useState([
    {
      id: 1,
      name: "Cachimbo Ansioso",
      msg: "¡Gracias mano! Me salvaste de cruzar Progra con Conta.",
      color: "bg-[#00E676]",
    },
    {
      id: 2,
      name: "Estudiante a Punto de Egreso",
      msg: "Toma para tu café, excelente app.",
      color: "bg-[#00E5FF]",
    },
    {
      id: 3,
      name: "Delegada",
      msg: "Lo compartí con toda mi base, te pasaste 👍",
      color: "bg-[#FFEA00]",
    },
    {
      id: 4,
      name: "Anónimo",
      msg: "Si paso este semestre gracias a tu horario, te invito unas chelas. 🙏",
      color: "bg-[#D500F9]",
    },
    {
      id: 5,
      name: "Ing. de Sistemas",
      msg: "Buen manejo de algoritmos, mis respetos rey. 🤖",
      color: "bg-[#FF3366]",
    },
  ]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-8 font-mono flex-1 min-h-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Columna Izquierda: QR y WhatsApp */}
      <aside className="w-full lg:w-96 shrink-0 flex flex-col min-h-0 gap-4 md:gap-6 pb-2 overflow-y-auto custom-scrollbar justify-between">
        {/* Call to action */}
        <div className="bg-[#FF3366] text-white border-4 border-black p-4 md:p-6 neo-brutalist shadow-[4px_4px_0px_#111] shrink-0 text-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
          <h2 className="text-2xl md:text-3xl font-black uppercase mb-2 rotate-[-2deg] bg-black inline-block px-3 py-1 shadow-[2px_2px_0px_rgba(255,255,255,1)]">
            Tengo Hambre
          </h2>
          <p className="mt-2 font-bold text-sm tracking-wide">
            Apoya el proyecto, claude no es gratis :'v
          </p>
        </div>

        {/* QR Section */}
        <div className="bg-white border-4 border-black p-4 md:p-6 shadow-[4px_4px_0px_#111] text-center flex flex-col items-center flex-1 justify-center">
          <h3 className="font-black uppercase text-xl mb-4 border-b-4 border-black inline-block bg-[#00E5FF] px-2">
            Yapea aquí
          </h3>
          <div className="w-40 h-40 md:w-56 md:h-56 border-4 border-black bg-gray-200 flex items-center justify-center shadow-[4px_4px_0px_#111] overflow-hidden p-2">
            {/* You can replace the src when ready */}
            <img
              src="/yape.png"
              alt="QR Yape"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="font-bold text-gray-500 absolute -z-10">
              [QR de Yape]
            </span>
          </div>
        </div>

        {/* Botón WhatsApp */}
        <a
          href="https://wa.me/+51943606092"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#00E676] hover:bg-[#00C853] text-black border-4 border-black p-3 md:p-4 neo-brutalist shadow-[4px_4px_0px_#111] text-center flex flex-col items-center gap-2 transition-transform hover:-translate-y-1 active:translate-y-0 shrink-0"
        >
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
          <span className="font-black uppercase text-lg md:text-xl">
            ¿Encontraste un bug?
          </span>
          <span className="text-xs font-bold bg-white px-2 py-1 border-2 border-black">
            Escríbeme por WhatsApp
          </span>
        </a>
      </aside>

      {/* Columna Derecha: Panel de Mensajes */}
      <main className="flex-1 min-w-0 flex flex-col min-h-0 gap-4">
        <div className="bg-white border-4 border-black p-4 md:p-6 relative shadow-[8px_8px_0px_#111] flex flex-col flex-1 min-h-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0 border-b-4 border-black pb-4">
            <h3 className="text-xl md:text-3xl font-black uppercase bg-black text-white inline-block px-4 py-2 rotate-[1deg]">
              CONFESIONES & DONADORES 🏆
            </h3>
            <span className="font-bold text-sm bg-[#FF9100] text-black border-2 border-black px-3 py-2 shadow-[2px_2px_0px_#111] -rotate-1">
              Deja tu mensaje
            </span>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1 pr-4 space-y-4">
            <div className="bg-gray-100 border-4 border-dashed border-black p-6 text-center">
              <p className="font-black text-lg">¿Ya yapeaste?</p>
              <p className="font-bold text-gray-600 mt-2">
                Pon tu nombre o mensaje corto en el concepto de yape para
                aparecer aquí (se actualiza periodicamente).
              </p>
            </div>

            <div className="grid gap-4 auto-rows-max lg:grid-cols-2">
              {messages.map((m, i) => (
                <div
                  key={m.id}
                  className={cn(
                    "p-4 border-4 border-black shadow-[4px_4px_0px_#111] transition-transform hover:-translate-y-1 hover:translate-x-1 flex flex-col",
                    m.color,
                    i % 2 === 0 ? "rotate-1" : "-rotate-1",
                  )}
                >
                  <p className="font-black text-lg truncate border-b-2 border-black/40 pb-1 mb-2">
                    {m.name}
                  </p>
                  <p className="font-bold text-sm bg-white/80 p-3 border-2 border-black text-black flex-1 flex items-center justify-center text-center leading-relaxed">
                    "{m.msg}"
                  </p>
                </div>
              ))}
            </div>

            <div className="py-8 text-center opacity-50">
              <p className="font-bold">--- Fin de los mensajes ---</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
