const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add getScheduleMetrics right above checkSessionOverlap
const getMetricsFunc = `
function getScheduleMetrics(combo: ScheduleCombination) {
  const daysMap: Record<string, {start: number, end: number}[]> = {
    "Lunes": [], "Martes": [], "Miércoles": [], "Jueves": [], "Viernes": []
  };

  for (const course of Object.values(combo.selection)) {
    if (course.teoria) {
      for (const s of course.teoria.sesiones) {
         if (daysMap[s.dia]) daysMap[s.dia].push({start: parseTimeStr(s.hora_inicio), end: parseTimeStr(s.hora_fin)});
      }
    }
    if (course.laboratorio) {
      for (const s of course.laboratorio.sesiones) {
         if (daysMap[s.dia]) daysMap[s.dia].push({start: parseTimeStr(s.hora_inicio), end: parseTimeStr(s.hora_fin)});
      }
    }
  }

  let freeDaysCount = 0;
  let totalGapsMinutes = 0;
  let hasEarlyClasses = false;
  let hasLateClasses = false;

  for (const [day, sessions] of Object.entries(daysMap)) {
    if (sessions.length === 0) {
      freeDaysCount++;
      continue;
    }

    sessions.sort((a, b) => a.start - b.start);

    if (sessions[0].start < 8 * 60) {
      hasEarlyClasses = true;
    }

    if (sessions[sessions.length - 1].end > 19 * 60) {
      hasLateClasses = true;
    }

    for (let i = 1; i < sessions.length; i++) {
      const gap = sessions[i].start - sessions[i-1].end;
      if (gap > 0) {
        totalGapsMinutes += gap;
      }
    }
  }

  return { freeDaysCount, totalGapsMinutes, hasEarlyClasses, hasLateClasses };
}
`;

content = content.replace('function checkSessionOverlap(', getMetricsFunc + '\nfunction checkSessionOverlap(');

// 2. Add state inside App()
const stateBlock = `  const [viewMode, setViewMode] = useState<"generator" | "all_schedules">("generator");

  const [sortBy, setSortBy] = useState<"default" | "compact" | "free_days">("default");
  const [filterFreeDays, setFilterFreeDays] = useState(false);
  const [filterNoEarly, setFilterNoEarly] = useState(false);
  const [filterNoLate, setFilterNoLate] = useState(false);

  // Restart combo idx when filters change
  React.useEffect(() => {
    setCurrentComboIdx(0);
  }, [sortBy, filterFreeDays, filterNoEarly, filterNoLate]);`;

content = content.replace(/const \[viewMode[\s\S]*?useState<[\s\S]*?>\([\s\S]*?\);/, stateBlock);

// 3. Process combinations
const processBlock = `const combinations = useMemo(() => {
    return generateSchedules(activeCourses);
  }, [activeCourses]);

  const processedCombinations = useMemo(() => {
    let processed = combinations.map(combo => ({
       combo,
       metrics: getScheduleMetrics(combo)
    }));

    if (filterFreeDays) {
       processed = processed.filter(p => p.metrics.freeDaysCount > 0);
    }
    if (filterNoEarly) {
       processed = processed.filter(p => !p.metrics.hasEarlyClasses);
    }
    if (filterNoLate) {
       processed = processed.filter(p => !p.metrics.hasLateClasses);
    }

    if (sortBy === "compact") {
       processed.sort((a, b) => a.metrics.totalGapsMinutes - b.metrics.totalGapsMinutes);
    } else if (sortBy === "free_days") {
       processed.sort((a, b) => b.metrics.freeDaysCount - a.metrics.freeDaysCount);
    }

    return processed.map(p => p.combo);
  }, [combinations, sortBy, filterFreeDays, filterNoEarly, filterNoLate]);

  const activeCombo = processedCombinations[currentComboIdx];`;

content = content.replace(/const combinations = useMemo\(\(\) => \{[\s\S]*?const activeCombo = combinations\[currentComboIdx\];/, processBlock);

// 4. Update combinations.length -> processedCombinations.length inside the App TSX specific scope.
content = content.replace(/combinations\.length/g, 'processedCombinations.length');
// Also fix a potential bug if we replaced the map one that shouldn't be touched. There's none.

// 5. Add Filters UI
const filtersUI = `
            <div className="bg-[#FF9100] border-4 border-black p-6 neo-brutalist shadow-[4px_4px_0px_#111]">
              <h2 className="text-2xl font-black uppercase mb-4 text-black bg-white inline-block px-2 border-2 border-black -rotate-2">Ajustes</h2>
              
              <div className="space-y-4 font-mono font-bold text-sm">
                <div>
                  <label className="block text-black uppercase mb-1">Ordenar por:</label>
                  <select 
                    value={sortBy} 
                    onChange={e => setSortBy(e.target.value as any)}
                    className="w-full p-2 border-2 border-black bg-white appearance-none outline-none focus:ring-0 shadow-[2px_2px_0px_#111] cursor-pointer"
                  >
                    <option value="default">Por defecto</option>
                    <option value="compact">Menos horas hueco</option>
                    <option value="free_days">Más días libres</option>
                  </select>
                </div>

                <div className="space-y-3 pt-4 border-t-4 border-black border-dotted">
                  <span className="block text-black uppercase mb-2">Filtros:</span>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={filterFreeDays}
                      onChange={e => setFilterFreeDays(e.target.checked)}
                      className="w-5 h-5 border-2 border-black appearance-none checked:bg-black checked:before:content-['✓'] checked:before:text-white checked:before:flex checked:before:items-center checked:before:justify-center transition-transform hover:-translate-y-0.5" 
                    />
                    <span className="text-sm">Exigir día libre</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={filterNoEarly}
                      onChange={e => setFilterNoEarly(e.target.checked)}
                      className="w-5 h-5 border-2 border-black appearance-none checked:bg-black checked:before:content-['✓'] checked:before:text-white checked:before:flex checked:before:items-center checked:before:justify-center transition-transform hover:-translate-y-0.5" 
                    />
                    <span className="text-sm">Sin clases a las 7 AM</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={filterNoLate}
                      onChange={e => setFilterNoLate(e.target.checked)}
                      className="w-5 h-5 border-2 border-black appearance-none checked:bg-black checked:before:content-['✓'] checked:before:text-white checked:before:flex checked:before:items-center checked:before:justify-center transition-transform hover:-translate-y-0.5" 
                    />
                    <span className="text-sm">Sin clases de noche</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-[#2979FF] text-white neo-brutalist p-6 flex flex-col gap-2">`;

// Targeting the State panel opening
content = content.replace('<div className="bg-[#2979FF] text-white neo-brutalist p-6 flex flex-col gap-2">', filtersUI);

fs.writeFileSync('src/App.tsx', content);
console.log('App updated with filters!');
