const { Telegraf, session, Scenes, Context, Markup } = require('telegraf');
const Calendar = require('telegram-inline-calendar');

const { getCtxInfo } = require('./helpers/functions');
const { infoLogger, errorLogger } = require('./helpers/loggers');

const { getDataCommandText21, getDataCommandText22, getDataCommandText23, restrictAccessText } = require('./process/texts');
const { 
  processStartCommand, processHelpCommand, processRegisterCommand, 
  processSubmitCommand, processStatusCommand, processGetDataCommand, processDatasheetCommand 
} = require('./process/commands');

const { submitScene, registerScene, writeAdminScene } = require('./process/scenes');

const fs = require('node:fs');
const dayjs = require('dayjs');
const cron = require('node-cron');

require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const USERNAME_LIST = process.env.USERNAME_LIST.split(' ');
const ADMIN_LIST = process.env.ADMIN_LIST.split(' ');

const START_DATE = '2024-04-01';

const bot = new Telegraf(BOT_TOKEN, { polling: true });

// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--
// --==--==-            IMPORTANT FUNCTIONS SECTION             -==--==--
// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--

/**
 * @param {boolean} mode 
 * @returns A date string 
 */
function getStopDate(mode) {
  const currentDate = new Date();
  const previousDay = new Date(currentDate.getTime() - (24 * 60 * 60 * 1000));
  return (mode) 
    ? dayjs().format("YYYY-MM-DD")
    : previousDay;
}


function getCurrentDate() {
  const currentDate = new Date();
  const currentTime = currentDate.toUTCString().split(' ')[4];
  return {
    currentDay: dayjs().format("YYYY-MM-DD"),
    currentTime: currentTime
  }
}

/**
 * Function that creates new message object for adding it into log messages
 * @param {Context} ctx 
 */
const getMessageObject = (ctx) => {
  const currentTime = getCurrentDate().currentTime;
  return {
    username: ctx.from.username,
    text: ctx.message.text,
    time: currentTime,
  }
}

/**
 * Function that add a message to log file
 * @param {Context} ctx 
 */
function addMessage(ctx) {
  if (ctx.message !== undefined) {
    const currentDay = getCurrentDate().currentDay;
    if (ctx.message.hasOwnProperty('reply_to_message')) {
      const logsData = require(`../logs/group/${currentDay}.json`);
      const topic = ctx.message.reply_to_message.forum_topic_created.name;

      if (!logsData.hasOwnProperty(topic)) {
        logsData[topic] = {};
      }

      logsData[topic][ctx.message.message_id] = getMessageObject(ctx);
      json = JSON.stringify(logsData, null, 2);
      fs.writeFileSync(`src/logs/group/${currentDay}.json`, json, function(err) {});
    } else {
      const logsData = require(`../logs/bot/${currentDay}.json`);
      logsData[ctx.message.message_id] = getMessageObject(ctx);
      json = JSON.stringify(logsData, null, 2);
      fs.writeFileSync(`src/logs/bot/${currentDay}.json`, json, function(err) {});
    }
  }
}

/**
 * Function that add a message to admin log file
 * @param {Context} ctx 
 */
function addMessageToAdmin(ctx) {
  if (ctx.message !== undefined) {
    const logsData = require(`../logs/admin-logs.json`);
    logsData[ctx.message.message_id] = ctx.message;
    json = JSON.stringify(logsData, null, 2);
    fs.writeFileSync(`src/logs/admin-logs.json`, json, function(err) {});
  }
}

const getDaysArray = (start, end) => {
  for (
    var daysArray=[], date=new Date(start); 
    date <= new Date(end); date.setDate(date.getDate() + 1)
  ) {
    daysArray.push(new Date(date).toISOString().split('T')[0]);
  }
  return daysArray;
}

