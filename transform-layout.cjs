const fs = require("fs");
let code = fs.readFileSync("src/App.tsx", "utf-8");

// 1. Root App Div -> h-screen
code = code.replace(
  /<div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">/,
  '<div className="h-screen overflow-hidden flex flex-col p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">',
);

// 2. Reduce header padding slightly
code = code.replace(
  /<header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-\[\#111\] pb-6 gap-6">/,
  '<header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-\[\#111\] pb-4 gap-4 flex-shrink-0">',
);

// 3. Fix margins on viewMode buttons
code = code.replace(
  /<div className="flex flex-wrap gap-4 font-mono font-bold text-lg mb-4">/,
  '<div className="flex flex-wrap gap-4 font-mono font-bold text-lg flex-shrink-0">',
);

// 4. Main grid configuration -> fill remaining height, flex-1 min-h-0
code = code.replace(
  /<main className="grid grid-cols-1 lg:grid-cols-4 gap-8">/,
  '<main className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0 overflow-hidden">',
);

// 5. Aside configuration -> fill height, be flex column
code = code.replace(
  /<aside className="lg:col-span-1 space-y-6">/,
  '<aside className="lg:col-span-1 flex flex-col min-h-0 shadow-[4px_4px_0px_#111]">',
);

code = code.replace(
  /<div className="bg-white neo-brutalist p-6">/,
  '<div className="bg-white border-4 border-black p-4 flex flex-col h-full overflow-hidden">',
);

// 6. Make courses wrapper scrollable
code = code.replace(
  /<div className="space-y-4 font-mono">/,
  '<div className="space-y-4 font-mono overflow-y-auto flex-1 pr-2 custom-scrollbar">',
);

// 7. Change courses map to use <details>
const coursesMapRegex =
  /<div key=\{course\.curso\} className="space-y-2">[\s\S]*?<label[\s\S]*?<\/label>[\s\S]*?<div className="pl-7 space-y-3 mt-1">/g;
code = code.replace(coursesMapRegex, (match) => {
  return `<details key={course.curso} className="space-y-2 group group-open:bg-gray-50 pb-2 border-b-2 border-dashed border-gray-200 last:border-b-0">
                      <summary className="flex items-center gap-2 font-bold cursor-pointer text-base sm:text-lg outline-none select-none py-1">
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={() => toggleCourse(course.curso)}
                          className="w-5 h-5 accent-black border-2 border-black"
                        />
                        <span
                          className={cn("flex-1 leading-tight",
                            isExcluded && "line-through text-gray-400",
                          )}
                        >
                          {course.curso}
                        </span>
                        <span className="text-xl group-open:rotate-180 transition-transform">
                          ▼
                        </span>
                      </summary>

                      <div className="pl-7 space-y-3 mt-2 pb-2">`;
});

// Remove closing </div> for details
code = code.replace(
  /<\/div>\s*<\/div>\s*\);\s*\}\)\}\s*<\/div>\s*<\/div>\s*<div className="bg-\[\#2979FF\] text-white neo-brutalist p-6 flex flex-col gap-2">/g,
  `</div>
                    </details>
                  );
                })}
              </div>
            </div>`,
);

// Delete the blue "Estado" block completely (it's already removed in the previous regex)
code = code.replace(
  /<div className="bg-\[\#2979FF\] text-white neo-brutalist p-6 flex flex-col gap-2">[\s\S]*?<\/div>\s*<\/aside>/,
  "</aside>",
);

// 8. Adjust Right section wrapper
code = code.replace(
  /<section className="lg:col-span-3 space-y-6 min-w-0 overflow-hidden">/,
  '<section className="lg:col-span-3 flex flex-col min-h-0 space-y-4">',
);

// 9. Optimize Orange settings bar
const oldOrangeBarRegex =
  /<div className="bg-\[\#FF9100\].*?\{processedCombinations\.length === 0 \? \(/s;
const newOrangeBar = `<div className="bg-[#FF9100] border-4 border-black p-3 md:p-4 neo-brutalist shadow-[4px_4px_0px_#111] font-mono shrink-0">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                
                <div className="space-y-1 shrink-0 w-full lg:w-48">
                  <label className="block text-black font-black uppercase text-[10px] leading-tight">Ordenar</label>
                  <select 
                    value={sortBy} 
                    onChange={e => setSortBy(e.target.value as any)}
                    className="w-full p-1.5 text-sm border-2 border-black bg-white appearance-none outline-none font-bold focus:ring-0 shadow-[2px_2px_0px_#111] cursor-pointer"
                  >
                    <option value="default">Por defecto</option>
                    <option value="compact">Compacto</option>
                    <option value="free_days">Dias Libres</option>
                    <option value="start_late">Tardes</option>
                    <option value="end_early">Mañanas</option>
                  </select>
                </div>

                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-black font-black uppercase text-[10px] leading-tight">Día Libre</label>
                    <div className="flex gap-1.5">
                      {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(d => (
                        <button
                          key={d}
                          onClick={() => toggleWantedFreeDay(d)}
                          className={cn(
                            "p-1 border-2 border-black font-bold uppercase transition-transform w-8 text-xs text-center",
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

                  <div className="space-y-1">
                    <label className="block text-black font-black uppercase text-[10px] leading-tight">Rango Horario</label>
                    <div className="flex items-center gap-2">
                         <input type="time" min="07:00" max="21:00" step="1800"
                           value={String(Math.floor(minTime/60)).padStart(2,'0') + ":" + String(minTime%60).padStart(2,'0')}
                           onChange={(e) => { const [h,m] = e.target.value.split(':').map(Number); setMinTime(h*60+m); }}
                           className="border-2 border-black px-1 py-0.5 w-full bg-white font-bold outline-none font-mono text-xs"
                         />
                         <span className="font-black text-xs">-</span>
                         <input type="time" min="07:00" max="21:00" step="1800"
                           value={String(Math.floor(maxTime/60)).padStart(2,'0') + ":" + String(maxTime%60).padStart(2,'0')}
                           onChange={(e) => { const [h,m] = e.target.value.split(':').map(Number); setMaxTime(h*60+m); }}
                           className="border-2 border-black px-1 py-0.5 w-full bg-white font-bold outline-none font-mono text-xs"
                         />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-black font-black uppercase text-[10px] leading-tight">Max Huecos (<span className="text-black font-extrabold">{maxTotalGaps >= 720 ? "Libre" : (maxTotalGaps / 60).toFixed(0) + "h"}</span>)</label>
                    <div className="flex items-center gap-2 h-full pb-1">
                      <input 
                        type="range" min="0" max="720" step="60" 
                        value={maxTotalGaps} 
                        onChange={e => setMaxTotalGaps(Number(e.target.value))} 
                        className="w-full accent-black cursor-pointer" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {processedCombinations.length === 0 ? (`;

