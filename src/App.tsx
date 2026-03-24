import React, { useState, useMemo, useRef } from "react";
import { Upload, AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { generateSchedules } from "./lib/scheduler";
import type { Course, ScheduleCombination } from "./lib/types";

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

export default function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [errorError, setError] = useState<string | null>(null);

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.horario_academico) {
          const normalizedCourses: Course[] = json.horario_academico.map(
            (c: any) => {
              const teoriasMap: Record<string, any> = {};
              const laboratoriosMap: Record<string, any> = {};

              c.secciones.forEach((sec: any) => {
                sec.sesiones.forEach((ses: any) => {
                  const tipoLower = ses.tipo.toLowerCase();
                  if (
                    tipoLower.includes("teoría") ||
                    tipoLower.includes("teoria")
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
                    tipoLower.includes("practica")
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
            },
          );

          setCourses(normalizedCourses);
          setError(null);
          setCurrentComboIdx(0);
        } else {
          setError(
            "El formato JSON es incorrecto. Debe contener 'horario_academico'.",
          );
        }
      } catch (err) {
        setError("Error al leer el archivo JSON.");
      }
    };
    reader.readAsText(file);
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

  const activeCombo = combinations[currentComboIdx];

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
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-[#111] pb-6 gap-6">
        <div>
          <h1 className="text-5xl tracking-tighter text-[#111] mb-2 leading-none uppercase">
            Schedule{" "}
            <span className="bg-[#FFEA00] px-2 py-1 select-none border-2 border-[#111] rotate-[-2deg] inline-block shadow-[4px_4px_0px_#111]">
              Generator
            </span>
          </h1>
          <p className="text-xl font-bold font-mono text-gray-700">
            EXPLORADOR UNIVERSITARIO SIN CRUCES V1.0
          </p>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="neo-brutalist bg-white px-6 py-3 font-mono font-bold text-lg flex items-center gap-2 hover:bg-[#FF3366] hover:text-white group"
          >
            <Upload
              className="w-6 h-6 group-hover:-translate-y-1 transition-transform"
              strokeWidth={3}
            />{" "}
            Cargar JSON
          </button>
        </div>
      </header>

      {errorError && (
        <div className="bg-[#FF3366] text-white p-4 neo-brutalist flex items-center gap-4 font-mono font-bold">
          <AlertTriangle strokeWidth={3} /> {errorError}
        </div>
      )}

      {courses.length > 0 && (
        <div className="flex flex-wrap gap-4 font-mono font-bold text-lg mb-4">
          <button
            onClick={() => setViewMode("generator")}
            className={cn(
              "px-6 py-3 border-2 border-black transition-transform uppercase",
              viewMode === "generator"
                ? "bg-[#FFEA00] shadow-[4px_4px_0px_#111]"
                : "bg-white hover:bg-gray-100 shadow-[2px_2px_0px_#111]",
            )}
          >
            Generador
          </button>
          <button
            onClick={() => setViewMode("all_schedules")}
            className={cn(
              "px-6 py-3 border-2 border-black transition-transform uppercase",
              viewMode === "all_schedules"
                ? "bg-[#FFEA00] shadow-[4px_4px_0px_#111]"
                : "bg-white hover:bg-gray-100 shadow-[2px_2px_0px_#111]",
            )}
          >
            Todos los horarios
          </button>
        </div>
      )}

      {courses.length > 0 && viewMode === "generator" && (
        <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white neo-brutalist p-6">
              <h2 className="text-2xl mb-4 bg-black text-white px-2 py-1 inline-block uppercase">
                Cursos
              </h2>

              <div className="space-y-4 font-mono">
                {courses.map((course) => {
                  const isExcluded = excludedCourses.has(course.curso);
                  return (
                    <div key={course.curso} className="space-y-2">
                      <label className="flex items-center gap-2 font-bold cursor-pointer text-lg">
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
                      </label>

                      <div className="pl-7 space-y-3 mt-1">
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
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#2979FF] text-white neo-brutalist p-6 flex flex-col gap-2">
              <h2 className="text-2xl font-bold uppercase">Estado</h2>
              <div className="font-mono text-xl">
                Opciones validas:{" "}
                <span className="bg-black px-2">{combinations.length}</span>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-3 space-y-6 min-w-0 overflow-hidden">
            {combinations.length === 0 ? (
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
                <div className="flex flex-col sm:flex-row items-center justify-between bg-white neo-brutalist p-4 gap-4">
                  <button
                    disabled={currentComboIdx === 0}
                    onClick={() => setCurrentComboIdx((i) => i - 1)}
                    className="p-2 border-2 border-black disabled:opacity-50 hover:bg-[#FFEA00]"
                  >
                    <ArrowLeft strokeWidth={3} />
                  </button>
                  <span className="font-mono font-bold text-xl md:text-2xl uppercase text-center">
                    Opción {currentComboIdx + 1} / {combinations.length}
                  </span>
                  <button
                    disabled={currentComboIdx === combinations.length - 1}
                    onClick={() => setCurrentComboIdx((i) => i + 1)}
                    className="p-2 border-2 border-black disabled:opacity-50 hover:bg-[#FFEA00]"
                  >
                    <ArrowRight strokeWidth={3} />
                  </button>
                </div>

                <div className="bg-white neo-brutalist p-2 md:p-6 overflow-x-auto relative">
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
  toggleSection
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

                      const isTheory = s.tipoSec === 'Teoría';
                      const secKey = `${s.curso}-${isTheory ? 'teoria' : 'lab'}-${s.seccion}`;
                      const isExcluded = excludedCourses.has(s.curso) || excludedSections.has(secKey);

                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleSection(s.curso, isTheory ? `teoria-${s.seccion}` : `lab-${s.seccion}`)}
                          className={cn(
                            "absolute p-2 border-2 border-black overflow-hidden hover:z-50 cursor-pointer transition-all shadow-[2px_2px_0px_#111] text-black flex flex-col justify-start",
                            s.bgColor,
                            isExcluded 
                              ? "opacity-30 saturate-0 scale-95 hover:opacity-100 hover:scale-[1.02] hover:saturate-100" 
                              : "opacity-90 hover:scale-[1.02]"
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
                          </p>                            <p className="text-[10px] mt-0.5 font-bold">
                              {s.hora_inicio} - {s.hora_fin}
                            </p>                        </div>
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

function CalendarGrid({
  combo,
}: {
  combo: ScheduleCombination;
  coursesMap?: Course[];
}) {
  const startHour = 7;
  const endHour = 20; // Hasta las 8:00 PM (las 20:00, cubriendo hasta 20:10 o similar)

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
        className="relative border-b-2 border-black opacity-90 bg-white bg-[linear-gradient(_transparent_99%,_#eaeaea_100%_)] bg-[length:100%_60px]"
        style={{
          height: `${(endHour - startHour + 1) * 60}px`,
        }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-[80px] border-r-2 border-black bg-white/50 backdrop-blur-sm z-10 flex flex-col pointer-events-none">
          {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
            <div
              key={i}
              className="h-[60px] border-b-2 border-gray-200 text-xs font-bold text-center pt-2"
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

              const duration = endT - startT;
              const offsetFromStartDay = startT - startHour * 60;

              const top = offsetFromStartDay;
              const height = duration;
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
                    "absolute p-2 border-2 border-black overflow-hidden hover:z-20 transition-transform hover:-translate-y-1 shadow-[2px_2px_0px_#111]",
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
