const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'Automação Post - Com Progresso.json');
const OUTPUT_PATH = path.join(__dirname, 'Automação Post - Final.json');

console.log('Lendo o arquivo:', FILE_PATH);
let workflowStr = fs.readFileSync(FILE_PATH, 'utf8');

// The incorrect string that needs to be replaced
const oldString = "'https://drive.usercontent.google.com/download?id=' + $url.match(/(?:\\\\/file\\\\/d\\\\/|id=)([a-zA-Z0-9_-]+)/)[1] + '&export=download'";
const oldStringAlternative = "'https://drive.usercontent.google.com/download?id=' + $url.match(/(?:\\/file\\/d\\/|id=)([a-zA-Z0-9_-]+)/)[1] + '&export=download'";

// The new correct string
const newString = "'https://drive.google.com/uc?export=download&id=' + $url.match(/(?:\\/file\\/d\\/|id=)([a-zA-Z0-9_-]+)/)[1]";

// We will use a regex to replace all occurrences of the bad drive.usercontent.google.com URL logic
let updatedStr = workflowStr.replace(/'https:\/\/drive\.usercontent\.google\.com\/download\?id=' \+ \$url\.match\(\/\(\?:\\?\/file\\?\/d\\?\/\|id=\)\(\[a-zA-Z0-9_-\]\+\)\/\)\[1\] \+ '&export=download'/g, newString);

// Also handle the case without escaped slashes if present
updatedStr = updatedStr.replace(/'https:\/\/drive\.usercontent\.google\.com\/download\?id=' \+ \$url\.match\(\/\(\?:\/file\/d\/\|id=\)\(\[a-zA-Z0-9_-\]\+\)\/\)\[1\] \+ '&export=download'/g, newString);

if (updatedStr === workflowStr) {
  console.log('⚠️ Não foi possível encontrar a string exata para substituir. Tentando substituição mais agressiva...');
  
  // More aggressive replacement
  updatedStr = workflowStr.replace(/https:\/\/drive\.usercontent\.google\.com\/download\?id=/g, 'https://drive.google.com/uc?export=download&id=');
  updatedStr = updatedStr.replace(/ \+ '&export=download'/g, '');
}

fs.writeFileSync(OUTPUT_PATH, updatedStr, 'utf8');
console.log('✅ Arquivo salvo em:', OUTPUT_PATH);
