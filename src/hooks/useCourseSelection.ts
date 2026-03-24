import { useState, useMemo, useEffect } from "react";
import type { Course } from "../lib/types";

export function useCourseSelection(initialCourses: Course[]) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [excludedCourses, setExcludedCourses] = useState<Set<string>>(
    new Set()
  );
  const [excludedSections, setExcludedSections] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    setCourses(initialCourses);
  }, [initialCourses]);

  const toggleCourse = (curso: string, onFiltersChange?: () => void) => {
    setExcludedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(curso)) next.delete(curso);
      else next.add(curso);
      return next;
    });
    onFiltersChange?.();
  };

  const toggleSection = (curso: string, seccion: string, onFiltersChange?: () => void) => {
    const key = `${curso}-${seccion}`;
    setExcludedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    onFiltersChange?.();
  };

  const activeCourses = useMemo(() => {
    return courses
      .filter((c) => !excludedCourses.has(c.curso))
      .map((c) => ({
        ...c,
        teorias: c.teorias.filter(
          (s) => !excludedSections.has(`${c.curso}-teoria-${s.seccion}`)
        ),
        laboratorios: c.laboratorios.filter(
          (s) => !excludedSections.has(`${c.curso}-lab-${s.seccion}`)
        ),
      }))
      .filter((c) => c.teorias.length > 0 || c.laboratorios.length > 0);
  }, [courses, excludedCourses, excludedSections]);

  return {
    courses,
    activeCourses,
    excludedCourses,
    excludedSections,
    toggleCourse,
    toggleSection,
  };
}

