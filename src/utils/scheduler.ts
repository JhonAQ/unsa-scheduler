import type { Course, ScheduleCombination } from "../lib/types";
import primeroData from "../../data/primero.json";
import segundoData from "../../data/segundo.json";
import terceroData from "../../data/tercero.json";
import cuartoData from "../../data/cuarto.json";
import quintoData from "../../data/quinto.json";

export const DAYS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];

export const COLORS = [
  "bg-[#FF3366]",
  "bg-[#00E676]",
  "bg-[#2979FF]",
  "bg-[#FF9100]",
  "bg-[#D500F9]",
  "bg-[#00E5FF]",
  "bg-[#1DE9B6]",
];

export function parseTimeStr(time: string) {
  const [h, m] = time.trim().split(":").map(Number);
  return h * 60 + m;
}

export function processCoursesData(data: any): Course[] {
  if (!data || !data.horario_academico) return [];
  return data.horario_academico.map((c: any) => {
    const teoriasMap: Record<string, any> = {};
    const laboratoriosMap: Record<string, any> = {};

    c.secciones.forEach((sec: any) => {
      sec.sesiones.forEach((ses: any) => {
        const tipoLower = ses.tipo.toLowerCase();
        if (
          tipoLower.includes("teoría") ||
          tipoLower.includes("teoria") ||
          tipoLower.includes("teor\u00c3\u00ada")
        ) {
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
          tipoLower.includes("pr\u00c3\u00a1ctica") ||
          tipoLower.includes("jefatura") // handling rare cases naturally
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

export function getAllYearsData() {
  return [
    { year: "Primer Año", courses: processCoursesData(primeroData) },
    { year: "Segundo Año", courses: processCoursesData(segundoData) },
    { year: "Tercer Año", courses: processCoursesData(terceroData) },
    { year: "Cuarto Año", courses: processCoursesData(cuartoData) },
    { year: "Quinto Año", courses: processCoursesData(quintoData) },
  ];
}

export function getAllCoursesFlat(): Course[] {
  const allYears = getAllYearsData();
  return allYears.flatMap((y) => y.courses);
}

// Retro-compatibility (for initial startup or if needed)
export function getInitialCourses(): Course[] {
  return getAllCoursesFlat();
}

export function getScheduleMetrics(combo: ScheduleCombination) {
  // It's possible original data used MiÃ©rcoles, lets just fallback
  const fallbackDaysMap: Record<string, { start: number; end: number }[]> = {
    "Lunes": [],
    "Martes": [],
    "Miercoles": [],
    "MiÃ©rcoles": [], // dirty map for bad data
    "Miercoles": [],
    "Jueves": [],
    "Viernes": [],
  };

  for (const course of Object.values(combo.selection)) {
    if (course.teoria) {
      for (const s of course.teoria.sesiones) {
        if (fallbackDaysMap[s.dia])
          fallbackDaysMap[s.dia].push({
            start: parseTimeStr(s.hora_inicio),
            end: parseTimeStr(s.hora_fin),
          });
      }
    }
    if (course.laboratorio) {
      for (const s of course.laboratorio.sesiones) {
        if (fallbackDaysMap[s.dia])
          fallbackDaysMap[s.dia].push({
            start: parseTimeStr(s.hora_inicio),
            end: parseTimeStr(s.hora_fin),
          });
      }
    }
  }

  // Merge variants
  const mergedDays = {
    Lunes: fallbackDaysMap["Lunes"],
    Martes: fallbackDaysMap["Martes"],
    Miercoles: [...fallbackDaysMap["Miercoles"], ...fallbackDaysMap["MiÃ©rcoles"], ...fallbackDaysMap["Miercoles"]],
    Jueves: fallbackDaysMap["Jueves"],
    Viernes: fallbackDaysMap["Viernes"],
  };

  let freeDays: string[] = [];
  let totalGapsMinutes = 0;
  let earliestStart = 24 * 60;
  let latestEnd = 0;

  for (const [day, sessions] of Object.entries(mergedDays)) {
    if (sessions.length === 0) {
      freeDays.push(day);
      continue;
    }

    sessions.sort((a, b) => a.start - b.start);

    if (sessions[0].start < earliestStart) {
      earliestStart = sessions[0].start;
    }

    if (sessions[sessions.length - 1].end > latestEnd) {
      latestEnd = sessions[sessions.length - 1].end;
    }

    for (let i = 1; i < sessions.length; i++) {
      const gap = sessions[i].start - sessions[i - 1].end;
      if (gap > 0) {
        totalGapsMinutes += gap;
      }
    }
  }

  if (earliestStart === 24 * 60) earliestStart = 0;

  return { freeDays, totalGapsMinutes, earliestStart, latestEnd };
}

export function checkSessionOverlap(s1: any, s2: any): boolean {
  // Normalize days
  const d1 = s1.dia.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const d2 = s2.dia.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // They might be written differently so normalize for comparison
  if (d1 !== d2 && s1.dia !== s2.dia) return false;

  const start1 = parseTimeStr(s1.hora_inicio);
  const end1 = parseTimeStr(s1.hora_fin);
  const start2 = parseTimeStr(s2.hora_inicio);
  const end2 = parseTimeStr(s2.hora_fin);
  return start1 < end2 && start2 < end1;
}

export function checkSectionOverlapWithinGrid(
  newSec: any,
  gridSessions: any[],
): boolean {
  for (const s of newSec.sesiones) {
    for (const gs of gridSessions) {
      if (checkSessionOverlap(s, gs)) return true;
    }
  }
  return false;
}