async function sendDataDay(ctx, givenDay) {
  const shopsLogs = require('../logs/shops-logs.json');
  const usersData = require('../data/users-data.json');

  const cityId = usersData[ctx.callbackQuery.from.username].split('_')[0];
  const shopId = usersData[ctx.callbackQuery.from.username].split('_')[1];

  const { currentDay, currentTime } = getCurrentDate();

  const data = shopsLogs[cityId][shopId][givenDay];
  let jsonData = JSON.stringify(data);

  if (jsonData !== undefined) {
    jsonData = jsonData.substring(1, jsonData.length-1).split(':').join(': ').split(',').join('\n');

    await ctx.reply(
      `
${givenDay}
\`${jsonData}\`
      `.trim(),
      { parse_mode: 'Markdown' }
    );
  } else {
    await ctx.reply(
      `Данные за *${givenDay}* не были внесены`.trim(),
      { parse_mode: 'Markdown' }
    );
  }
}

async function sendOverallData(ctx, daysArray) {
  const shopsLogs = require('../logs/shops-logs.json');
  const usersData = require('../data/users-data.json');

  const cityId = usersData[ctx.callbackQuery.from.username].split('_')[0];
  const shopId = usersData[ctx.callbackQuery.from.username].split('_')[1];

  const data = shopsLogs[cityId][shopId];
  const overallData = {};
  daysArray.forEach((day) => {
    if (data[day]  !== undefined) {
      const dayData = data[day]; console.log(dayData);
      Object.keys(dayData).forEach(key => {
        overallData[key] = (overallData[key] || 0) + dayData[key];
      });
    }
  });

  let jsonData = JSON.stringify(overallData);
  jsonData = jsonData.substring(1, jsonData.length-1).split(':').join(': ').split(',').join('\n');

  await ctx.reply(
    `
*Обобщённые данные за период*

\`${jsonData}\`
    `.trim(),
    { parse_mode: 'Markdown' }
  )
}

async function sendDataPeriod(ctx, firstDay, lastDay) {
  const daysArray = getDaysArray(firstDay, lastDay);
  await sendOverallData(ctx, daysArray);
}

// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--
// --==--            IMPORTANT FUNCTIONS SECTION (END)             --==--
// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--

// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--
// --==--==--==            CALENDAR CODE SECTION             ==--==--==--
// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--

var lastPeriodDayCalendar;

// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--
// --==--==--==          CALENDAR CODE SECTION (END)         ==--==--==--
// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--

// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--
// --==--==--==              SCENES CODE SECTION             ==--==--==--
// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--

const getDataDayScene = new Scenes.WizardScene(
  'GET_DATA_DAY_SCENE',
  // Processing scenes step by step
  async (ctx) => {
    const singleDayCalendar = new Calendar(bot, {
      language: 'ru',
      start_week_day: 1,
      start_date: START_DATE,
      stop_date: getStopDate(true),
      bot_api: 'telegraf',
      custom_start_msg: getDataCommandText21,
    });
    singleDayCalendar.startNavCalendar(ctx.callbackQuery.message);
    ctx.scene.state.singleDayCalendar = singleDayCalendar;
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.callbackQuery !== undefined) {
      const singleDayCalendar = ctx.scene.state.singleDayCalendar;
      if (ctx.callbackQuery.message.message_id == 
          singleDayCalendar.chats.get(ctx.callbackQuery.message.chat.id)) {
        res = singleDayCalendar.clickButtonCalendar(ctx.callbackQuery);
        if (res !== -1) {
          await ctx.reply(
            `
Вот логи штрих-кодов за дату: ${res}

Чтобы скопировать штрих-коды, просто *нажмите на выделенный текст*.
Он *автоматически* скопируется в буфер обмена
`.trim(),
            { parse_mode: 'Markdown' }
          );
          await sendDataDay(ctx, res);
          return ctx.scene.leave();
        }
      }
    } else {
      await ctx.reply(
        `*Завершите процесс выбора даты!*`,
        { parse_mode: 'Markdown' }
      );
    }
  }
);

