import { useState } from "react";
import { cn } from "../utils/tw";
import { getAllYearsData } from "../utils/scheduler";

interface OnboardingModalProps {  initialSelected: string[];

  onComplete: (selectedCourseNames: string[]) => void;
}

export function OnboardingModal({ onComplete, initialSelected = [] }: OnboardingModalProps) {
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set(initialSelected));
  const allYears = getAllYearsData();

  const toggleCourse = (courseName: string) => {
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseName)) next.delete(courseName);
      else next.add(courseName);
      return next;
    });
  };

  const selectAllYear = (yearCourses: any[]) => {
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      const allSelected = yearCourses.every((c) => next.has(c.curso));
      if (allSelected) {
        yearCourses.forEach((c) => next.delete(c.curso));
      } else {
        yearCourses.forEach((c) => next.add(c.curso));
      }
      return next;
    });
  };

  const handleFinish = () => {
    if (selectedCourses.size === 0) {
      alert("Por favor selecciona al menos un curso para empezar.");
      return;
    }
    onComplete(Array.from(selectedCourses));
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#111] max-w-4xl w-full max-h-[90vh] flex flex-col neo-brutalist animate-in fade-in zoom-in duration-300">
        <div className="bg-[#FF9100] border-b-4 border-black p-6 shrink-0">
          <h2 className="text-3xl md:text-4xl font-black uppercase text-black">
            ¡Arma tu Semestre!
          </h2>
          <p className="font-bold font-mono text-black mt-2">
            Selecciona los cursos que estás llevando. Puedes combinar años para armar tu horario ideal.
          </p>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-gray-50 flex flex-col gap-8 custom-scrollbar">
          {allYears.map((yearData) => {
            if (yearData.courses.length === 0) return null;
            
            const allSelected = yearData.courses.every((c) =>
              selectedCourses.has(c.curso)
            );

            return (
              <div key={yearData.year} className="bg-white border-4 border-black shadow-[4px_4px_0px_#111] p-4">
                <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                  <h3 className="text-2xl font-black uppercase">{yearData.year}</h3>
                  <button
                    onClick={() => selectAllYear(yearData.courses)}
                    className="text-xs font-bold font-mono border-2 border-black px-2 py-1 bg-[#FFEA00] shadow-[2px_2px_0px_#111] hover:translate-y-0.5 hover:shadow-none transition-all"
                  >
                    {allSelected ? "DESELECCIONAR AÑO" : "SELECCIONAR AÑO"}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {yearData.courses.map((course) => (
                    <label
                      key={course.curso}
                      className={cn(
                        "flex items-start gap-3 p-3 border-2 border-black cursor-pointer transition-all font-mono text-sm font-bold",
                        selectedCourses.has(course.curso)
                          ? "bg-[#00E676] shadow-[2px_2px_0px_#111]"
                          : "bg-white hover:bg-gray-100"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="w-5 h-5 mt-0.5 accent-black border-2 border-black cursor-pointer shrink-0"
                        checked={selectedCourses.has(course.curso)}
                        onChange={() => toggleCourse(course.curso)}
                      />
                      <span className="leading-tight">{course.curso}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t-4 border-black bg-white flex justify-end shrink-0">
          <button
            onClick={handleFinish}
            className="text-xl font-black uppercase border-4 border-black px-8 py-3 bg-[#2979FF] text-white shadow-[4px_4px_0px_#111] hover:translate-y-1 hover:shadow-none transition-all"
          >
            Continuar →
          </button>
        </div>
      </div>
    </div>
  );
}
