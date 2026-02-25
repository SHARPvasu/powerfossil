const fs = require('fs');
const file = 'src/app/customers/[id]/page.tsx';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const start = lines.findIndex(l => l.includes('{showPolicyForm && ('));
if (start === -1) {
    console.log('Not found');
    process.exit(1);
}

let open = 0;
let actualEnd = start;

for (let i = start; i < lines.length; i++) {
    open += (lines[i].match(/\{/g) || []).length;
    open -= (lines[i].match(/\}/g) || []).length;
    if (open === 0 && i > start && lines[i].includes(')}')) {
        actualEnd = i;
        break;
    }
}

// Ensure we only extract what we expect (about 112 lines)
const modalLines = lines.splice(start, actualEnd - start + 1);

let dest = lines.length - 1;
// Find the closing </div> for the main component 
for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('</div >') || lines[i].includes('</div>')) {
        dest = i;
        break;
    }
}

lines.splice(dest, 0, ...modalLines);
fs.writeFileSync(file, lines.join('\n'));
console.log('Successfully moved ' + modalLines.length + ' lines!');
