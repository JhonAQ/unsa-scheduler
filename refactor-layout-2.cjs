const fs = require("fs");
let code = fs.readFileSync("src/App.tsx", "utf-8");

// 1. Remove `handleFileUpload` entirely
const handleUploadRegex =
  /const fileInputRef = useRef<HTMLInputElement>\(null\);\s*const handleFileUpload =.*?catch \(err\) \{\s*setError\("Error al leer el archivo JSON\."\);\s*\}\s*};\s*};/s;
code = code.replace(handleUploadRegex, "");

// 2. Rewrite the header, extracting tabs into the header and shrinking header size
// Note: We'll put the tabs right where the upload button used to be.
const headerBlockRegex =
  /<header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-\[\#111\] pb-4 gap-4 flex-shrink-0">.*?<\/header>\s*\{errorError && \(\s*<div className="bg-\[\#FF3366\].*?\{errorError\}\s*<\/div>\s*\)\}\s*\{courses\.length > 0 && \(\s*<div className="flex flex-wrap gap-4 font-mono font-bold text-lg flex-shrink-0">.*?<\/button>\s*<\/div>\s*\)\}/s;

const newHeaderBlock = `<header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-[#111] pb-2 gap-4 flex-shrink-0"> 
          <div>
            <h1 className="text-3xl tracking-tighter text-[#111] mb-1 leading-none uppercase">
              Schedule{" "}
              <span className="bg-[#FFEA00] px-2 py-0.5 select-none border-2 border-[#111] rotate-[-2deg] inline-block shadow-[2px_2px_0px_#111]">
                Generator
              </span>
            </h1>
            <p className="text-sm font-bold font-mono text-gray-700">
              EXPLORADOR UNIVERSITARIO SIN CRUCES V1.0
            </p>
          </div>

          {courses.length > 0 && (
            <div className="flex flex-wrap gap-2 font-mono font-bold text-sm flex-shrink-0">
              <button
                onClick={() => setViewMode("generator")}
                className={cn(
                  "px-4 py-2 border-2 border-black transition-transform uppercase",
                  viewMode === "generator"
                    ? "bg-[#FFEA00] shadow-[2px_2px_0px_#111]"
                    : "bg-white hover:bg-gray-100 shadow-[2px_2px_0px_#111]",     
                )}
              >
                Generador
              </button>
              <button
                onClick={() => setViewMode("all_schedules")}
                className={cn(
                  "px-4 py-2 border-2 border-black transition-transform uppercase",
                  viewMode === "all_schedules"
                    ? "bg-[#FFEA00] shadow-[2px_2px_0px_#111]"
                    : "bg-white hover:bg-gray-100 shadow-[2px_2px_0px_#111]",     
                )}
              >
                Todos los horarios
              </button>
            </div>
          )}
        </header>

        {errorError && (
          <div className="bg-[#FF3366] text-white p-2 neo-brutalist flex items-center gap-2 font-mono font-bold text-sm">
            <AlertTriangle strokeWidth={3} className="w-4 h-4" /> {errorError}
          </div>
        )}`;

code = code.replace(headerBlockRegex, newHeaderBlock);

// 3. Move the filters panel inside <aside> above the "Cursos" box.
// Extract filters panel first
const split1 = code.indexOf(
  '<section className="lg:col-span-3 flex flex-col min-h-0 space-y-4">',
);
if (split1 !== -1) {
  const startFilter = code.indexOf('<div className="bg-[#FF9100]', split1);
  const endFilter = code.indexOf(
    "{processedCombinations.length === 0 ? (",
    split1,
  );

  // the orange box
  let orangeBox = code.substring(startFilter, endFilter);
  code = code.substring(0, startFilter) + code.substring(endFilter);

  // Also, edit the orange Box classes to be smaller for stacked layout
  // Replace the main flex col/row with a purely flex col
  let modOrange = orangeBox.replace(
    'className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center"',
    'className="flex flex-col gap-3"',
  );
  // Change the grid to regular grid, cols-2 since it's constrained
  modOrange = modOrange.replace(
    'className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-2"',
    'className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2"',
  );
  // Make the whole orange box margin-bottom.
  modOrange = modOrange.replace(
    'className="bg-[#FF9100]',
    'className="mb-4 bg-[#FF9100]',
  );

  // Insert into aside
  const asideStart = code.indexOf(
    '<aside className="lg:col-span-1 flex flex-col min-h-0 shadow-[4px_4px_0px_#111]">',
  );
  const innerStart =
    asideStart +
    '<aside className="lg:col-span-1 flex flex-col min-h-0 shadow-[4px_4px_0px_#111]">'
      .length;
  // Actually we can drop the orange box right inside aside. Wait, if aside has shadow, it's a single box?
  // Wait, the aside has shadow-[4px...]. Let's wrap Cursos in a separate div or just put the orange box above that div inside aside.
  // The `<aside>` right now has:
  // <aside className="..."> <div className="bg-white border-4 border-black p-4 flex flex-col h-full overflow-hidden">
  code = code.replace(
    '<div className="bg-white border-4 border-black p-4 flex flex-col h-full overflow-hidden">',
    modOrange +
      '\n<div className="bg-white border-4 border-black p-4 flex flex-col flex-1 min-h-0 overflow-hidden shadow-[4px_4px_0px_#111]">', // make sure cursos still scrolls and has shadow if we split them
  );
  // remove the shadow from <aside> so it's a wrapper
  code = code.replace(
    '<aside className="lg:col-span-1 flex flex-col min-h-0 shadow-[4px_4px_0px_#111]">',
    '<aside className="lg:col-span-1 flex flex-col min-h-0 gap-4">',
  );

  // Wait, let's fix the section wrapping the calendar.
  code = code.replace(
    '<section className="lg:col-span-3 flex flex-col min-h-0 space-y-4">',
    '<section className="lg:col-span-3 flex flex-col min-h-0">',
  );
}

fs.writeFileSync("src/App.tsx", code);
console.log("App.tsx step 2 complete");
