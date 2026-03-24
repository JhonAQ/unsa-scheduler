import { useState } from "react";
import { AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "./utils/tw";
import { ScheduleGrid } from "./components/ScheduleGrid";
import { AllSchedulesView } from "./components/AllSchedulesView";
import { SocialView } from "./components/SocialView";
import { FilterSidebar } from "./components/FilterSidebar";
import { AppTour } from "./components/AppTour";
import { useCourseSelection } from "./hooks/useCourseSelection";
import { useScheduleGenerator } from "./hooks/useScheduleGenerator";

export default function App() {
  const [errorError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<
    "generator" | "all_schedules" | "social"
  >("generator");

  const {
    courses,
    activeCourses,
    excludedCourses,
    excludedSections,
    toggleCourse,
    toggleSection,
  } = useCourseSelection();

  const {
    sortBy,
    setSortBy,
    wantedFreeDays,
    toggleWantedFreeDay,
    minTime,
    setMinTime,
    maxTime,
    setMaxTime,
    processedCombinations,
    activeComboSessions,
    currentComboIdx,
    setCurrentComboIdx,
    resetComboIdx,
  } = useScheduleGenerator(activeCourses, courses);

  const handleToggleCourse = (curso: string) => {
    toggleCourse(curso, resetComboIdx);
  };

  const handleToggleSection = (curso: string, seccion: string) => {
    toggleSection(curso, seccion, resetComboIdx);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col p-2 md:p-4 max-w-7xl mx-auto space-y-4">
      <AppTour />
      <header className="tour-header flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-[#111] pb-2 gap-4 shrink-0">
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
          <div className="tour-tabs flex flex-wrap gap-2 font-mono font-bold text-sm shrink-0 items-center justify-end flex-1">
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
        <main className="tour-generator-results grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0 overflow-hidden">
          <FilterSidebar
            sortBy={sortBy}
            setSortBy={setSortBy}
            wantedFreeDays={wantedFreeDays}
            toggleWantedFreeDay={toggleWantedFreeDay}
            minTime={minTime}
            setMinTime={setMinTime}
            maxTime={maxTime}
            setMaxTime={setMaxTime}
            courses={courses}
            excludedCourses={excludedCourses}
            excludedSections={excludedSections}
            toggleCourse={handleToggleCourse}
            toggleSection={handleToggleSection}
          />

          <section className="lg:col-span-3 flex flex-col min-h-0 space-y-4">
            {processedCombinations.length === 0 ? (
              <div className="bg-white neo-brutalist p-12 text-center border-4 border-black shadow-[8px_8px_0px_#111]">
                <h2 className="text-4xl text-gray-300 font-bold uppercase mb-4">
                  Cruces o Sin Opciones
                </h2>
                <p className="font-mono text-gray-500">
                  Relaja las restricciones o selecciona m�s secciones.
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
                      onClick={() => setCurrentComboIdx((i: number) => i - 1)}
                      className="hover:text-[#FFEA00] disabled:opacity-50 transition-colors bg-transparent border-none p-1"
                    >
                      <ArrowLeft className="w-5 h-5" strokeWidth={3} />
                    </button>
                    <span className="uppercase whitespace-nowrap">
                      Opci�n {currentComboIdx + 1} de{" "}
                      {processedCombinations.length}
                    </span>
                    <button
                      disabled={
                        currentComboIdx === processedCombinations.length - 1
                      }
                      onClick={() => setCurrentComboIdx((i: number) => i + 1)}
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
          toggleSection={handleToggleSection}
        />
      )}

      {viewMode === "social" && <SocialView />}
    </div>
  );
}
