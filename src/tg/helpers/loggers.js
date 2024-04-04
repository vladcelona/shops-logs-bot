/**
 * Function that logs level 'DEBUG' messages
 * @param {string} command - String command that was entered
 * @param {number} chatId - Telegram Chat ID where logger is called
 * @param {string} debugMessage - Sample error message
 */
function debugLogger(command, chatId, debugMessage) {
  console.error(`Error while handling /${command} in chat #${chatId}. DEBUG message: ${debugMessage}`)
}

/**
 * Function that logs level 'INFO' messages
 * @param {string} command - String command that was entered
 * @param {number} chatId - Telegram Chat ID where logger is called
 * @param {string} infoMessage - Sample info message
 */
function infoLogger(command, chatId, infoMessage) {
  console.info(`Handling /${command} in chat #${chatId}. INFO message: ${infoMessage}`);
}

/**
 * Function that logs level 'WARN' messages
 * @param {string} command - String command that was entered
 * @param {number} chatId - Telegram Chat ID where logger is called
 * @param {string} warnMessage - Sample warn message
 */
function warnLogger(command, chatId, warnMessage) {
  console.warn(`Handling /${command} in chat #${chatId}. WARN message: ${warnMessage}`);
}

/**
 * Function that logs level 'INFO' messages
 * @param {string} command - String command that was entered
 * @param {number} chatId - Telegram Chat ID where logger is called
 * @param {string} errorMessage - Sample error message
 */
function errorLogger(command, chatId, errorMessage) {
  console.error(`Error while handling /${command} in chat #${chatId}. ERROR message: ${errorMessage}`)
}

module.exports = {
  debugLogger, infoLogger, warnLogger, errorLogger
}