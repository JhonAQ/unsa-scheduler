import { type Course, type ScheduleCombination, type Seccion, type Session } from "./types";

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.trim().split(":").map(Number);
  return h * 60 + m;
}

function sessionsConflict(s1: Session, s2: Session): boolean {
  if (s1.dia.trim().toLowerCase() !== s2.dia.trim().toLowerCase()) return false;
  
  const start1 = timeToMinutes(s1.hora_inicio);
  const end1 = timeToMinutes(s1.hora_fin);
  const start2 = timeToMinutes(s2.hora_inicio);
  const end2 = timeToMinutes(s2.hora_fin);

  // Consider it a conflict if they overlap strictly
  return start1 < end2 && start2 < end1;
}

function doesSectionConflict(
  section: Seccion,
  currentSelection: Record<string, Seccion>
): boolean {
  const allCurrentSessions = Object.values(currentSelection).flatMap(sec => sec.sesiones);
  
  for (const newSession of section.sesiones) {
    for (const existingSession of allCurrentSessions) {
      if (sessionsConflict(newSession, existingSession)) {
        return true;
      }
    }
  }
  return false;
}

export function generateSchedules(courses: Course[]): ScheduleCombination[] {
  if (courses.length === 0) return [];
  
  const results: ScheduleCombination[] = [];

  function backtrack(index: number, currentSelection: Record<string, Seccion>) {
    if (index === courses.length) {
      const id = Object.values(currentSelection)
        .map(sec => sec.seccion)
        .join("-");
      results.push({
        id,
        selection: { ...currentSelection }, // clone
      });
      return;
    }

    const currentCourse = courses[index];

    for (const section of currentCourse.secciones) {
      if (!doesSectionConflict(section, currentSelection)) {
        currentSelection[currentCourse.curso] = section;
        backtrack(index + 1, currentSelection);
        delete currentSelection[currentCourse.curso]; // Backtrack
      }
    }
  }

  backtrack(0, {});
  return results;
}
