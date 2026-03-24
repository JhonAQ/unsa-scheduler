// Types for Unsa Scheduler
export type Session = {
  tipo: string;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
};

export type Seccion = {
  seccion: string;
  total_sesiones_semanales: number;
  sesiones: Session[];
};

export type Course = {
  curso: string;
  secciones: Seccion[]; // Still kept for raw import from JSON if needed
  teorias: Seccion[];
  laboratorios: Seccion[];
};

export type CourseSelection = {
  teoria?: Seccion;
  laboratorio?: Seccion;
};

export type TimetableFile = {
  horario_academico: Course[];
};

// Represents a generated schedule without conflicts
export type ScheduleCombination = {
  id: string; // unique ID
  selection: Record<string, CourseSelection>; // courseName -> Selection (Theory + Lab)
};
