const { spawn } = require('child_process');
let io;
function init(i) {
	io = i;
}

function executeCode(code) {
  try {
    const result = eval(code);
    console.log('Execution Result:', result);
	emit('api',
  } catch (error) {
    console.error('Error during execution:', error);
  }
}


function code() {
	
}

module.exports = {
  execute,
  code
};
