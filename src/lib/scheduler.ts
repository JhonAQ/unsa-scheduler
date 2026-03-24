import { type Course, type ScheduleCombination, type Seccion, type Session, type CourseSelection } from "./types";

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
  currentSelection: Record<string, CourseSelection>
): boolean {
  const allCurrentSessions = Object.values(currentSelection).flatMap(sel => {
    const sessions = [];
    if (sel.teoria) sessions.push(...sel.teoria.sesiones);
    if (sel.laboratorio) sessions.push(...sel.laboratorio.sesiones);
    return sessions;
  });
  
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

  function backtrack(index: number, currentSelection: Record<string, CourseSelection>) {
    if (index === courses.length) {
      const idStrParts = [];
      for (const courseName in currentSelection) {
        const sel = currentSelection[courseName];
        let p = "";
        if (sel.teoria) p += `T:${sel.teoria.seccion}`;
        if (sel.laboratorio) p += `L:${sel.laboratorio.seccion}`;
        idStrParts.push(p);
      }
      const id = idStrParts.join("-");
      results.push({
        id,
        selection: { ...currentSelection }, // clone
      });
      return;
    }

    const currentCourse = courses[index];
    
    const teoriaOptions = currentCourse.teorias.length > 0 ? currentCourse.teorias : [undefined];
    const labOptions = currentCourse.laboratorios.length > 0 ? currentCourse.laboratorios : [undefined];

    for (const teoria of teoriaOptions) {
      if (teoria && doesSectionConflict(teoria, currentSelection)) continue;
      
      // Temporarily add theory
      if (teoria) {
        currentSelection[currentCourse.curso] = { teoria };
      }

      for (const lab of labOptions) {
        if (lab && doesSectionConflict(lab, currentSelection)) continue;
        
        if (teoria || lab) {
          currentSelection[currentCourse.curso] = {
            ...(teoria ? { teoria } : {}),
            ...(lab ? { laboratorio: lab } : {})
          };
        }

        backtrack(index + 1, currentSelection);
        
        // Backtrack
        if (teoria) {
          currentSelection[currentCourse.curso] = { teoria };
        } else {
          delete currentSelection[currentCourse.curso];
        }
      }
      
      // Backtrack theory
      delete currentSelection[currentCourse.curso];
    }
  }

  backtrack(0, {});
  return results;
}
