const fs = require("fs");
let code = fs.readFileSync("src/App.tsx", "utf-8");

// The file was reset. Apply everything securely.

// 1. IMPORT
if (!code.includes("import initialData from")) {
  code = code.replace(
    'import type { Course, ScheduleCombination } from "./lib/types";',
    `import type { Course, ScheduleCombination } from "./lib/types";\nimport initialData from "../data/schedule.json";`,
  );
}

// 2. NORMALIZATION FUNCTION & STATE
const normalizationFn = `
function getInitialCourses(): Course[] {
  if (!initialData || !(initialData as any).horario_academico) return [];
  return (initialData as any).horario_academico.map((c: any) => {
    const teoriasMap: Record<string, any> = {};
    const laboratoriosMap: Record<string, any> = {};

    c.secciones.forEach((sec: any) => {
      sec.sesiones.forEach((ses: any) => {
        const tipoLower = ses.tipo.toLowerCase();
        if (tipoLower.includes("teoría") || tipoLower.includes("teoria") || tipoLower.includes("teor\\u00c3\\u00ada")) {
          if (!teoriasMap[sec.seccion]) {
            teoriasMap[sec.seccion] = { seccion: sec.seccion, total_sesiones_semanales: 0, sesiones: [] };
          }
          teoriasMap[sec.seccion].sesiones.push(ses);
        } else if (tipoLower.includes("laboratorio") || tipoLower.includes("práctica") || tipoLower.includes("practica") || tipoLower.includes("pr\\u00c3\\u00a1ctica")) {
          if (!laboratoriosMap[sec.seccion]) {
            laboratoriosMap[sec.seccion] = { seccion: sec.seccion, total_sesiones_semanales: 0, sesiones: [] };
          }
          laboratoriosMap[sec.seccion].sesiones.push(ses);
        }
      });
    });

    return { curso: c.curso, secciones: c.secciones, teorias: Object.values(teoriasMap), laboratorios: Object.values(laboratoriosMap) };
  });
}
`;
if (!code.includes("function getInitialCourses()")) {
  code = code.replace(
    "export default function App() {",
    normalizationFn + "\nexport default function App() {",
  );
}
code = code.replace(
  "const [courses, setCourses] = useState<Course[]>([]);",
  "const [courses, setCourses] = useState<Course[]>(getInitialCourses);",
);

// 3. REMOVE FILE UPLOAD LOGIC
code = code.replace(
  /const fileInputRef = useRef<HTMLInputElement>\(null\);\s*const handleFileUpload =.*?catch \(err\) \{\s*setError\("Error al leer el archivo JSON\."\);\s*\}\s*};\s*reader\.readAsText\(file\);\s*};/s,
  "",
);

// 4. HEADER AND UI
// Locate from `<div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">`
// Down to `<main className="grid grid-cols-1 lg:grid-cols-4 gap-8">`

const headerUI =
  /<div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">.*?<main className="grid grid-cols-1 lg:grid-cols-4 gap-8">/s;

const newHeaderUI = `<div className="h-screen overflow-hidden flex flex-col p-2 md:p-4 max-w-7xl mx-auto space-y-4">
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
            <AlertTriangle strokeWidth={3} className="w-4 h-4"/> {errorError}
          </div>
        )}

        {courses.length > 0 && viewMode === "generator" && (
          <main className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0 overflow-hidden">`;

code = code.replace(headerUI, newHeaderUI);

// 5. EXTRACT & MOVE FILTERS TO ASIDE, MAKE ASIDE SCROLLABLE
// Search for Aside
const asideRegex =
  /<aside className="lg:col-span-1 space-y-6">.*?<div className="space-y-4 font-mono">/s;
const startFilters = code.indexOf('<div className="bg-[#FF9100]');
const endFilters = code.indexOf(
  "{processedCombinations.length === 0 ?",
  startFilters,
);

let filtersBlock = "";
if (startFilters !== -1 && endFilters !== -1) {
  filtersBlock = code.substring(startFilters, endFilters);
  code = code.substring(0, startFilters) + code.substring(endFilters); // remove from original pos
}

