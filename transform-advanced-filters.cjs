const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. the new metrics
const oldMetrics = /function getScheduleMetrics.*?return \{ freeDaysCount, totalGapsMinutes, hasEarlyClasses, hasLateClasses \};\n\s*\}/s;
const newMetrics = `function getScheduleMetrics(combo: ScheduleCombination) {
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
    
    if (sessions[0].start < earliestStart) earliestStart = sessions[0].start;
    if (sessions[sessions.length - 1].end > latestEnd) latestEnd = sessions[sessions.length - 1].end;

    for (let i = 1; i < sessions.length; i++) {
      const gap = sessions[i].start - sessions[i-1].end;
      if (gap > 0) totalGapsMinutes += gap;
    }
  }
  
  if (earliestStart === 24 * 60) earliestStart = 0;

  return { freeDays, totalGapsMinutes, earliestStart, latestEnd };
}`;

// 2. State
const oldState = /const \[sortBy, setSortBy\] = useState.*?\}\, \[sortBy, filterFreeDays, filterNoEarly, filterNoLate\]\);/s;
const newState = `const [sortBy, setSortBy] = useState<"default" | "compact" | "free_days" | "start_late" | "end_early">("default");
  
  const [wantedFreeDays, setWantedFreeDays] = useState<string[]>([]);
  const [minTime, setMinTime] = useState<number>(7 * 60); // 7:00
  const [maxTime, setMaxTime] = useState<number>(20 * 60 + 10); // 20:10
  const [maxTotalGaps, setMaxTotalGaps] = useState<number>(12 * 60); // Max hours empty

  React.useEffect(() => {
    setCurrentComboIdx(0);
  }, [sortBy, wantedFreeDays, minTime, maxTime, maxTotalGaps]);

  const toggleWantedFreeDay = (day: string) => {
    setWantedFreeDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };`;

