/**
 * Script to add progress tracking nodes to the n8n workflow.
 * Adds 4 "📊 Progresso" nodes at key stages and modifies
 * the existing "Update Google Sheets Status" to include Progresso = 100.
 */
const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join('C:', 'Users', 'felip', 'Downloads', 'Automação Post (4).json');
const OUTPUT_FILE = path.join(__dirname, 'Automação Post - Com Progresso.json');

console.log('Reading workflow from:', INPUT_FILE);
const workflow = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

// ============================================================
// 1. Create the progress update node template
// ============================================================
const createProgressNode = (name, progressValue, positionX, positionY) => ({
  parameters: {
    operation: "update",
    documentId: {
      __rl: true,
      value: "1T8n1DXK7bmadmxSvCMIJmsLbAyVNhJbzedCL-GMRX58",
      mode: "id"
    },
    sheetName: {
      __rl: true,
      value: 354284204,
      mode: "list",
      cachedResultName: "Calendário de Automação"
    },
    columns: {
      mappingMode: "defineBelow",
      value: {
        "ID": "={{ $('Google Sheets Trigger').item.json.ID }}",
        "Progresso": String(progressValue)
      },
      matchingColumns: ["ID"],
      schema: [
        {
          id: "ID",
          displayName: "ID",
          required: false,
          defaultMatch: false,
          display: true,
          type: "string",
          canBeUsedToMatch: true
        },
        {
          id: "Progresso",
          displayName: "Progresso",
          required: false,
          defaultMatch: false,
          display: true,
          type: "string",
          canBeUsedToMatch: true
        }
      ],
      attemptToConvertTypes: false,
      convertFieldsToString: false
    },
    options: {}
  },
  id: `progress-${progressValue}-${Date.now()}`,
  name: name,
  type: "n8n-nodes-base.googleSheets",
  typeVersion: 4.7,
  position: [positionX, positionY],
  credentials: {
    googleSheetsOAuth2Api: {
      id: "ByhccJEjcXl1m588",
      name: "Google Sheets account"
    }
  },
  onError: "continueRegularOutput",
  alwaysOutputData: true
});

// ============================================================
// 2. Add 4 progress nodes
// ============================================================

// Get positions of existing nodes to place progress nodes between them
const getNodePosition = (nodeName) => {
  const node = workflow.nodes.find(n => n.name === nodeName);
  return node ? node.position : [0, 0];
};

const filterPos = getNodePosition('Filter');
const configurePos = getNodePosition('\u2699\uFE0F Configure Post Settings');
const waitPos = getNodePosition('\u23F0 Wait Until Publish Time');
const checkStatusPos = getNodePosition('\uD83D\uDD0D Check Processing Status');
const initialWaitPos = getNodePosition('\u23F0 Initial Processing Wait');

// Place progress nodes between the existing nodes (midpoint X, same Y)
const progress10 = createProgressNode(
  "\uD83D\uDCCA Progresso 10%", 10,
  Math.round((filterPos[0] + configurePos[0]) / 2),
  filterPos[1]
);

const progress25 = createProgressNode(
  "\uD83D\uDCCA Progresso 25%", 25,
  Math.round((configurePos[0] + waitPos[0]) / 2),
  configurePos[1]
);

const progress50 = createProgressNode(
  "\uD83D\uDCCA Progresso 50%", 50,
  Math.round((waitPos[0] + 544) / 2),  // between Wait and If Post nodes
  waitPos[1]
);

const progress75 = createProgressNode(
  "\uD83D\uDCCA Progresso 75%", 75,
  Math.round((checkStatusPos[0] + initialWaitPos[0]) / 2),
  checkStatusPos[1]
);

// Add nodes to the workflow
workflow.nodes.push(progress10, progress25, progress50, progress75);
console.log('✅ Added 4 progress nodes');

// ============================================================
// 3. Modify connections to insert progress nodes as PARALLEL branches
// This prevents the empty output from breaking the main data flow.
// ============================================================
const conn = workflow.connections;

// Helper to add a connection safely
const addConnection = (sourceNode, targetNode) => {
  if (!conn[sourceNode]) conn[sourceNode] = { main: [[]] };
  if (!conn[sourceNode].main) conn[sourceNode].main = [[]];
  if (!conn[sourceNode].main[0]) conn[sourceNode].main[0] = [];
  
  conn[sourceNode].main[0].push({
    node: targetNode,
    type: "main",
    index: 0
  });
};

// 3a. Filter → 📊 Progresso 10% (Parallel to Configure Post Settings)
addConnection("Filter", "\uD83D\uDCCA Progresso 10%");
console.log('✅ Connected: Filter → 📊 10% (Parallel)');

// 3b. ⚙️ Configure Post Settings → 📊 Progresso 25% (Parallel to Wait Until Publish Time)
addConnection("\u2699\uFE0F Configure Post Settings", "\uD83D\uDCCA Progresso 25%");
console.log('✅ Connected: Configure → 📊 25% (Parallel)');

// 3c. ⏰ Wait Until Publish Time → 📊 Progresso 50% (Parallel to If Post IG/FB)
addConnection("\u23F0 Wait Until Publish Time", "\uD83D\uDCCA Progresso 50%");
console.log('✅ Connected: Wait Time → 📊 50% (Parallel)');

// 3d. 🔍 Check Processing Status → 📊 Progresso 75% (Parallel to Initial Processing Wait)
addConnection("\uD83D\uDD0D Check Processing Status", "\uD83D\uDCCA Progresso 75%");
console.log('✅ Connected: Check Status → 📊 75% (Parallel)');

// ============================================================
// 4. Update existing "Update Google Sheets Status" to add Progresso = 100
// ============================================================
const updateNode = workflow.nodes.find(n => n.name === 'Update Google Sheets Status');
if (updateNode) {
  // Add Progresso to the values being updated
  updateNode.parameters.columns.value["Progresso"] = "100";
  
  // Also update documentId to the correct spreadsheet
  updateNode.parameters.documentId.value = "1T8n1DXK7bmadmxSvCMIJmsLbAyVNhJbzedCL-GMRX58";
  updateNode.parameters.documentId.cachedResultName = "Cópia de Planilha Automacao Post";
  
  // Add Progresso to the schema
  updateNode.parameters.columns.schema.push({
    id: "Progresso",
    displayName: "Progresso",
    required: false,
    defaultMatch: false,
    display: true,
    type: "string",
    canBeUsedToMatch: true
  });
  
  console.log('✅ Updated "Update Google Sheets Status" to include Progresso = 100');
} else {
  console.log('⚠️ Could not find "Update Google Sheets Status" node');
}

// ============================================================
// 5. Save modified workflow
// ============================================================
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(workflow, null, 2), 'utf8');
console.log(`\n🎉 Modified workflow saved to: ${OUTPUT_FILE}`);
console.log('\nAgora importe este arquivo no n8n para substituir o workflow atual!');
