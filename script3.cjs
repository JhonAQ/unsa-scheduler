const fs = require("fs");
let code = fs.readFileSync("src/App.tsx", "utf-8");

const sIdx = code.indexOf("<select\\n                    value={sortBy}");
// It's definitely better to just use standard regex or replace.

const target = `                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full xl:w-64 p-2 border-4 border-black bg-white appearance-none outline-none font-bold focus:ring-0 shadow-[4px_4px_0px_#111] cursor-pointer"
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
                    <label className="block text-black font-black uppercase text-sm">
                      Exigir Día Libre
                    </label>
                    <div className="flex gap-2">
                      {[
                        "Lunes",
                        "Martes",
                        "Miércoles",
                        "Jueves",
                        "Viernes",
                      ].map((d) => (
                        <button
                          key={d}
                          onClick={() => toggleWantedFreeDay(d)}
                          className={cn(
                            "p-2 border-2 border-black font-bold uppercase transition-transform w-[40px] text-center",
                            wantedFreeDays.includes(d)
                              ? "bg-black text-white shadow-[2px_2px_0px_#111] translate-y-0.5"
                              : "bg-white hover:bg-gray-100 shadow-[2px_2px_0px_#111]",
                          )}
                          title={"Exigir " + d + " libre"}
                        >
                          {d.charAt(0)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-black font-black uppercase text-sm">
                      Rango Horario Permitido
                    </label>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold w-12">Desde</span>
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
                            const [h, m] = e.target.value
                              .split(":")
                              .map(Number);
                            setMinTime(h * 60 + m);
                          }}
                          className="border-2 border-black px-2 py-1 flex-1 bg-white font-bold outline-none font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold w-12">Hasta</span>
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
                            const [h, m] = e.target.value
                              .split(":")
                              .map(Number);
                            setMaxTime(h * 60 + m);
                          }}
                          className="border-2 border-black px-2 py-1 flex-1 bg-white font-bold outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-black font-black uppercase text-sm">
                      Max Horas (Huecos/Semana)
                    </label>
                    <div className="flex items-center gap-4 h-full pb-3">
                      <input
                        type="range"
                        min="0"
                        max="720"
                        step="60"
                        value={maxTotalGaps}
                        onChange={(e) =>
                          setMaxTotalGaps(Number(e.target.value))
                        }
                        className="w-full accent-black cursor-pointer"
                      />
                      <span className="font-extrabold text-black w-14 text-right">
                        {maxTotalGaps >= 720
                          ? "Libre"
                          : (maxTotalGaps / 60).toFixed(0) + "h"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {processedCombinations.length === 0 ? (
              <div className="bg-white neo-brutalist p-12 text-center">
                <h2 className="text-4xl text-gray-300 font-bold uppercase mb-4">
                  Cruces o Sin Opciones
                </h2>
                <p className="font-mono text-gray-500">
                  Relaja las restricciones o selecciona más secciones.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-center justify-between bg-white neo-brutalist p-4 gap-4">`;

const replacement = `                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full p-1.5 text-sm border-2 border-black bg-white appearance-none outline-none font-bold focus:ring-0 shadow-[2px_2px_0px_#111] cursor-pointer"
                  >
                    <option value="default">Por defecto</option>
                    <option value="compact">Compacto</option>
                    <option value="free_days">Dias Libres</option>
                    <option value="start_late">Tardes</option>
                    <option value="end_early">Mañanas</option>
                  </select>
                </div>

                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-black font-black uppercase text-[10px] leading-tight">
                      Día Libre
                    </label>
                    <div className="flex gap-1.5">
                      {[
                        "Lunes",
                        "Martes",
                        "Miércoles",
                        "Jueves",
                        "Viernes",
                      ].map((d) => (
                        <button
                          key={d}
                          onClick={() => toggleWantedFreeDay(d)}
                          className={cn(
                            "p-1 border-2 border-black font-bold uppercase transition-transform w-8 text-xs text-center",
                            wantedFreeDays.includes(d)
                              ? "bg-black text-white shadow-[2px_2px_0px_#111] translate-y-0.5"
                              : "bg-white hover:bg-gray-100 shadow-[2px_2px_0px_#111]",
                          )}
                          title={"Exigir " + d + " libre"}
                        >
                          {d.charAt(0)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-black font-black uppercase text-[10px] leading-tight">
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
                            const [h, m] = e.target.value
                              .split(":")
                              .map(Number);
                            setMinTime(h * 60 + m);
                          }}
                          className="border-2 border-black px-1 py-0.5 w-full bg-white font-bold outline-none font-mono text-xs"
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
                            const [h, m] = e.target.value
                              .split(":")
                              .map(Number);
                            setMaxTime(h * 60 + m);
                          }}
                          className="border-2 border-black px-1 py-0.5 w-full bg-white font-bold outline-none font-mono text-xs"
                        />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-black font-black uppercase text-[10px] leading-tight">
                      Max Huecos
                    </label>
                    <div className="flex items-center gap-2 h-[26px]">
                      <input
                        type="range"
                        min="0"
                        max="720"
                        step="60"
                        value={maxTotalGaps}
                        onChange={(e) =>
                          setMaxTotalGaps(Number(e.target.value))
                        }
                        className="w-full accent-black cursor-pointer"
                      />
                      <span className="font-bold text-black text-xs">
                        {maxTotalGaps >= 720
                          ? "Libre"
                          : (maxTotalGaps / 60).toFixed(0) + "h"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {processedCombinations.length === 0 ? (
              <div className="bg-white neo-brutalist p-12 text-center flex-1 min-h-0">
                <h2 className="text-3xl text-gray-300 font-bold uppercase mb-4">
                  Cruces o Sin Opciones
                </h2>
                <p className="font-mono text-gray-500">
                  Relaja las restricciones o selecciona más secciones.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-center justify-between bg-white border-4 border-black p-2 md:p-3 gap-3 shrink-0 shadow-[4px_4px_0px_#111]">`;

code = code.replace(target, replacement);
fs.writeFileSync("src/App.tsx", code);
console.log("Done script 3");
