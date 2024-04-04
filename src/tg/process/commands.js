const { Context, Markup } = require('telegraf');
const { startCommandText, helpCommandText, getDataCommandText1 } = require("./texts");
const { errorLogger } = require('../helpers/loggers');
const { getCtxInfo } = require('../helpers/functions');
/**
 * 
 * @param {Context} ctx 
 * @param { chatId: number; userId: number; messageId: number; text: string; username: string; firstName: string; lastName: string; } ctxInfo 
 */
async function processStartCommand(ctx, ctxInfo) {
  await ctx.reply(
    startCommandText, { parse_mode: 'Markdown' }
  );
}

/**
 * 
 * @param {Context} ctx 
 * @param { chatId: number; userId: number; messageId: number; text: string; username: string; firstName: string; lastName: string; } ctxInfo 
 */
async function processHelpCommand(ctx, ctxInfo) {
  await ctx.reply(
    helpCommandText, 
    { 
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [ Markup.button.callback('📝 Обратная связь', 'writeadmin') ]
      ])
    }
  )
}

/**
 * 
 * @param {Context} ctx 
 * @param { chatId: number; userId: number; messageId: number; text: string; username: string; firstName: string; lastName: string; } ctxInfo 
 */
async function processStatusCommand(ctx, ctxInfo) {
  await ctx.reply(
`
Server port: ${process.env.PORT}
Server status: 200
*If you see this message, that means that Shops Logs bot works correctly*
`.trim(),
    { parse_mode: 'Markdown' }
  )
}

/**
 * 
 * @param {Context} ctx 
 * @param { chatId: number; userId: number; messageId: number; text: string; username: string; firstName: string; lastName: string; } ctxInfo 
 */
async function processGetDataCommand(ctx, ctxInfo) {
  ctx.reply(
    getDataCommandText1,
    { 
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('День', 'daydata'),
          Markup.button.callback('Период', 'perioddata')
        ]
      ])
    },
  );
}

/**
 * 
 * @param {Context} ctx 
 * @param { chatId: number; userId: number; messageId: number; text: string; username: string; firstName: string; lastName: string; } ctxInfo 
 */
async function processRegisterCommand(ctx, ctxInfo) {
  try {
    const ctxInfo = getCtxInfo(ctx);
    ctx.scene.enter('REGISTER_SCENE');
  } catch (err) {
    errorLogger('', '', err.toString());
  }
}

/**
 * 
 * @param {Context} ctx 
 * @param { chatId: number; userId: number; messageId: number; text: string; username: string; firstName: string; lastName: string; } ctxInfo 
 */
async function processSubmitCommand(ctx, ctxInfo) {
  try {
    const ctxInfo = getCtxInfo(ctx);
    ctx.scene.enter('SUBMIT_SCENE');
  } catch (err) {
    errorLogger('', '', err.toString());
  }
}

/**
 * 
 * @param {Context} ctx 
 * @param { chatId: number; userId: number; messageId: number; text: string; username: string; firstName: string; lastName: string; } ctxInfo 
 */
async function processDatasheetCommand(ctx, ctxInfo) {
  ctx.telegram.sendDocument(
    ctx.from.id,
    { 
      filename: 'datasheet.csv',
      source: 'src/csv/shops-data.csv'
    }
  )
}

module.exports = {
  processStartCommand: processStartCommand,
  processHelpCommand: processHelpCommand,
  processStatusCommand: processStatusCommand,
  processGetDataCommand: processGetDataCommand,
  processRegisterCommand: processRegisterCommand,
  processSubmitCommand: processSubmitCommand,
  processDatasheetCommand: processDatasheetCommand
}