// Compact the filters block
filtersBlock = filtersBlock.replace(
  /<div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">/,
  '<div className="flex flex-col gap-3">',
);
filtersBlock = filtersBlock.replace(
  /<div className="space-y-2 flex-shrink-0">/,
  '<div className="space-y-1">',
);
filtersBlock = filtersBlock.replace(
  "w-full xl:w-64 p-2",
  "w-full p-1.5 text-xs",
);
filtersBlock = filtersBlock.replace(
  /<div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">/,
  '<div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">',
);
filtersBlock = filtersBlock.replace(/text-sm/g, "text-[10px]");
filtersBlock = filtersBlock.replace(/p-4 md:p-6/g, "p-3");
filtersBlock = filtersBlock.replace(/mb-4/g, "mb-2");

const newAside = `<aside className="lg:col-span-1 flex flex-col min-h-0 gap-3">
            ${filtersBlock}
            <div className="bg-white border-4 border-black p-3 md:p-4 flex flex-col flex-1 min-h-0 shadow-[4px_4px_0px_#111]">
              <h2 className="text-xl mb-3 bg-black text-white px-2 py-1 inline-block uppercase shrink-0">
                Cursos
              </h2>

              <div className="space-y-2 font-mono overflow-y-auto flex-1 pr-2 custom-scrollbar">`;

code = code.replace(asideRegex, newAside);

// 6. REPLACE COURSE RENDER WITH ACCORDIONS (<details>)
const coursesMapRegex =
  /\{\s*courses\.map\(\(course\) => \{\s*const isExcluded = excludedCourses\.has\(course\.curso\);\s*return \(\s*<div key=\{course\.curso\} className="space-y-2">\s*<label className="flex items-center gap-2 font-bold cursor-pointer text-lg">/s;

const newCoursesMap = `{courses.map((course) => {
                  const isExcluded = excludedCourses.has(course.curso);
                  return (
                    <details key={course.curso} className="space-y-2 group group-open:bg-gray-50 pb-2 border-b-2 border-dashed border-gray-200 last:border-b-0">
                      <summary className="flex items-center gap-2 font-bold cursor-pointer text-sm sm:text-base outline-none select-none py-1">`;

code = code.replace(coursesMapRegex, newCoursesMap);

// End tags for accordion
const endCoursesRegex = /<\/label>\s*<div className="pl-7 space-y-3 mt-1">/s;
const newEndCourses = `</summary>\n<div className="pl-6 space-y-3 mt-2 pb-2">`;
code = code.replace(endCoursesRegex, newEndCourses);

// Convert `</div>` closing course map to `</details>` and remove the blue "Estado" box entirely
const blueBoxRegex =
  /<\/div>\s*<\/div>\s*\);\s*\}\)\}\s*<\/div>\s*<\/div>\s*<div className="bg-\[\#2979FF\] text-white neo-brutalist p-6 flex flex-col gap-2">\s*<h2 className="text-2xl font-bold uppercase">Estado<\/h2>\s*<div className="font-mono text-xl">\s*Opciones validas:\{" "\}\s*<span className="bg-black px-2">\s*\{processedCombinations\.length\}\s*<\/span>\s*<\/div>\s*<\/div>\s*<\/aside>/s;
const replacementEndAside = `</div>
                    </details>
                  );
                })}
              </div>
            </div>
          </aside>`;
code = code.replace(blueBoxRegex, replacementEndAside);

