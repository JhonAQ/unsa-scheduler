const fs = require("fs");
let code = fs.readFileSync("src/App.tsx", "utf-8");

const regex =
  /function CalendarGrid\(\{[\s\S]*?className=\{cn\(\s*"absolute p-2 border-2 border-black overflow-hidden[\s\S]*?style=\{\{/s;

const newCalendarStart = `const CELL_HEIGHT = 44; // Reduced height to look like Google Calendar

function CalendarGrid({
  combo,
}: {
  combo: ScheduleCombination;
  coursesMap?: Course[];
}) {
  const courseColors = useMemo(() => {
    const map: Record<string, string> = {};
    Object.keys(combo.selection).forEach((cName, idx) => {
      map[cName] = COLORS[idx % COLORS.length];
    });
    return map;
  }, [combo]);

  const sessions = useMemo(() => {
    const all = [];
    for (const [curso, sel] of Object.entries(combo.selection)) {
      if (sel.teoria) {
        for (const sesion of sel.teoria.sesiones) {
          all.push({ curso, seccion: \`Teo \${sel.teoria.seccion}\`, ...sesion });
        }
      }
      if (sel.laboratorio) {
        for (const sesion of sel.laboratorio.sesiones) {
          all.push({
            curso,
            seccion: \`Lab \${sel.laboratorio.seccion}\`,
            ...sesion,
          });
        }
      }
    }
    return all;
  }, [combo]);

  // Compute dynamic start and end hour
  const { startHour, endHour } = useMemo(() => {
    let minT = 24 * 60;
    let maxT = 0;
    if (sessions.length === 0) return { startHour: 7, endHour: 20 };
    for (const s of sessions) {
      const st = parseTimeStr(s.hora_inicio);
      const et = parseTimeStr(s.hora_fin);
      if (st < minT) minT = st;
      if (et > maxT) maxT = et;
    }
    let sH = Math.floor(minT / 60) - 1; // 1 hour buffer top
    let eH = Math.ceil(maxT / 60); // buffer bottom implicitly
    if (sH < 7) sH = 7;
    if (eH > 22) eH = 22;
    if (eH <= sH) eH = sH + 1;
    return { startHour: sH, endHour: eH };
  }, [sessions]);

  return (
    <div className="min-w-[800px] border-l-2 border-t-2 border-black font-mono relative">
      <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] bg-gray-100 font-bold text-center">
        <div className="border-r-2 border-b-2 border-black p-2 bg-black text-[#FFEA00]">
          HORA
        </div>
        {DAYS.map((d) => (
          <div
            key={d}
            className="border-r-2 border-b-2 border-black p-2 uppercase"
          >
            {d}
          </div>
        ))}
      </div>

      <div
        className="relative border-b-2 border-black opacity-90 bg-white bg-[linear-gradient(_transparent_99%,_#eaeaea_100%_)]"
        style={{
          height: \`\${(endHour - startHour + 1) * CELL_HEIGHT}px\`,
          backgroundSize: \`100% \${CELL_HEIGHT}px\`
        }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-[80px] border-r-2 border-black bg-white/50 backdrop-blur-sm z-10 flex flex-col pointer-events-none">
          {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
            <div
              key={i}
              style={{ height: \`\${CELL_HEIGHT}px\` }}
              className="border-b-2 border-gray-200 text-xs font-bold text-center pt-1.5 text-gray-500"
            >
              {String(startHour + i).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        <div className="absolute left-[80px] right-0 top-0 bottom-0">
          <AnimatePresence>
            {sessions.map((s, i) => {
              const dayIdx = DAYS.findIndex(
                (d) => d.toLowerCase() === s.dia.toLowerCase(),
              );
              if (dayIdx === -1) return null;

              const startT = parseTimeStr(s.hora_inicio);
              const endT = parseTimeStr(s.hora_fin);

              const durationHours = (endT - startT) / 60;
              const offsetHours = (startT - startHour * 60) / 60;

              const top = offsetHours * CELL_HEIGHT;
              const height = durationHours * CELL_HEIGHT;
              const width = 100 / DAYS.length;
              const left = width * dayIdx;

              const bgColor = courseColors[s.curso] || "bg-gray-800";

              return (
                <motion.div
                  key={\`\${s.curso}-\${s.dia}-\${s.hora_inicio}-\${i}\`}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  className={cn(
                    "absolute p-1.5 md:p-2 border-2 border-black overflow-hidden hover:z-20 transition-transform hover:-translate-y-1 shadow-[2px_2px_0px_#111]",
                    bgColor,
                    "text-black",
                  )}
                  style={{`;

code = code.replace(regex, newCalendarStart);
fs.writeFileSync("src/App.tsx", code);
console.log("Finished updating CalendarGrid!");
