import { cn } from "../utils/tw";
import type { Course } from "../lib/types";

interface FilterSidebarProps {
  sortBy: string;
  setSortBy: (v: any) => void;
  wantedFreeDays: string[];
  toggleWantedFreeDay: (day: string) => void;
  minTime: number;
  setMinTime: (v: number) => void;
  maxTime: number;
  setMaxTime: (v: number) => void;
  courses: Course[];
  excludedCourses: Set<string>;
  excludedSections: Set<string>;
  toggleCourse: (curso: string) => void;
  toggleSection: (curso: string, seccion: string) => void;
}

export function FilterSidebar({
  sortBy,
  setSortBy,
  wantedFreeDays,
  toggleWantedFreeDay,
  minTime,
  setMinTime,
  maxTime,
  setMaxTime,
  courses,
  excludedCourses,
  excludedSections,
  toggleCourse,
  toggleSection,
}: FilterSidebarProps) {
  return (
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
              onChange={(e) => setSortBy(e.target.value)}
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
                {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(
                  (d) => (
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
                  )
                )}
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
                    className={cn(isExcluded && "line-through text-gray-400")}
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
                                  `teoria-${sec.seccion}`
                                )
                              }
                              disabled={isExcluded}
                              className={cn(
                                "px-2 py-1 border-2 border-black font-bold text-sm transition-transform",
                                !secExcluded && !isExcluded
                                  ? "bg-[#00E676] shadow-[2px_2px_0px_#111]"
                                  : "bg-gray-200 text-gray-400",
                                isExcluded && "opacity-50 cursor-not-allowed"
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
                                toggleSection(course.curso, `lab-${sec.seccion}`)
                              }
                              disabled={isExcluded}
                              className={cn(
                                "px-2 py-1 border-2 border-black font-bold text-sm transition-transform",
                                !secExcluded && !isExcluded
                                  ? "bg-[#00E676] shadow-[2px_2px_0px_#111]"
                                  : "bg-gray-200 text-gray-400",
                                isExcluded && "opacity-50 cursor-not-allowed"
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
  );
}
