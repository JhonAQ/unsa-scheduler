const fs = require("fs");
let code = fs.readFileSync("src/App.tsx", "utf-8");

const regexToReplace =
  /<div\s*className="relative border-b-2 border-black bg-\[\#fafafa\]"[\s\S]*?<\/AnimatePresence>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\;\s*\}/;

const replacement = `<div
        className="relative border-b-2 border-black bg-white bg-[linear-gradient(_transparent_99%,_#eaeaea_100%_)] bg-[length:100%_60px]"
        style={{ height: \`\${(endHour - startHour + 1) * 60}px\` }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-[80px] border-r-2 border-black bg-white/50 backdrop-blur-sm z-10 flex flex-col pointer-events-none">
          {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
            <div
              key={i}
              className="h-[60px] border-b-2 border-gray-200 text-xs font-bold text-center pt-2 text-gray-800"
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

              const duration = endT - startT;
              const offsetFromStartDay = startT - startHour * 60;

              const styleTop = offsetFromStartDay;
              const styleHeight = duration;
              const styleWidth = 100 / DAYS.length;
              const styleLeft = styleWidth * dayIdx;
              
              const bgColor = courseColors[s.curso] || "bg-gray-800";

              let prefix = s.seccion.includes("Teo") ? "TEO" : "LAB";
              let secClean = s.seccion.replace(/Teo |Lab /, "");

              return (
                <motion.div
                  key={\`\${s.curso}-\${s.dia}-\${s.hora_inicio}-\${i}\`}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  className={cn(
                    "absolute p-2 border-2 border-black overflow-hidden hover:z-50 cursor-pointer transition-all shadow-[2px_2px_0px_#111] text-black flex flex-col justify-start",
                    bgColor,
                    "opacity-90 hover:scale-[1.02]"
                  )}
                  style={{
                    top: \`\${styleTop}px\`,
                    height: \`\${styleHeight}px\`,
                    width: \`calc(\${styleWidth}% - 10px)\`,
                    left: \`calc(\${styleLeft}% + 5px)\`,
                  }}
                  title={\`\${s.curso} | \${prefix} \${secClean} (\${s.tipo}) | \${s.hora_inicio} - \${s.hora_fin}\`}
                >
                  <p className="font-bold text-[10px] sm:text-xs uppercase truncate w-full pb-1 mb-1 border-b border-black/20 leading-tight">
                    {s.curso}
                  </p>
                  <p className="text-[10px] font-sans font-black bg-black text-white px-1 inline-block mt-0.5 self-start">
                    {prefix} {secClean}
                  </p>
                  <p className="text-[10px] mt-0.5 font-bold truncate">
                    {s.tipo || "Presencial"}
                  </p>
                  <p className="text-[10px] mt-0.5 font-bold">
                    {s.hora_inicio} - {s.hora_fin}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}`;

code = code.replace(regexToReplace, replacement);
fs.writeFileSync("src/App.tsx", code);
