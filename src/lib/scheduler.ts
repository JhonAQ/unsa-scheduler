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

export type GenerateSchedulesResult = {
  combinations: ScheduleCombination[];
  truncated: boolean;
};

type SelectionOption = {
  teoria?: Seccion;
  laboratorio?: Seccion;
};

function getValidOptions(
  course: Course,
  currentSelection: Record<string, CourseSelection>,
): SelectionOption[] {
  const teoriaOptions =
    course.teorias.length > 0 ? course.teorias : [undefined];
  const labOptions =
    course.laboratorios.length > 0 ? course.laboratorios : [undefined];

  const options: SelectionOption[] = [];
  for (const teoria of teoriaOptions) {
    if (teoria && doesSectionConflict(teoria, currentSelection)) continue;

    for (const lab of labOptions) {
      if (lab && doesSectionConflict(lab, currentSelection)) continue;

      if (teoria || lab) {
        options.push({
          ...(teoria ? { teoria } : {}),
          ...(lab ? { laboratorio: lab } : {}),
        });
      }
    }
  }
  return options;
}

function buildCombinationId(
  currentSelection: Record<string, CourseSelection>,
): string {
  const idStrParts = [];
  for (const courseName in currentSelection) {
    const sel = currentSelection[courseName];
    let p = "";
    if (sel.teoria) p += `T:${sel.teoria.seccion}`;
    if (sel.laboratorio) p += `L:${sel.laboratorio.seccion}`;
    idStrParts.push(p);
  }
  return idStrParts.join("-");
}

export function generateSchedules(
  courses: Course[],
  maxCombinations = 5000,
): GenerateSchedulesResult {
  if (courses.length === 0) return { combinations: [], truncated: false };

  const results: ScheduleCombination[] = [];
  let truncated = false;

  function backtrack(remaining: Course[]) {
    return function explore(
      currentSelection: Record<string, CourseSelection>,
    ) {
      if (results.length >= maxCombinations) {
        truncated = true;
        return;
      }

      if (remaining.length === 0) {
        results.push({
          id: buildCombinationId(currentSelection),
          selection: { ...currentSelection },
        });
        return;
      }

      // Dynamic MRV: pick the course with the fewest valid options first.
      let bestIdx = -1;
      let bestOptions: SelectionOption[] = [];
      let bestCount = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const options = getValidOptions(remaining[i], currentSelection);
        if (options.length < bestCount) {
          bestCount = options.length;
          bestOptions = options;
          bestIdx = i;
          if (options.length === 0) break; // dead end, no need to keep searching
        }
      }

      if (bestCount === 0) return;

      const [nextCourse] = remaining.splice(bestIdx, 1);

      for (const option of bestOptions) {
        currentSelection[nextCourse.curso] = option;
        backtrack(remaining)(currentSelection);
        delete currentSelection[nextCourse.curso];
      }

      remaining.splice(bestIdx, 0, nextCourse);
    };
  }

  backtrack([...courses])({});
  return { combinations: results, truncated };
}
