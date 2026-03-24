const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf-8').split('\n');

const timeIdx = lines.findIndex(l => l.includes('function CourseTimetable'));
const calIdx = lines.findIndex(l => l.includes('function CalendarGrid'));

if (timeIdx > -1 && calIdx > -1) {
    const before = lines.slice(0, timeIdx).join('\n');
    const after = lines.slice(calIdx).join('\n');
    let content = before + '\n' + after;
    content = content.replace('<CourseDirectory courses={courses} />', '<AllSchedulesView courses={courses} />');
    fs.writeFileSync('src/App.tsx', content);
    console.log('Sliced out old components and changed call');
} else {
    console.log('Could not find indices', timeIdx, calIdx);
}
