import type { Course, ScheduleCombination } from "../lib/types";
import initialData from "../../data/schedule.json";

export const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

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

export function getInitialCourses(): Course[] {
  if (!initialData || !(initialData as any).horario_academico) return [];
  return (initialData as any).horario_academico.map((c: any) => {
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
          tipoLower.includes("pr\u00c3\u00a1ctica")
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

export function getScheduleMetrics(combo: ScheduleCombination) {
  const daysMap: Record<string, { start: number; end: number }[]> = {
    Lunes: [],
    Martes: [],
    Miércoles: [],
    Jueves: [],
    Viernes: [],
  };

  for (const course of Object.values(combo.selection)) {
    if (course.teoria) {
      for (const s of course.teoria.sesiones) {
        if (daysMap[s.dia])
          daysMap[s.dia].push({
            start: parseTimeStr(s.hora_inicio),
            end: parseTimeStr(s.hora_fin),
          });
      }
    }
    if (course.laboratorio) {
      for (const s of course.laboratorio.sesiones) {
        if (daysMap[s.dia])
          daysMap[s.dia].push({
            start: parseTimeStr(s.hora_inicio),
            end: parseTimeStr(s.hora_fin),
          });
      }
    }
  }

  let freeDays: string[] = [];
  let totalGapsMinutes = 0;
  let earliestStart = 24 * 60;
  let latestEnd = 0;

  for (const [day, sessions] of Object.entries(daysMap)) {
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
  if (s1.dia.trim().toLowerCase() !== s2.dia.trim().toLowerCase()) return false;
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