code = code.replace(oldOrangeBarRegex, newOrangeBar);

// Combine status into pagination and fix Calendar wrapper to be scrollable
const oldPaginationRegex =
  /<div className="flex flex-col sm:flex-row items-center justify-between bg-white neo-brutalist p-4 gap-4">.*?<\/button>\s*<\/div>\s*<div className="bg-white neo-brutalist p-2 md:p-6 overflow-x-auto relative">/s;

const newPagination = `<div className="flex flex-col sm:flex-row items-center justify-between bg-white border-4 border-black p-2 md:p-4 gap-4 shrink-0 shadow-[4px_4px_0px_#111]">
                  <button
                    disabled={currentComboIdx === 0}
                    onClick={() => setCurrentComboIdx((i) => i - 1)}
                    className="p-2 border-2 border-black disabled:opacity-50 hover:bg-[#FFEA00]"
                  >
                    <ArrowLeft strokeWidth={3} />
                  </button>
                  <span className="font-mono font-bold text-lg md:text-xl uppercase text-center bg-[#2979FF] text-white px-4 py-1 border-2 border-black rotate-[-1deg]">
                    Opción {currentComboIdx + 1} de {processedCombinations.length} horarios válidos
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

                <div className="bg-white border-4 border-black p-2 md:p-6 overflow-y-auto overflow-x-auto relative flex-1 min-h-0 shadow-[4px_4px_0px_#111] custom-scrollbar">`;
code = code.replace(oldPaginationRegex, newPagination);

// Update CalendarGrid internals for dynamic hours
const oldCalendarGrid =
  /function CalendarGrid\(\{\s*combo,\s*\}\:\s*\{\s*combo\:\s*ScheduleCombination;\s*coursesMap\?\:\s*Course\[\];\s*\}\) \{[\s\S]*?const startHour = 7;\s*const endHour = 20; \/\/ Hasta las 8:00 PM[^\n]*\n/s;
const newCalendarGrid = `function CalendarGrid({
  combo,
}: {
  combo: ScheduleCombination;
  coursesMap?: Course[];
}) {
  const { startHour, endHour } = useMemo(() => {
    let minT = 24 * 60;
    let maxT = 0;
    Object.values(combo.selection).forEach(sel => {
       sel.teoria?.sesiones.forEach(s => {
          const st = parseTimeStr(s.hora_inicio);
          const en = parseTimeStr(s.hora_fin);
          if (st < minT) minT = st;
          if (en > maxT) maxT = en;
       });
       sel.laboratorio?.sesiones.forEach(s => {
          const st = parseTimeStr(s.hora_inicio);
          const en = parseTimeStr(s.hora_fin);
          if (st < minT) minT = st;
          if (en > maxT) maxT = en;
       });
    });
    
    if (minT === 24 * 60) return { startHour: 7, endHour: 20 };
    return {
      startHour: Math.max(0, Math.floor(minT / 60) - 1),
      endHour: Math.min(23, Math.ceil(maxT / 60))
    };
  }, [combo.selection]);

  const CELL_HEIGHT = 50; // Reduced from 60
`;
code = code.replace(oldCalendarGrid, newCalendarGrid);

// Replace `* 60` with `* CELL_HEIGHT` and `60px` with `50px`
code = code.replace(
  /height: \`\$\{\(endHour - startHour \+ 1\) \* 60\}px\`,/g,
  "height: `${(endHour - startHour + 1) * CELL_HEIGHT}px`,",
);
code = code.replace(/bg-\[length:100%_60px\]/g, "bg-[length:100%_50px]");
code = code.replace(
  /offsetFromStartDay = startT - startHour \* 60;/g,
  "offsetFromStartDay = (startT - startHour * 60) * (CELL_HEIGHT / 60);",
);
code = code.replace(
  /const duration = endT - startT;/g,
  "const duration = (endT - startT) * (CELL_HEIGHT / 60);",
);
code = code.replace(/h-\[60px\] border-b-2/g, "h-[50px] border-b-2");

// Add sticky to the header
code = code.replace(
  /<div className="grid grid-cols-\[80px_1fr_1fr_1fr_1fr_1fr\] bg-gray-100 font-bold text-center">/,
  '<div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] bg-gray-100 font-bold text-center sticky top-0 z-50 shadow-sm">',
);

fs.writeFileSync("src/App.tsx", code);