// 3. processing logic
const oldProcess = /const processedCombinations = useMemo\(\(\) => \{[\s\S]*?\n\s*const activeCombo = processedCombinations\[currentComboIdx\];/s;
const newProcess = `const processedCombinations = useMemo(() => {
    let processed = combinations.map(combo => ({
       combo,
       metrics: getScheduleMetrics(combo)
    }));

    if (wantedFreeDays.length > 0) {
      processed = processed.filter(p => wantedFreeDays.every(d => p.metrics.freeDays.includes(d)));
    }
    
    if (minTime > 7 * 60) {
      processed = processed.filter(p => p.metrics.earliestStart >= minTime);
    }
    
    if (maxTime < 21 * 60) {
      processed = processed.filter(p => p.metrics.latestEnd <= maxTime);
    }

    if (maxTotalGaps < 12 * 60) {
      processed = processed.filter(p => p.metrics.totalGapsMinutes <= maxTotalGaps);
    }

    if (sortBy === "compact") {
       processed.sort((a, b) => a.metrics.totalGapsMinutes - b.metrics.totalGapsMinutes);
    } else if (sortBy === "free_days") {
       processed.sort((a, b) => b.metrics.freeDays.length - a.metrics.freeDays.length);
    } else if (sortBy === "start_late") {
       processed.sort((a, b) => b.metrics.earliestStart - a.metrics.earliestStart);
    } else if (sortBy === "end_early") {
       processed.sort((a, b) => a.metrics.latestEnd - b.metrics.latestEnd);
    }

    return processed.map(p => p.combo);
  }, [combinations, sortBy, wantedFreeDays, minTime, maxTime, maxTotalGaps]);

  const activeCombo = processedCombinations[currentComboIdx];`;

// 4. Remove UI from aside (Search the div chunk that opens bg-[#FF9100])
const oldAsideUI = /<div className="bg-\[\#FF9100\].*?<\/div>\s*<\/div>\s*<\/div>\s*<div className="bg-\[\#2979FF\]/s;
const newAsideUI = `<div className="bg-[#2979FF]`;

// 5. Inject new settings bar to the right section
const sectionTopMatch = /<section className="lg:col-span-3 space-y-6 min-w-0 overflow-hidden">/s;
const newSettingsBar = `<section className="lg:col-span-3 space-y-6 min-w-0 overflow-hidden">
<div className="bg-[#FF9100] border-4 border-black p-4 md:p-6 neo-brutalist shadow-[4px_4px_0px_#111] font-mono mb-6">
  <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">
    
    <div className="space-y-2 flex-shrink-0">
      <label className="block text-black font-black uppercase text-sm">Ordenar Resultados</label>
      <select 
        value={sortBy} 
        onChange={e => setSortBy(e.target.value as any)}
        className="w-full md:w-64 p-2 border-4 border-black bg-white appearance-none outline-none font-bold focus:ring-0 shadow-[4px_4px_0px_#111] cursor-pointer"
      >
        <option value="default">Por defecto</option>
        <option value="compact">Menos hrs hueco (Compacto)</option>
        <option value="free_days">Más días libres</option>
        <option value="start_late">Empezar más tarde</option>
        <option value="end_early">Terminar más temprano</option>
      </select>
    </div>

    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="space-y-2">
        <label className="block text-black font-black uppercase text-sm">Exigir Día Libre</label>
        <div className="flex gap-2">
          {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(d => (
            <button
              key={d}
              onClick={() => toggleWantedFreeDay(d)}
              className={"p-2 border-2 border-black font-bold uppercase transition-transform w-[40px] text-center " + (wantedFreeDays.includes(d) ? "bg-black text-white shadow-[2px_2px_0px_#111] translate-y-0.5" : "bg-white hover:bg-gray-100 shadow-[2px_2px_0px_#111]")}
              title={"Exigir " + d + " libre"}
            >
              {d.charAt(0)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-black font-black uppercase text-sm">Rango Horario Permitido</label>
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-2">
             <span className="text-xs font-bold w-12">Desde</span>
             <input type="time" min="07:00" max="19:00" step="1800"
               value={String(Math.floor(minTime/60)).padStart(2,'0') + ":" + String(minTime%60).padStart(2,'0')}
               onChange={(e) => { const [h,m] = e.target.value.split(':').map(Number); setMinTime(h*60+m); }}
               className="border-2 border-black px-2 py-1 flex-1 bg-white font-bold outline-none font-mono"
             />
           </div>
           <div className="flex items-center gap-2">
             <span className="text-xs font-bold w-12">Hasta</span>
             <input type="time" min="08:00" max="20:10" step="1800"
               value={String(Math.floor(maxTime/60)).padStart(2,'0') + ":" + String(maxTime%60).padStart(2,'0')}
               onChange={(e) => { const [h,m] = e.target.value.split(':').map(Number); setMaxTime(h*60+m); }}
               className="border-2 border-black px-2 py-1 flex-1 bg-white font-bold outline-none font-mono"
             />
           </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-black font-black uppercase text-sm">Max Horas (Huecos/Semana)</label>
        <div className="flex items-center gap-4 h-full pb-3">
          <input 
            type="range" min="0" max="720" step="60" 
            value={maxTotalGaps} 
            onChange={e => setMaxTotalGaps(Number(e.target.value))} 
            className="w-full accent-black cursor-pointer" 
          />
          <span className="font-extrabold text-black w-14 text-right">
            {maxTotalGaps >= 720 ? "Libre" : (maxTotalGaps / 60).toFixed(0) + "h"}
          </span>
        </div>
      </div>
    </div>
  </div>
</div>`;

content = content.replace(oldMetrics, newMetrics);
content = content.replace(oldState, newState);
content = content.replace(oldProcess, newProcess);
content = content.replace(oldAsideUI, newAsideUI);
content = content.replace(sectionTopMatch, newSettingsBar);

fs.writeFileSync('src/App.tsx', content);
console.log('App updated with advanced filters layout!');