const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function search() {
  const logFile = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\9a0f04a4-32c1-486b-ba67-5971c50d3e9d\\.system_generated\\logs\\transcript.jsonl';
  if (!fs.existsSync(logFile)) {
    console.error('Log file does not exist.');
    return;
  }
  
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const data = JSON.parse(line);
    if (data.type === 'PLANNER_RESPONSE' && data.tool_calls) {
      for (const tc of data.tool_calls) {
        if (tc.name === 'run_command') {
          console.log(`Step ${data.step_index}: run_command -> ${JSON.stringify(tc.args)}`);
        }
      }
    }
    if (data.type === 'COMMAND_EXECUTION' || data.type === 'RUN_COMMAND') {
      console.log(`Step ${data.step_index}: Execution Result -> Status: ${data.status}`);
    }
  }
}

search();
