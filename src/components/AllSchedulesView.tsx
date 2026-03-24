import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "../utils/tw";
import { COLORS, checkSectionOverlapWithinGrid } from "../utils/scheduler";
import { ScheduleGrid } from "./ScheduleGrid";
import { AllSchedulesTour } from "./AllSchedulesTour";
import type { Course } from "../lib/types";

interface AllSchedulesViewProps {
  courses: Course[];
  excludedCourses: Set<string>;
  excludedSections: Set<string>;
  toggleSection: (curso: string, seccion: string) => void;
}

export function AllSchedulesView({
  courses,
  excludedCourses,
  excludedSections,
  toggleSection,
}: AllSchedulesViewProps) {
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
    <div className="flex flex-col lg:flex-row gap-4 md:gap-8 font-mono flex-1 min-h-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <AllSchedulesTour />
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

            <div className="tour-all-schedules-grid overflow-auto border-4 border-black box-border shadow-[4px_4px_0px_#111] flex-1 bg-white">
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
