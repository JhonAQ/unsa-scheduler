const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add static Data Initializer
if (!code.includes('import initialData from')) {
    code = code.replace(
        'import type { Course, ScheduleCombination } from "./lib/types";',
        `import type { Course, ScheduleCombination } from "./lib/types";\nimport initialData from "../data/schedule.json";`
    );
}

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
          tipoLower.includes("practica") ||
          tipoLower.includes("pr\\u00c3\\u00a1ctica")
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
  });
}
`;
if (!code.includes('function getInitialCourses()')) {
    code = code.replace(
        'export default function App() {',
        normalizationFn + '\nexport default function App() {'
    );
}

// Ensure the state initializer runs
code = code.replace(
    'const [courses, setCourses] = useState<Course[]>([]);',
    'const [courses, setCourses] = useState<Course[]>(getInitialCourses);'
);


// 2. Remove the Upload button usages
code = code.replace(/const fileInputRef = useRef<HTMLInputElement>\(null\);\s*const handleFileUpload =.*?setError\("Error al leer el archivo JSON\."\);\s*\}\s*};\s*};/s, '');

// Clean unused imports
code = code.replace('import { Upload, AlertTriangle, ArrowRight, ArrowLeft }', 'import { AlertTriangle, ArrowRight, ArrowLeft }');

// 3. Rewrite header and tabs
const headerOld = code.substring(code.indexOf('<header className="flex'), code.indexOf('</header>') + 9);
const midOld = code.substring(code.indexOf('{errorError &&'), code.indexOf('</button>\n          </div>\n        )}'));

const newHeader = `<header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-[#111] pb-2 gap-4 flex-shrink-0"> 
          <div>
            <h1 className="text-3xl tracking-tighter text-[#111] mb-1 leading-none uppercase">
              Schedule{" "}
              <span className="bg-[#FFEA00] px-2 py-0.5 select-none border-2 border-[#111] rotate-[-2deg] inline-block shadow-[2px_2px_0px_#111]">
                Generator
              </span>
            </h1>
            <p className="text-sm font-bold font-mono text-gray-700">
              EXPLORADOR UNIVERSITARIO SIN CRUCES V1.0
            </p>
          </div>

          <div className="flex flex-wrap gap-2 font-mono font-bold text-sm flex-shrink-0">
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
        </header>

        {errorError && (
          <div className="bg-[#FF3366] text-white p-2 neo-brutalist flex items-center gap-2 font-mono font-bold text-sm">
            <AlertTriangle strokeWidth={3} className="w-4 h-4" /> {errorError}
          </div>
        )}`;

// replace the old chunk with newHeader
let startRemoval = code.indexOf('<header className="flex');
// Find the end by looking for: `</button>\n          </div>\n        )}`
let endRemoval = code.indexOf('          </div>\n        )}', startRemoval) + 29; // approximate 

if (startRemoval !== -1) {
    code = code.substring(0, startRemoval) + newHeader + code.substring(endRemoval);
}

fs.writeFileSync('src/App.tsx', code);
console.log('Finished safe rewrite of step 1/2.');