const getDataPeriodScene = new Scenes.WizardScene(
  'GET_DATA_PERIOD_SCENE',
  // Processing scenes step by step
  async (ctx) => {
    const firstPeriodDayCalendar = new Calendar(bot, {
      language: 'ru',
      start_week_day: 1,
      start_date: START_DATE,
      stop_date: getStopDate(true),
      bot_api: 'telegraf',
      custom_start_msg: getDataCommandText21,
    });
    firstPeriodDayCalendar.startNavCalendar(ctx.callbackQuery.message);
    ctx.scene.state.firstPeriodDayCalendar = firstPeriodDayCalendar;
    return ctx.wizard.next();
  },
  async (ctx) => {
    const firstPeriodDayCalendar = ctx.scene.state.firstPeriodDayCalendar;
    if (ctx.callbackQuery.message.message_id == 
      firstPeriodDayCalendar.chats.get(ctx.callbackQuery.message.chat.id)) {
      res = firstPeriodDayCalendar.clickButtonCalendar(ctx.callbackQuery);
      if (res !== -1) {
        ctx.scene.state.startDate = res;
        const innerLastPeriodDayCalendar = new Calendar(bot, {
          language: 'ru', start_week_day: 1,
          start_date: res, stop_date: getStopDate(true),
          bot_api: 'telegraf', lock_date: true,
          custom_start_msg: getDataCommandText23,
        });
        lastPeriodDayCalendar = innerLastPeriodDayCalendar;
        lastPeriodDayCalendar.start_date = res;
        lastPeriodDayCalendar.lock_date_array = [res];
        lastPeriodDayCalendar.startNavCalendar(ctx.callbackQuery.message);
        return ctx.wizard.next();
      }
    }
  },
  async (ctx) => {
    if (ctx.callbackQuery.message.message_id == 
      lastPeriodDayCalendar.chats.get(ctx.callbackQuery.message.chat.id)) {
      res = lastPeriodDayCalendar.clickButtonCalendar(ctx.callbackQuery);
      if (res !== -1) {
        await ctx.reply(
          `
Вот логи штрих-кодов за даты: ${ctx.scene.state.startDate} - ${res}

Чтобы скопировать штрих-коды, просто *нажмите на выделенный текст*.
Он *автоматически* скопируется в буфер обмена
          `.trim(),
          { parse_mode: 'Markdown' }
        );
        await sendDataPeriod(ctx, ctx.scene.state.startDate, res);
        // fsExtra.emptyDirSync('src/logs/temp');
        return ctx.scene.leave();
      }
    }
  }
);

// Initializing scenes in bot using stage object
const stage = new Scenes.Stage([
  getDataDayScene, getDataPeriodScene, submitScene, registerScene, writeAdminScene
]);
bot.use(session());
bot.use(stage.middleware());

// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--
// --==--==--==          SCENES CODE SECTION (END)           ==--==--==--
// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--

// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--
// --==--==--==-         COMMAND HANDLERS SECTION           -==--==--==--
// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--

// This method logs all the messages received from Telegram API
bot.use((ctx, next) => {
  console.log('Message received: ', ctx.message);
  if (ctx.message !== undefined) {
    getMessageObject(ctx);
    addMessageToAdmin(ctx);
  }
  return next();
});

// This method handles /start command entered by user
// This command greets user
bot.command('start', async (ctx) => {
  try {
    const ctxInfo = getCtxInfo(ctx);
    if (USERNAME_LIST.indexOf(ctxInfo.username) === -1) {
      await ctx.reply(restrictAccessText, { parse_mode: 'Markdown' });
    } else {
      infoLogger(ctxInfo.text, ctxInfo.chatId, '');
      processStartCommand(ctx, ctxInfo);
    }
  } catch (err) {
    errorLogger('', '', err.toString());
  }
});

// This method handles /help command entered by user
// This command shows all basic information about bot's usage
bot.command('help', async (ctx) => {
  try {
    const ctxInfo = getCtxInfo(ctx);
    if (USERNAME_LIST.indexOf(ctxInfo.username) === -1) {
      await ctx.reply(restrictAccessText, { parse_mode: 'Markdown' });
    } else {
      infoLogger(ctxInfo.text, ctxInfo.chatId, '');
      processHelpCommand(ctx, ctxInfo);
    }
  } catch (err) {
    errorLogger('', '', err.toString());
  }
});

// This method handles /submit command entered by user
// This command enables user to enter items woth certain barcodes sold for current date
bot.command('submit', async (ctx) => {
  try {
    const usersData = require('../data/users-data.json');
    const ctxInfo = getCtxInfo(ctx);
    if (USERNAME_LIST.indexOf(ctxInfo.username) === -1) {
      await ctx.reply(restrictAccessText, { parse_mode: 'Markdown' });
    } else if (usersData[ctx.message.from.username] === undefined) {
      await ctx.reply('❗️ *Вы не зарегистрированы в системе*.\nДля регистрации нажмите /register', { parse_mode: 'Markdown' });
    } else {
      infoLogger(ctxInfo.text, ctxInfo.chatId, '');
      processSubmitCommand(ctx, ctxInfo);
    }    
  } catch (err) {
    errorLogger('', '', err.toString());
  }
});

