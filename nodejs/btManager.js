const { spawn } = require('child_process');
let io;
function init(i) {
	io = i;
}

function scan() {
  try {
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
