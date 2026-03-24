const fs = require("fs");
let code = fs.readFileSync("src/App.tsx", "utf-8");

const regexFilters =
  /<div className="bg-\[\#FF9100\] border-4 border-black p-3 md:p-4\s*neo-brutalist shadow-\[4px_4px_0px_\#111\] font-mono shrink-0">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div className="bg-white border-4 border-black/s;

const newFilters = `<div className="bg-[#FF9100] border-4 border-black p-3 md:p-4 neo-brutalist shadow-[4px_4px_0px_#111] font-mono shrink-0">
                <div className="flex flex-col gap-4">
                  {/* Select Ordenar */}
                  <div className="space-y-2 w-full">
                    <label className="block text-black font-black uppercase text-xs leading-tight">
                      Ordenar
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full p-2 text-xs border-2 border-black bg-white appearance-none outline-none font-bold focus:ring-0 shadow-[2px_2px_0px_#111] cursor-pointer"
                    >
                      <option value="default">Por defecto</option>
                      <option value="compact">Compacto</option>
                      <option value="free_days">Días Libres</option>
                      <option value="start_late">Tardes</option>
                      <option value="end_early">Mañanas</option>
                    </select>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-4">
                    {/* Días Libres */}
                    <div className="space-y-2 col-span-2 2xl:col-span-1">
                      <label className="block text-black font-black uppercase text-xs leading-tight">
                        Día Libre
                      </label>
                      <div className="flex gap-1.5 justify-start">
                        {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map((d) => (
                          <button
                            key={d}
                            onClick={() => toggleWantedFreeDay(d)}
                            className={cn(
                              "p-1 border-2 border-black font-bold uppercase transition-transform flex-1 text-xs text-center max-w-[32px]",
                              wantedFreeDays.includes(d)
                                ? "bg-black text-white shadow-[2px_2px_0px_#111] translate-y-0.5"
                                : "bg-white hover:bg-gray-100 shadow-[2px_2px_0px_#111]"
                            )}
                            title={"Exigir " + d + " libre"}
                          >
                            {d.charAt(0)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Max Huecos */}
                    <div className="space-y-2 col-span-2 2xl:col-span-1">
                      <label className="block text-black font-black uppercase text-xs leading-tight whitespace-nowrap">
                        Max Huecos (
                        <span className="text-black font-extrabold">
                          {maxTotalGaps >= 720
                            ? "Libre"
                            : (maxTotalGaps / 60).toFixed(0) + "h"}
                        </span>
                        )
                      </label>
                      <div className="flex items-center gap-2 h-[28px]">
                        <input
                          type="range"
                          min="0"
                          max="720"
                          step="60"
                          value={maxTotalGaps}
                          onChange={(e) => setMaxTotalGaps(Number(e.target.value))}
                          className="w-full accent-black cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Rango Horario */}
                    <div className="space-y-2 col-span-2">
                      <label className="block text-black font-black uppercase text-xs leading-tight">
                        Rango Horario
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          min="07:00"
                          max="21:00"
                          step="1800"
                          value={
                            String(Math.floor(minTime / 60)).padStart(2, "0") +
                            ":" +
                            String(minTime % 60).padStart(2, "0")
                          }
                          onChange={(e) => {
                            const [h, m] = e.target.value.split(":").map(Number);
                            setMinTime(h * 60 + m);
                          }}
                          className="border-2 border-black px-1.5 py-1 flex-1 bg-white font-bold outline-none font-mono text-xs"
                        />
                        <span className="font-black text-xs">-</span>
                        <input
                          type="time"
                          min="07:00"
                          max="21:00"
                          step="1800"
                          value={
                            String(Math.floor(maxTime / 60)).padStart(2, "0") +
                            ":" +
                            String(maxTime % 60).padStart(2, "0")
                          }
                          onChange={(e) => {
                            const [h, m] = e.target.value.split(":").map(Number);
                            setMaxTime(h * 60 + m);
                          }}
                          className="border-2 border-black px-1.5 py-1 flex-1 bg-white font-bold outline-none font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white border-4 border-black`;

code = code.replace(regexFilters, newFilters);

fs.writeFileSync("src/App.tsx", code);
