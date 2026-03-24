const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Remove Max Huecos block from the UI layout
const maxHuecosRegex = /\{\/\* Max Huecos \*\/\}.*?\{\/\* Rango Horario \*\/\}/s;
code = code.replace(maxHuecosRegex, '{/* Rango Horario */}');

// And adjust the grid columns for Rango Horario
code = code.replace(
  /<div className="space-y-2 col-span-2">\s*<label className="block text-black font-black uppercase text-xs leading-tight">\s*Rango Horario/,
  '<div className="space-y-2 col-span-2 2xl:col-span-1">\n                      <label className="block text-black font-black uppercase text-xs leading-tight">\n                        Rango Horario'
);

// 2. Change the CalendarGrid to use unique times instead of hourly ticks
const uniqueTimesInjection = `const { startHour, endHour, uniqueTimes } = useMemo(() => {
    let minT = 24 * 60;
    let maxT = 0;
    const times = new Set<string>();

    if (sessions.length === 0) return { startHour: 7, endHour: 20, uniqueTimes: [] };
    for (const s of sessions) {
      times.add(s.hora_inicio);
      times.add(s.hora_fin);
      const st = parseTimeStr(s.hora_inicio);
      const et = parseTimeStr(s.hora_fin);
      if (st < minT) minT = st;
      if (et > maxT) maxT = et;
    }
    let sH = Math.floor(minT / 60) - 1; 
    let eH = Math.ceil(maxT / 60); 
    if (sH < 7) sH = 7;
    if (eH > 22) eH = 22;
    if (eH <= sH) eH = sH + 1;

    const sortedTimes = Array.from(times).sort((a,b) => parseTimeStr(a) - parseTimeStr(b));

    return { startHour: sH, endHour: eH, uniqueTimes: sortedTimes };
  }, [sessions]);`;

// replace up to the return statement
code = code.replace(/const \{ startHour, endHour \} = useMemo\(\(\) => \{[\s\S]*?\}, \[sessions\]\);/, uniqueTimesInjection);

// 3. Render the calendar grid lines and custom times
const bgGridRegex = /<div\s*className="relative border-b-2 border-black opacity-90 bg-white\s*bg-\[linear-gradient\(_transparent_99%,_#eaeaea_100%_\)\]"\s*style=\{\{[\s\S]*?\}\}\s*>\s*<div className="absolute left-0 top-0 bottom-0 w-\[80px\] border-r-2\s*border-black bg-white\/50 backdrop-blur-sm z-10 flex flex-col\s*pointer-events-none">\s*\{Array\.from\(\{ length: endHour - startHour \+ 1 \}\)\.map\(\(_, i\) => \(\s*<div\s*key=\{i\}\s*style=\{\{ height: `\$\{CELL_HEIGHT\}px` \}\}\s*className="border-b-2 border-gray-200 text-xs font-bold\s*text-center pt-1 text-gray-500"\s*>\s*\{String\(startHour \+ i\)\.padStart\(2, "0"\)\}:00\s*<\/div>\s*\)\)\}\s*<\/div>\s*<div className="absolute left-\[80px\] right-0 top-0 bottom-0">/s;

const customGrid = `<div
        className="relative border-b-2 border-black bg-[#fafafa]"
        style={{
          height: \`\${(endHour - startHour + 1) * CELL_HEIGHT}px\`
        }}
      >
        {/* Custom Exact Time Horizontal Lines */}
        {uniqueTimes.map(t => {
          const top = ((parseTimeStr(t) - startHour * 60) / 60) * CELL_HEIGHT;
          return <div key={"line-"+t} className="absolute left-[80px] right-0 border-b border-gray-300 border-dashed pointer-events-none" style={{ top: \`\${top}px\` }} />;
        })}

        <div className="absolute left-0 top-0 bottom-0 w-[80px] border-r-2 border-black bg-white/80 backdrop-blur-sm z-30 pointer-events-none">
          {uniqueTimes.map((t) => {
            const top = ((parseTimeStr(t) - startHour * 60) / 60) * CELL_HEIGHT;
            return (
              <div
                key={"label-"+t}
                style={{ top: \`\${top}px\` }}
                className="absolute left-0 w-full text-center text-[11px] font-black text-gray-600 -translate-y-1/2 bg-white/60 px-1"
              >
                {t}
              </div>
            );
          })}
        </div>

        <div className="absolute left-[80px] right-0 top-0 bottom-0">`;

code = code.replace(bgGridRegex, customGrid);

// 4. Update the card content
const oldCardRegex = /<p className="font-bold text-\[10px\] sm:text-xs uppercase\s*truncate">\s*\{s\.curso\}\s*<\/p>\s*<p className="text-\[10px\] font-sans font-black bg-black\s*text-white px-1 inline-block mt-0\.5">\s*SEC \{s\.seccion\}\s*<\/p>\s*<p className="text-\[10px\] mt-0\.5 truncate">\{s\.tipo\}<\/p>\s*<p className="text-\[10px\] mt-0\.5 font-bold">\s*\{s\.hora_inicio\} - \{s\.hora_fin\}\s*<\/p>/sg;

const newCardContent = `<p className="font-bold text-[10px] leading-tight sm:text-xs uppercase line-clamp-2">
                      {s.curso}
                    </p>
                    <p className="text-[10px] sm:text-[11px] font-sans font-black bg-black text-white px-1.5 inline-block mt-1 shadow-[1px_1px_0px_#fff] border border-black/20">
                      {s.seccion}
                    </p>`;

// fallback if formatting changes slightly
if (code.includes('SEC {s.seccion}')) {
   code = code.replace(oldCardRegex, newCardContent);
}

// 5. One more specific replace if the regex missed due to formatting
code = code.replace(/<p className="font-bold text-\[10px\] sm:text-xs uppercase truncate">\s*\{s\.curso\}\s*<\/p>[\s\S]*?<p className="text-\[10px\] mt-0\.5 font-bold">\s*\{s\.hora_inicio\} - \{s\.hora_fin\}\s*<\/p>/s, newCardContent);


fs.writeFileSync('src/App.tsx', code);
console.log('Modifications applied');