// 7. FIX SECTION RIGHT AND PREPARE PAGINATION
const rightSectionRegex =
  /<section className="lg:col-span-3 space-y-6 min-w-0 overflow-hidden">\s*\{processedCombinations\.length === 0 \? \(/s;
const newRightSection = `<section className="lg:col-span-3 flex flex-col min-h-0 space-y-3">
            {processedCombinations.length === 0 ? (`;
code = code.replace(rightSectionRegex, newRightSection);

const paginationRegex =
  /<div className="flex flex-col sm:flex-row items-center justify-between bg-white neo-brutalist p-4 gap-4">/s;
const newPagination = `<div className="flex flex-col sm:flex-row items-center justify-between bg-white border-4 border-black p-2 md:p-3 gap-2 shrink-0 shadow-[4px_4px_0px_#111]">`;
code = code.replace(paginationRegex, newPagination);

const calendarHostRegex =
  /<div className="bg-white neo-brutalist p-2 md:p-6 overflow-x-auto relative">/s;
const newCalendarHost = `<div className="bg-white border-4 border-black p-2 md:p-4 overflow-y-auto overflow-x-auto relative flex-1 min-h-0 shadow-[4px_4px_0px_#111] custom-scrollbar">`;
code = code.replace(calendarHostRegex, newCalendarHost);

// Integrate the blue text in pagination
code = code.replace(
  /<span className="font-mono font-bold text-xl md:text-2xl uppercase text-center">/g,
  '<span className="font-mono font-bold text-sm md:text-base uppercase text-center bg-[#2979FF] text-white px-4 py-1 border-2 border-black rotate-[-1deg] shadow-[2px_2px_0px_#111]">',
);
code = code.replace(
  /Opción \{currentComboIdx \+ 1\} \/\{" "\}\s*\{processedCombinations\.length\}/,
  "Opción {currentComboIdx + 1} de {processedCombinations.length} horarios válidos",
);

// 8. UPDATE CALENDAR GRID (Reduce height, dynamic limits)
const calRegex =
  /function CalendarGrid\(\{[\s\S]*?className=\{cn\(\s*"absolute p-1\.5 md:p-2 border-2 border-black overflow-hidden[\s\S]*?style=\{\{/s;

const newCalendarStart = `const CELL_HEIGHT = 44; 

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
          all.push({ curso, seccion: \`Teo \${sel.teoria.seccion}\`, ...sesion });
        }
      }
      if (sel.laboratorio) {
        for (const sesion of sel.laboratorio.sesiones) {
          all.push({ curso, seccion: \`Lab \${sel.laboratorio.seccion}\`, ...sesion });
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
          <div key={d} className="border-r-2 border-b-2 border-black p-2 uppercase">
            {d}
          </div>
        ))}
      </div>

      <div
        className="relative border-b-2 border-black opacity-90 bg-white bg-[linear-gradient(_transparent_99%,_#eaeaea_100%_)]"
        style={{
          height: \`\${(endHour - startHour + 1) * CELL_HEIGHT}px\`,
          backgroundSize: \`100% \${CELL_HEIGHT}px\`
        }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-[80px] border-r-2 border-black bg-white/50 backdrop-blur-sm z-10 flex flex-col pointer-events-none">
          {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
            <div
              key={i}
              style={{ height: \`\${CELL_HEIGHT}px\` }}
              className="border-b-2 border-gray-200 text-xs font-bold text-center pt-1 text-gray-500"
            >
              {String(startHour + i).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        <div className="absolute left-[80px] right-0 top-0 bottom-0">
          <AnimatePresence>
            {sessions.map((s, i) => {
              const dayIdx = DAYS.findIndex((d) => d.toLowerCase() === s.dia.toLowerCase());
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
                  key={\`\${s.curso}-\${s.dia}-\${s.hora_inicio}-\${i}\`}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  className={cn(
                    "absolute p-1 md:p-1.5 border-2 border-black overflow-hidden hover:z-20 transition-transform hover:-translate-y-1 shadow-[2px_2px_0px_#111]",
                    bgColor,
                    "text-black",
                  )}
                  style={{`;

if (calRegex.test(code)) {
  code = code.replace(calRegex, newCalendarStart);
} else {
  // wait, it might be using old class name from before dashboard
  const fallbackCalRegex =
    /function CalendarGrid\(\{[\s\S]*?className=\{cn\(\s*"absolute p-2 border-2 border-black overflow-hidden[\s\S]*?style=\{\{/s;
  if (fallbackCalRegex.test(code)) {
    code = code.replace(fallbackCalRegex, newCalendarStart);
  }
}

// 9. CLEAN UP unused icons
code = code.replace(
  "import { Upload, AlertTriangle, ArrowRight, ArrowLeft }",
  "import { AlertTriangle, ArrowRight, ArrowLeft }",
);

fs.writeFileSync("src/App.tsx", code);
console.log("App.tsx step 4 ALL complete");
