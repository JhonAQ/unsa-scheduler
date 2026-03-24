const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace('import React, { useState, useMemo, useRef } from "react";', 'import React, { useState, useMemo } from "react";');
code = code.replace('const [courses, setCourses] = useState<Course[]>(getInitialCourses);', 'const [courses] = useState<Course[]>(getInitialCourses);');
code = code.replace('const [errorError, setError] = useState<string | null>(null);', 'const [errorError] = useState<string | null>(null);');

// Just remove all CELL_HEIGHT constants and inject one at the beginning of the file.
code = code.replace(/const CELL_HEIGHT = 44(;|\s*\/\/[^\n]*\n)/g, '');
code = code.replace('const DAYS = [', 'const CELL_HEIGHT = 44;\nconst DAYS = [');

fs.writeFileSync('src/App.tsx', code);
