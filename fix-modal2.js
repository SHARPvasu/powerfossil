const fs = require('fs');
const file = 'src/app/customers/[id]/page.tsx';
let lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

const start = lines.findIndex(l => l.includes('{showPolicyForm && ('));
const saveBtnIdx = lines.findIndex((l, i) => i > start && l.includes('Save Policy'));

let end = saveBtnIdx;
while (end < lines.length && !lines[end].includes(')}')) {
    end++;
}

const modalLines = lines.splice(start, end - start + 1);

let dest = lines.length - 1;
while (dest > 0 && !lines[dest].includes('</div>')) {
    dest--;
}

lines.splice(dest, 0, ...modalLines);
fs.writeFileSync(file, lines.join('\n'));
console.log('Successfully moved ' + modalLines.length + ' lines. Modal is now at global scope!');