// This method handles /getdata command enteed by user
// this command shows information about items with certain barcodes sold
// either at a certain date or a period
bot.command('getdata', async (ctx) => {
  try {
    const usersData = require('../data/users-data.json');
    const ctxInfo = getCtxInfo(ctx);
    if (USERNAME_LIST.indexOf(ctxInfo.username) === -1) {
      await ctx.reply(restrictAccessText, { parse_mode: 'Markdown' });
    } else if (usersData[ctx.message.from.username] === undefined) {
      await ctx.reply('❗️ *Вы не зарегистрированы в системе*.\nДля регистрации нажмите /register', { parse_mode: 'Markdown' });
    } else {
      infoLogger(ctxInfo.text, ctxInfo.chatId, '');
      processGetDataCommand(ctx, ctxInfo);
    }    
  } catch (err) {
    errorLogger('', '', err.toString());
  }
});

// This method handles /status command entered by user
// This command show basic info about current bot status
bot.command('status', async (ctx) => {
  try {
    const ctxInfo = getCtxInfo(ctx);
    if (USERNAME_LIST.indexOf(ctxInfo.username) === -1) {
      await ctx.reply(restrictAccessText, { parse_mode: 'Markdown' });
    } else {
      infoLogger(ctxInfo.text, ctxInfo.chatId, '');
      processStatusCommand(ctx, ctxInfo);
    }
  } catch (err) {
    errorLogger('', '', err.toString());
  }
});

// This command handles /register command entered by user
// This command lets user register into the system by choosing the shop they work in
bot.command('register', async (ctx) => {
  try {
    const ctxInfo = getCtxInfo(ctx);
    if (USERNAME_LIST.indexOf(ctxInfo.username) === -1) {
      await ctx.reply(restrictAccessText, { parse_mode: 'Markdown' });
    } else {
      infoLogger(ctxInfo.text, ctxInfo.chatId, '');
      processRegisterCommand(ctx, ctxInfo);
    }
  } catch (err) {
    errorLogger('', '', err.toString());
  }
});

// This command handles /datasheet command entered by user
// This command shows datasheet file (.csv format) with overall data for each shop
bot.command('datasheet', async (ctx) => {
  try {
    const ctxInfo = getCtxInfo(ctx);
    if (USERNAME_LIST.indexOf(ctxInfo.username) === -1) {
      await ctx.reply(restrictAccessText, { parse_mode: 'Markdown' });
    } else {
      if (ADMIN_LIST.indexOf(ctxInfo.username) === -1) {
        await ctx.reply('*Вам запрещён доступ к данной команде*');
      } else {
        infoLogger(ctxInfo.text, ctxInfo.chatId, '');
        processDatasheetCommand(ctx, ctxInfo);
      }
    }
  } catch (err) {
    errorLogger('', '', err.toString());
  }
});

// This method handles callback query data received from bot
bot.on('callback_query', async (ctx) => {
  try {
    const callbackData = ctx.callbackQuery.data;

    if (callbackData === 'writeadmin') {
      ctx.scene.enter('WRITE_ADMIN_SCENE');
    } else if (callbackData === 'daydata') {
      ctx.scene.enter('GET_DATA_DAY_SCENE');
    } else if (callbackData === 'perioddata') {
      ctx.scene.enter('GET_DATA_PERIOD_SCENE');
    }
  } catch (err) {
    errorLogger('', '', err.toString());
  }
});

// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--
// --==--==--=         COMMAND HANDLERS SECTION (END)         =--==--==--
// --==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--==--

// Sending server status message to administrator every minute
cron.schedule('* * * * *', async () => {
  bot.telegram.sendMessage(
    process.env.ADMIN_ID, "Server status (test): *RUNNING*",
    { parse_mode: 'Markdown' }
  );
});

// Exporting Telegram bot object to other files
module.exports = {
  telegramBot: bot,
}