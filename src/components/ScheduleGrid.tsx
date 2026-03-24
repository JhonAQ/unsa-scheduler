import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../utils/tw";
import { DAYS, parseTimeStr } from "../utils/scheduler";

interface ScheduleGridProps {
  sessions: any[];
  startHour?: number;
  endHour?: number;
  excludedCourses?: Set<string>;
  excludedSections?: Set<string>;
  toggleSection?: (curso: string, seccion: string) => void;
}

export function ScheduleGrid({
  sessions,
  startHour = 7,
  endHour = 20,
  excludedCourses = new Set(),
  excludedSections = new Set(),
  toggleSection,
}: ScheduleGridProps) {
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
              const secKey = `${s.curso}-${isTheory ? "teoria" : "lab"}-${
                s.seccion
              }`;
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
                      ? "opacity-40 saturate-0 scale-95 hover:scale-[1.02]"
                      : "opacity-90 hover:scale-[1.02] hover:opacity-100",
                  )}
                  style={{
                    top: `${styleTop}px`,
                    height: `${styleHeight}px`,
                    width: `calc(${styleWidth}% - 10px)`,
                    left: `calc(${styleLeft}% + 5px)`,
                  }}
                  title={`${s.curso} | ${
                    s.tipoSec === "Teoría" ? "TEORÍA" : "LABORATORIO"
                  } ${s.seccion} (${s.tipo}) | ${s.hora_inicio} - ${s.hora_fin}`}
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
