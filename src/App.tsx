import { useState, useMemo, useEffect } from "react";
import { AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "./utils/tw";
import { ScheduleGrid } from "./components/ScheduleGrid";
import { AllSchedulesView } from "./components/AllSchedulesView";
import { GlobalSchedulesView } from "./components/GlobalSchedulesView";
import { SocialView } from "./components/SocialView";
import { FilterSidebar } from "./components/FilterSidebar";
import { AppTour } from "./components/AppTour";
import { OnboardingModal } from "./components/OnboardingModal";
import { useCourseSelection } from "./hooks/useCourseSelection";
import { useScheduleGenerator } from "./hooks/useScheduleGenerator";
import { getAllCoursesFlat } from "./utils/scheduler";

export default function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-white text-text p-6 flex flex-col items-center justify-center text-center">
        <div className="max-w-md w-full bg-[var(--color-accent-5)] border-4 border-text shadow-neo p-8 rounded-base space-y-6">
          <div className="bg-[var(--color-accent-1)] border-4 border-text rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#111111]">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-heading bg-white inline-block px-3 py-1 border-2 border-text rotate-[-2deg] shadow-[2px_2px_0px_0px_#111]">
            ¡Ups! Pantalla muy pequeña
          </h1>
          <p className="font-base text-lg font-medium leading-relaxed bg-white border-2 border-text p-4 rounded-base text-left">
            Por la naturaleza de esta aplicación (es una malla de horarios con
            bastantes cruces), es{" "}
            <strong className="text-[var(--color-accent-1)] font-bold">
              imposible adaptarla a teléfonos.
            </strong>
          </p>
          <div className="bg-[var(--color-accent-2)] p-4 border-4 border-text rounded-base shadow-[4px_4px_0px_0px_#111111] hover:translate-y-1 hover:translate-x-1 hover:shadow-[0px_0px_0px_0px_#111111] transition-all">
            <p className="font-bold text-xl uppercase tracking-wide">
              ¡Ingresa desde una PC!
            </p>
            <p className="text-sm font-bold mt-1">
              Para una experiencia óptima 💻
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [errorError] = useState<string | null>(null);

  // Tabs: "generator", "my_schedules", "global_schedules", "social"
  const [viewMode, setViewMode] = useState<
    "generator" | "my_schedules" | "global_schedules" | "social"
  >("generator");

  // LocalStorage state for selected courses
  const [mySelectedCourseNames, setMySelectedCourseNames] = useState<string[]>(
    () => {
      const stored = localStorage.getItem("unsa_selected_courses");
      return stored ? JSON.parse(stored) : [];
    },
  );

  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return !localStorage.getItem("unsa_selected_courses");
  });

  const handleOnboardingComplete = (selectedNames: string[]) => {
    localStorage.setItem(
      "unsa_selected_courses",
      JSON.stringify(selectedNames),
    );
    setMySelectedCourseNames(selectedNames);
    setShowOnboarding(false);
  };

  const initialCourses = useMemo(() => {
    const allCourses = getAllCoursesFlat();
    return allCourses.filter((c) => mySelectedCourseNames.includes(c.curso));
  }, [mySelectedCourseNames]);

  const {
    courses,
    activeCourses,
    excludedCourses,
    excludedSections,
    toggleCourse,
    toggleSection,
  } = useCourseSelection(initialCourses);

  const {
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

  // If onboarding is active, show the Modal. Wait, we want to render the app BEHIND it or just the modal full screen?
  // Let's render the modal as a fullscreen overlay
  return (
    <>
      <div className="h-screen overflow-hidden flex flex-col p-2 md:p-4 max-w-7xl mx-auto space-y-4">
        {!showOnboarding && <AppTour />}
        <header className="tour-header flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-[#111] pb-2 gap-4 shrink-0">
          <div>
            <h1 className="text-3xl tracking-tighter text-[#111] mb-1 leading-none uppercase">
              Schedule{" "}
              <span className="bg-[#FFEA00] px-2 py-0.5 select-none border-2 border-[#111] rotate-[-2deg] inline-block shadow-[2px_2px_0px_#111]">
                Generator
              </span>
            </h1>
            <p className="text-sm font-bold font-mono text-gray-700">
              EXPLORADOR UNIVERSITARIO
            </p>
          </div>

          <div className="tour-tabs flex flex-wrap gap-2 font-mono font-bold text-sm shrink-0 items-center justify-end flex-1">
            <button
              onClick={() => {
                setShowOnboarding(true);
              }}
              className="px-4 py-2 border-2 border-black transition-transform uppercase bg-[#2979FF] text-white shadow-[2px_2px_0px_#111] hover:translate-y-0.5"
            >
              Configurar Cursos
            </button>

            {courses.length > 0 && (
              <>
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
                  onClick={() => setViewMode("my_schedules")}
                  className={cn(
                    "px-4 py-2 border-2 border-black transition-transform uppercase",
                    viewMode === "my_schedules"
                      ? "bg-[#FFEA00] shadow-[2px_2px_0px_#111]"
                      : "bg-white hover:bg-gray-100 shadow-[2px_2px_0px_#111]",
                  )}
                >
                  Tus Horarios
                </button>
              </>
            )}

            <button
              onClick={() => setViewMode("global_schedules")}
              className={cn(
                "px-4 py-2 border-2 border-black transition-transform uppercase",
                viewMode === "global_schedules"
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
              maxTotalGaps={maxTotalGaps}
              setMaxTotalGaps={setMaxTotalGaps}
              courses={courses}
              excludedCourses={excludedCourses}
              excludedSections={excludedSections}
              toggleCourse={handleToggleCourse}
              toggleSection={handleToggleSection}
            />

            <section className="lg:col-span-3 flex flex-col min-h-0 space-y-4">
              {processedCombinations.length === 0 ? (
                <div className="bg-white neo-brutalist p-12 text-center border-4 border-black shadow-[8px_8px_0px_#111] flex-1 flex flex-col items-center justify-center">
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
                        onClick={() => setCurrentComboIdx((i: number) => i - 1)}
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

        {courses.length === 0 &&
          viewMode === "generator" &&
          !showOnboarding && (
            <div className="flex-1 flex flex-col items-center justify-center mb-8">
              <div className="bg-[#D500F9] border-4 border-black p-12 md:p-24 text-center shadow-[16px_16px_0px_#111] rotate-[-1deg]">
                <h2 className="text-4xl md:text-6xl font-black text-white uppercase mb-6 leading-tight">
                  No hay <br /> <span className="text-[#FFEA00]">cursos</span>
                </h2>
                <p className="font-mono text-white text-lg md:text-xl font-bold max-w-md mx-auto mb-10">
                  Abre la configuración para elegir los cursos que llevarás en
                  este semestre.
                </p>
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="bg-[#FFEA00] text-black border-4 border-black px-8 py-4 text-2xl font-black uppercase shadow-[8px_8px_0px_#111] hover:translate-y-1 hover:shadow-[4px_4px_0px_#111] transition-all"
                >
                  Configurar Ahora
                </button>
              </div>
            </div>
          )}

        {courses.length > 0 && viewMode === "my_schedules" && (
          <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <AllSchedulesView
              courses={courses}
              excludedCourses={excludedCourses}
              excludedSections={excludedSections}
              toggleSection={handleToggleSection}
            />
          </main>
        )}

        {viewMode === "global_schedules" && (
          <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <GlobalSchedulesView />
          </main>
        )}

        {viewMode === "social" && <SocialView />}
      </div>

      {showOnboarding && (
        <OnboardingModal
          initialSelected={mySelectedCourseNames}
          onComplete={handleOnboardingComplete}
        />
      )}
    </>
  );
}
