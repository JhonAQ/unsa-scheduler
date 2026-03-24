const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// The tricky part last time was formatting differences.
// This time I'll just use a reliable approach, replacing specific well-known blocks.

const courseBlockOld = `              <div className="space-y-4 font-mono overflow-y-auto flex-1 pr-2 custom-scrollbar">
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

                      <div className="pl-7 space-y-3 mt-1">`;

const courseBlockNew = `              <div className="space-y-4 font-mono overflow-y-auto flex-1 pr-2 custom-scrollbar">
                {courses.map((course) => {
                  const isExcluded = excludedCourses.has(course.curso);
                  return (
                    <details key={course.curso} className="space-y-2 group group-open:bg-gray-50 pb-2 border-b-2 border-dashed border-gray-200 last:border-b-0">
                      <summary className="flex items-center gap-2 font-bold cursor-pointer text-base sm:text-lg outline-none select-none py-1">
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={() => toggleCourse(course.curso)}
                          className="w-5 h-5 accent-black border-2 border-black"
                        />
                        <span
                          className={cn(
                            "flex-1 leading-tight",
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

if (code.includes(courseBlockOld)) {
    code = code.replace(courseBlockOld, courseBlockNew);
    console.log("Replaced start of courses map");
} else {
    console.log("Could not find start of courses map. Trying fallback:");
    // Try to replace the whole block dynamically 
    const mapStart = code.indexOf(`{courses.map((course) => {`);
    if (mapStart > 0) {
        console.log("Found map start at", mapStart);
    }
}

// 2. Change the closing tags of the courses map, AND REMOVE the BLUE STATUS BOX
// The easiest regex is everything from the closing `</div>` of `.pl-7` to the end of `<aside>`
const endOfCoursesRegex = /<\/div>\s*<\/div>\s*\);\s*\}\)\}\s*<\/div>\s*<\/div>\s*<div className="bg-\[\#2979FF\] text-white neo-brutalist p-6 flex flex-col gap-2">\s*<h2 className="text-2xl font-bold uppercase">Estado<\/h2>\s*<div className="font-mono text-xl">\s*Opciones validas:\{" "\}\s*<span className="bg-black px-2">\s*\{processedCombinations\.length\}\s*<\/span>\s*<\/div>\s*<\/div>\s*<\/aside>/;

const replacementForEndOfCourses = `</div>
                    </details>
                  );
                })}
              </div>
            </div>
          </aside>`;

if (endOfCoursesRegex.test(code)) {
    code = code.replace(endOfCoursesRegex, replacementForEndOfCourses);
    console.log("Replaced end of courses map and removed blue status box!");
} else {
    console.log("Failed to match end of courses regex!");
}

// 3. Fix the right section and Orange filters. Make it absolute text replace.
const orangeOldRegex = /<section className="lg:col-span-3 space-y-6 min-w-0 overflow-hidden">\s*<div className="bg-\[\#FF9100\].*?\{processedCombinations\.length === 0 \? \(/s;

const orangeNew = `<section className="lg:col-span-3 flex flex-col min-h-0 space-y-4">
            <div className="bg-[#FF9100] border-4 border-black p-3 md:p-4 neo-brutalist shadow-[4px_4px_0px_#111] font-mono shrink-0">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                <div className="space-y-1 shrink-0 w-full lg:w-48">
                  <label className="block text-black font-black uppercase text-[10px] leading-tight">
                    Ordenar
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
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
                    <label className="block text-black font-black uppercase text-[10px] leading-tight">
                      Día Libre
                    </label>
                    <div className="flex gap-1.5">
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
                            "p-1 border-2 border-black font-bold uppercase transition-transform w-8 text-xs text-center",
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

                  <div className="space-y-1">
                    <label className="block text-black font-black uppercase text-[10px] leading-tight">
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
                            const [h, m] = e.target.value
                              .split(":")
                              .map(Number);
                            setMinTime(h * 60 + m);
                          }}
                          className="border-2 border-black px-1 py-0.5 w-full bg-white font-bold outline-none font-mono text-xs"
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
                            const [h, m] = e.target.value
                              .split(":")
                              .map(Number);
                            setMaxTime(h * 60 + m);
                          }}
                          className="border-2 border-black px-1 py-0.5 w-full bg-white font-bold outline-none font-mono text-xs"
                        />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-black font-black uppercase text-[10px] leading-tight">
                      Max Huecos (
                      <span className="text-black font-extrabold">
                        {maxTotalGaps >= 720
                          ? "Libre"
                          : (maxTotalGaps / 60).toFixed(0) + "h"}
                      </span>
                      )
                    </label>
                    <div className="flex items-center gap-2 h-full pb-1">
                      <input
                        type="range"
                        min="0"
                        max="720"
                        step="60"
                        value={maxTotalGaps}
                        onChange={(e) =>
                          setMaxTotalGaps(Number(e.target.value))
                        }
                        className="w-full accent-black cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {processedCombinations.length === 0 ? (`;

if (orangeOldRegex.test(code)) {
    code = code.replace(orangeOldRegex, orangeNew);
    console.log("Replaced orange filters section!");
} else {
    console.log("Failed to match orange regex.");
}

// 4. Transform Pagination -> merge Status with it
const paginationRegex = /<div className="flex flex-col sm:flex-row items-center justify-between bg-white neo-brutalist p-4 gap-4">.*?<\/button>\s*<\/div>\s*<div className="bg-white neo-brutalist p-2 md:p-6 overflow-x-auto relative">/s;

const paginationNew = `<div className="flex flex-col sm:flex-row items-center justify-between bg-white border-4 border-black p-2 md:p-4 gap-4 shrink-0 shadow-[4px_4px_0px_#111]">
                  <button
                    disabled={currentComboIdx === 0}
                    onClick={() => setCurrentComboIdx((i) => i - 1)}
                    className="p-2 border-2 border-black disabled:opacity-50 hover:bg-[#FFEA00]"
                  >
                    <ArrowLeft strokeWidth={3} />
                  </button>
                  <span className="font-mono font-bold text-lg md:text-xl uppercase text-center bg-[#2979FF] text-white px-4 py-1 border-2 border-black rotate-[-1deg] shadow-[2px_2px_0px_#111]">
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

if (paginationRegex.test(code)) {
    code = code.replace(paginationRegex, paginationNew);
    console.log("Replaced pagination!");
} else {
    console.log("Failed to match pagination regex.");
}

fs.writeFileSync('src/App.tsx', code);
console.log("Script execution finished.");
