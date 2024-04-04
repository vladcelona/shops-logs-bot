const fs = require('fs');
const path = require('path');
const { telegramBot } = require('./src/tg/bot');
require('dotenv').config();

// Periodic function
function sendStatus() {
  console.log(`Server status: running (${new Date().getTime()})`);
  setTimeout(sendStatus, 60000);
}
sendStatus();

/**
 * Function that works with files on program start
 * @param {string} file - File path from project root
 * @param {string} initialContent - Initial string content
 */
function createFileIfNotExist(file, initialContent = '') {
  fs.access(file, fs.constants.F_OK, (err) => {
    if (err) {
      fs.writeFile(file, initialContent, (writeErr) => {
        if (writeErr) { console.error(`Error creating ${file}:`, writeErr); } 
        else { console.log(`${file} created successfully.`); }
      });
    } else {
      console.log(`${file} already exists`);
    }
  });
}

/**
 * Function that works with directory
 * @param {string} directory - Directory path from project root
 */
function createDirectoryIfNotExist(directory) {
  fs.access(directory, (error) => { 
    if (error) { 
      fs.mkdir(directory, (error) => { 
        if (error) { console.log(error); } 
        else { console.log("Created new directory!"); } 
      }); 
    } else { 
      console.log(`${directory} already exists`); 
    } 
  });
}

const directories = ['./src/logs', './src/data', './src/csv'];
directories.forEach((directory) => {
  createDirectoryIfNotExist(directory);
});

const files = [
  { path: './src/csv/shops-data.csv', content: '' },
  { path: './src/data/shops-data.json', content: '{}' },
  { path: './src/data/users-data.json', content: '{}' },
  { path: './src/logs/admin-logs.json', content: '{}' },
  { path: './src/logs/shops-logs.json', content: '{}' }
];
files.forEach(({ path, content }) => {
  createFileIfNotExist(path, content);
});

telegramBot.launch({  });