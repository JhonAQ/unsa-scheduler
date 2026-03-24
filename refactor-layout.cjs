const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add import
if (!code.includes('import initialData from')) {
    code = code.replace(
        'import type { Course, ScheduleCombination } from "./lib/types";',
        `import type { Course, ScheduleCombination } from "./lib/types";\nimport initialData from "../data/schedule.json";`
    );
}

// 2. Add normalization function 
const normalizationFn = `
function getInitialCourses(): Course[] {
  if (!initialData || !initialData.horario_academico) return [];
  return initialData.horario_academico.map((c: any) => {
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

// 3. Initialize state with initialCourses
code = code.replace(
    'const [courses, setCourses] = useState<Course[]>([]);',
    'const [courses, setCourses] = useState<Course[]>(getInitialCourses);'
);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx step 1 complete');
