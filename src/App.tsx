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

const CELL_HEIGHT = 44;
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
  const [viewMode, setViewMode] = useState<"generator" | "all_schedules">(
    "generator",
  );

  const [sortBy, setSortBy] = useState<
    "default" | "compact" | "free_days" | "start_late" | "end_early"
  >("default");
  const [wantedFreeDays, setWantedFreeDays] = useState<string[]>([]);
  const [minTime, setMinTime] = useState<number>(7 * 60); // 7:00
  const [maxTime, setMaxTime] = useState<number>(20 * 60 + 10); // 20:10
  const [maxTotalGaps, setMaxTotalGaps] = useState<number>(12 * 60); // Max hours empty

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
          <div className="flex flex-wrap gap-2 font-mono font-bold text-sm shrink-0">
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
                        {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map((d) => (
                          <button
                            key={d}
                            onClick={() => toggleWantedFreeDay(d)}
                            className={cn(
                              "p-1 border-2 border-black font-bold uppercase transition-transform flex-1 text-xs text-center max-w-[32px]",
                              wantedFreeDays.includes(d)
                                ? "bg-black text-white shadow-[2px_2px_0px_#111] translate-y-0.5"
                                : "bg-white hover:bg-gray-100 shadow-[2px_2px_0px_#111]"
                            )}
                            title={"Exigir " + d + " libre"}
                          >
                            {d.charAt(0)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Max Huecos */}
                    <div className="space-y-2 col-span-2 2xl:col-span-1">
                      <label className="block text-black font-black uppercase text-xs leading-tight whitespace-nowrap">
                        Max Huecos (
                        <span className="text-black font-extrabold">
                          {maxTotalGaps >= 720
                            ? "Libre"
                            : (maxTotalGaps / 60).toFixed(0) + "h"}
                        </span>
                        )
                      </label>
                      <div className="flex items-center gap-2 h-[28px]">
                        <input
                          type="range"
                          min="0"
                          max="720"
                          step="60"
                          value={maxTotalGaps}
                          onChange={(e) => setMaxTotalGaps(Number(e.target.value))}
                          className="w-full accent-black cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Rango Horario */}
                    <div className="space-y-2 col-span-2">
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
              <div className="bg-white neo-brutalist p-12 text-center">
                <h2 className="text-4xl text-gray-300 font-bold uppercase mb-4">
                  Cruces o Sin Opciones
                </h2>
                <p className="font-mono text-gray-500">
                  Relaja las restricciones o selecciona más secciones.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-center justify-between bg-white border-4 border-black p-2 md:p-4 gap-4 shrink-0 shadow-[4px_4px_0px_#111]">
                  <button
                    disabled={currentComboIdx === 0}
                    onClick={() => setCurrentComboIdx((i) => i - 1)}
                    className="p-2 border-2 border-black disabled:opacity-50 hover:bg-[#FFEA00]"
                  >
                    <ArrowLeft strokeWidth={3} />
                  </button>
                  <span className="font-mono font-bold text-lg md:text-xl uppercase text-center bg-[#2979FF] text-white px-4 py-1 border-2 border-black rotate-[-1deg] shadow-[2px_2px_0px_#111]">
                    Opción {currentComboIdx + 1} de{" "}
                    {processedCombinations.length} horarios válidos
                  </span>
                  <button
                    disabled={
                      currentComboIdx === processedCombinations.length - 1
                    }
                    onClick={() => setCurrentComboIdx((i) => i + 1)}
                    className="p-2 border-2 border-black disabled:opacity-50 hover:bg-[#FFEA00]"
                  >
                    <ArrowRight strokeWidth={3} />
                  </button>
                </div>

                <div className="bg-white border-4 border-black p-2 md:p-6 overflow-y-auto overflow-x-auto relative flex-1 min-h-0 shadow-[4px_4px_0px_#111] custom-scrollbar">
                  <CalendarGrid combo={activeCombo} coursesMap={courses} />
                </div>
              </>
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
  const startHour = 7;
  const endHour = 20;

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
    <div className="flex flex-col lg:flex-row gap-8 font-mono pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <aside className="w-full lg:w-72 shrink-0 space-y-6">
        <div className="bg-[#FFEA00] border-4 border-black p-4 neo-brutalist shadow-[4px_4px_0px_#111]">
          <h2 className="text-xl font-black uppercase">Vistas Disponibles</h2>
        </div>

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
      </aside>

      <main className="flex-1 min-w-0">
        {gridToRender ? (
          <div className="bg-white border-4 border-black p-4 md:p-8 relative shadow-[8px_8px_0px_#111]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h3 className="text-xl md:text-3xl font-black uppercase bg-black text-white inline-block px-4 py-2 rotate-[-1deg]">
                {activeTab.type === "theory" ? "TEORÍA" : "LABORATORIO"} - HOJA{" "}
                {gridToRender.id}
              </h3>
              <div className="bg-[#2979FF] text-white px-3 py-1 font-bold border-2 border-black neo-brutalist shadow-[2px_2px_0px_#111]">
                {gridToRender.sessions.length} CLASES
              </div>
            </div>

            <div className="overflow-x-auto border-4 border-black box-border shadow-[4px_4px_0px_#111]">
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
                  style={{ height: `${(endHour - startHour + 1) * 60}px` }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[80px] border-r-2 border-black bg-white/50 backdrop-blur-sm z-10 flex flex-col pointer-events-none">
                    {Array.from({ length: endHour - startHour + 1 }).map(
                      (_, i) => (
                        <div
                          key={i}
                          className="h-[60px] border-b-2 border-gray-200 text-xs font-bold text-center pt-2"
                        >
                          {String(startHour + i).padStart(2, "0")}:00
                        </div>
                      ),
                    )}
                  </div>

                  <div className="absolute left-[80px] right-0 top-0 bottom-0">
                    {gridToRender.sessions.map((s) => {
                      const dayIdx = DAYS.findIndex(
                        (d) => d.toLowerCase() === s.dia.toLowerCase(),
                      );
                      if (dayIdx === -1) return null;

                      const startT = parseTimeStr(s.hora_inicio);
                      const endT = parseTimeStr(s.hora_fin);
                      const duration = endT - startT;
                      const offsetFromStartDay = startT - startHour * 60;

                      const styleTop = offsetFromStartDay;
                      const styleHeight = duration;
                      const styleWidth = 100 / DAYS.length;
                      const styleLeft = styleWidth * dayIdx;

                      const isTheory = s.tipoSec === "Teoría";
                      const secKey = `${s.curso}-${isTheory ? "teoria" : "lab"}-${s.seccion}`;
                      const isExcluded =
                        excludedCourses.has(s.curso) ||
                        excludedSections.has(secKey);

                      return (
                        <div
                          key={s.id}
                          onClick={() =>
                            toggleSection(
                              s.curso,
                              isTheory
                                ? `teoria-${s.seccion}`
                                : `lab-${s.seccion}`,
                            )
                          }
                          className={cn(
                            "absolute p-2 border-2 border-black overflow-hidden hover:z-50 cursor-pointer transition-all shadow-[2px_2px_0px_#111] text-black flex flex-col justify-start",
                            s.bgColor,
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
                          title={`${s.curso} | ${s.tipoSec} ${s.seccion} (${s.tipo}) | ${s.hora_inicio} - ${s.hora_fin}`}
                        >
                          <p className="font-bold text-[10px] sm:text-xs uppercase truncate w-full pb-1 mb-1 border-b border-black/20 leading-tight">
                            {s.curso}
                          </p>
                          <p className="text-[10px] font-sans font-black bg-black text-white px-1 inline-block mt-0.5">
                            {s.tipoSec === "Teoría" ? "TEO" : "LAB"} {s.seccion}
                          </p>
                          <p className="text-[10px] mt-0.5 font-bold truncate">
                            {s.tipo || "Presencial"}
                          </p>{" "}
                          <p className="text-[10px] mt-0.5 font-bold">
                            {s.hora_inicio} - {s.hora_fin}
                          </p>{" "}
                        </div>
                      );
                    })}
                  </div>
                </div>
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

function CalendarGrid({
  combo,
}: {
  combo: ScheduleCombination;
  coursesMap?: Course[];
}) {
  const courseColors = useMemo(() => {
    const map: Record<string, string> = {};
    Object.keys(combo.selection).forEach((cName, idx) => {
      map[cName] = COLORS[idx % COLORS.length];
    });
    return map;
  }, [combo]);

  const sessions = useMemo(() => {
    const all = [];
    for (const [curso, sel] of Object.entries(combo.selection)) {
      if (sel.teoria) {
        for (const sesion of sel.teoria.sesiones) {
          all.push({ curso, seccion: `Teo ${sel.teoria.seccion}`, ...sesion });
        }
      }
      if (sel.laboratorio) {
        for (const sesion of sel.laboratorio.sesiones) {
          all.push({
            curso,
            seccion: `Lab ${sel.laboratorio.seccion}`,
            ...sesion,
          });
        }
      }
    }
    return all;
  }, [combo]);

  const { startHour, endHour } = useMemo(() => {
    let minT = 24 * 60;
    let maxT = 0;
    if (sessions.length === 0) return { startHour: 7, endHour: 20 };
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
    return { startHour: sH, endHour: eH };
  }, [sessions]);

  return (
    <div className="min-w-[800px] border-l-2 border-t-2 border-black font-mono relative">
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
        className="relative border-b-2 border-black opacity-90 bg-white bg-[linear-gradient(_transparent_99%,_#eaeaea_100%_)]"
        style={{
          height: `${(endHour - startHour + 1) * CELL_HEIGHT}px`,
          backgroundSize: `100% ${CELL_HEIGHT}px`,
        }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-[80px] border-r-2 border-black bg-white/50 backdrop-blur-sm z-10 flex flex-col pointer-events-none">
          {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
            <div
              key={i}
              style={{ height: `${CELL_HEIGHT}px` }}
              className="border-b-2 border-gray-200 text-xs font-bold text-center pt-1 text-gray-500"
            >
              {String(startHour + i).padStart(2, "0")}:00
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

              const durationHours = (endT - startT) / 60;
              const offsetHours = (startT - startHour * 60) / 60;
              const top = offsetHours * CELL_HEIGHT;
              const height = durationHours * CELL_HEIGHT;
              const width = 100 / DAYS.length;
              const left = width * dayIdx;
              const bgColor = courseColors[s.curso] || "bg-gray-800";

              return (
                <motion.div
                  key={`${s.curso}-${s.dia}-${s.hora_inicio}-${i}`}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  className={cn(
                    "absolute p-1 md:p-1.5 border-2 border-black overflow-hidden hover:z-20 transition-transform hover:-translate-y-1 shadow-[2px_2px_0px_#111]",
                    bgColor,
                    "text-black",
                  )}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    width: `calc(${width}% - 10px)`,
                    left: `calc(${left}% + 5px)`,
                  }}
                >
                  <p className="font-bold text-[10px] sm:text-xs uppercase truncate">
                    {s.curso}
                  </p>
                  <p className="text-[10px] font-sans font-black bg-black text-white px-1 inline-block mt-0.5">
                    SEC {s.seccion}
                  </p>
                  <p className="text-[10px] mt-0.5 truncate">{s.tipo}</p>
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
