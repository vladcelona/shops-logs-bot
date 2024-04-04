const { Scenes, Markup } = require('telegraf');

const { getCitiesList, getShopsList } = require('../helpers/functions');

const fs = require('node:fs');
const dayjs = require('dayjs');

require('dotenv').config();

const ADMIN_ID = process.env.ADMIN_ID;

function getCurrentDate() {
  const currentDate = new Date();
  const currentTime = currentDate.toUTCString().split(' ')[4];
  return {
    currentDay: dayjs().format("YYYY-MM-DD"),
    currentTime: currentTime
  }
}

const submitScene = new Scenes.WizardScene(
  'SUBMIT_SCENE',
  // Processing scenes step by step
  async (ctx) => {
    const shopsLogs = require('../../logs/shops-logs.json');
    const usersData = require('../../data/users-data.json');
    const { currentDay, currentTime } = getCurrentDate();

    const cityId = usersData[ctx.message.from.username].split('_')[0];
    const shopId = usersData[ctx.message.from.username].split('_')[1];

    console.log(shopsLogs[cityId][shopId][currentDay]);

    if (shopsLogs[cityId][shopId][currentDay] === undefined) {
      if (ctx.callbackQuery !== undefined) {
        if (ctx.callbackQuery.message.from.is_bot) {
          await ctx.editMessageText(
            'Введите штрих коды товаров, проданных за сегодня *ЧЕРЕЗ ЗАПЯТУЮ*. Каждый штрих-код - это 13 цифр без пробелов',
            { parse_mode: 'Markdown' }
          );
        }
      } else {
        await ctx.reply(
          'Введите штрих коды товаров, проданных за сегодня *ЧЕРЕЗ ЗАПЯТУЮ*. Каждый штрих-код - это 13 цифр без пробелов',
          { parse_mode: 'Markdown' }
        );
      }
      return ctx.wizard.next();
    } else {
      await ctx.reply('❗️ *Вы уже вводили данные сегодня*', { parse_mode: 'Markdown' });
      return ctx.scene.leave();
    }
  },
  async (ctx) => {
    const usersData = require('../../data/users-data.json');

    const barcodesMessage = ctx.message.text; console.log(barcodesMessage);
    const barcodes = barcodesMessage.split(',').map(Number);
    let correctBarcodes = true;

    barcodes.forEach((barcode) => { if (barcode.toString().length != 13) { 
      correctBarcodes = false; return; 
    } });

    if (correctBarcodes) {

      let barcodesCount = barcodes.reduce((countDict, shop) => {
        countDict[shop] = (countDict[shop] || 0) + 1;
        return countDict;
      }, {});

      ctx.wizard.state.barcodesCount = barcodesCount;

      ctx.reply(
        '*Вы уверены, что ввели правильные штрих-коды?* При нажатии кнопки *✅ Да* данные невозможно будет изменить',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [ Markup.button.callback('✅ Да', 'yes_data'), Markup.button.callback('❌ Нет', 'no_data') ]
          ])
        }
      );

      return ctx.wizard.next();
    } else {
      ctx.reply(
        'Один или несколько штрих-кодов введены неверно. *Повторите попытку*', 
        { parse_mode: 'Markdown' }
      );
    }
  },
  async (ctx) => {
    if (ctx.callbackQuery !== undefined) {
      if (ctx.callbackQuery.data === 'yes_data') {
        const shopsLogs = require('../../logs/shops-logs.json');
        const usersData = require('../../data/users-data.json');

        const { currentDay, currentTime } = getCurrentDate();

        const cityId = usersData[ctx.callbackQuery.from.username].split('_')[0];
        const shopId = usersData[ctx.callbackQuery.from.username].split('_')[1];

        const barcodesCount = ctx.wizard.state.barcodesCount;

        shopsLogs[cityId][shopId][currentDay] = barcodesCount;
        json = JSON.stringify(shopsLogs, null, 2);

        const stream = fs.createWriteStream('src/csv/shops-data.csv', { flags: 'a' });
        Object.keys(barcodesCount).forEach((key) => {
          const data = `${usersData[ctx.callbackQuery.from.username]},${currentDay},${key},${barcodesCount[key]}`
          stream.write(`${data}\n`);
        });
        stream.end();

        fs.writeFileSync(`src/logs/shops-logs.json`, json, function(err) {
          ctx.reply('Ошибка при обработке данных! Проверьте, что Вы ввели их в верном формате')
          console.log('Error while trying to write content into file ', err.toString()); 
        });

        ctx.editMessageText('*✅ Данные успешно внесены в систему!*', { parse_mode: 'Markdown' });
        return ctx.scene.leave();
      } else {
        ctx.editMessageText('*❌ Процесс внесения данных отменён!*', { parse_mode: 'Markdown' });
        return ctx.scene.leave();
      }
    } else {
      ctx.reply('*Завершите процесс внесения данных!*', { parse_mode: 'Markdown' })
    }
  }
);

const registerScene = new Scenes.WizardScene(
  'REGISTER_SCENE',
  // Processing scenes step by step
  async (ctx) => {
    const usersData = require('../../data/users-data.json');
    if (usersData[ctx.from.username] === undefined) {
      ctx.reply(
        'Для регистрации Вам необходимо выбрать *Ваш город* и *адрес магазина*',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [ Markup.button.callback('Продолжить', 'yes_register') ]
          ])
        }
      );
      return ctx.wizard.next();
    } else {
      ctx.reply(
        'Вы уже зарегистрированы в системе. Вы уверены, что хотите изменить магазин?',
        {
          ...Markup.inlineKeyboard([
            [ Markup.button.callback('✅ Да', 'yes_register'), Markup.button.callback('❌ Нет', 'no_register') ]
          ])
        }
      );
      return ctx.wizard.next();
    }
  },
  async (ctx) => {
    if (ctx.callbackQuery !== undefined) {
      if (ctx.callbackQuery.data === 'yes_register') {
        await ctx.editMessageText(
          'Выберите город Вашего магазина',
          { ...Markup.inlineKeyboard(getCitiesList(ctx)), }
        );
        return ctx.wizard.next();
      } else {
        await ctx.editMessageText(
          'Процесс регистрации завершён'
        );
        return ctx.scene.leave();
      }
    } else {
      ctx.reply('❗️ *Завершите процесс регистрации в системе!*', { parse_mode: 'Markdown' })
    }
  },
  async (ctx) => {
    const cityId = ctx.callbackQuery.data;
    ctx.scene.state.cityId = cityId;
    console.log(getShopsList(ctx, cityId));
    await ctx.editMessageText(
      `
*Выберите адрес Вашего магазин*
      `.trim(),
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard(getShopsList(ctx, cityId)) }
    );
    return ctx.wizard.next();
  },
  async (ctx) => {

    if (ctx.callbackQuery !== undefined) {
      const usersData = require('../../data/users-data.json');

      const shopId = ctx.callbackQuery.data;
      const cityId = ctx.scene.state.cityId;

      usersData[ctx.callbackQuery.from.username] = `${cityId}_${shopId}`;
      json = JSON.stringify(usersData, null, 2);

      fs.writeFileSync(`src/data/users-data.json`, json, function(err) {
        console.log('Error while trying to write content into file ', err.toString()); 
      });
      await ctx.editMessageText(
        '✅ *Вы успешно зарегистрированы в системе!*',
        { parse_mode: 'Markdown' }
      );
      return ctx.scene.leave();
    } else {
      ctx.reply('❗️ *Завершите процесс регистрации в системе!*', { parse_mode: 'Markdown' })
    }
  } 
);

const writeAdminScene = new Scenes.WizardScene(
  // Giving SCENE_ID for WizardScene object
  'WRITE_ADMIN_SCENE',
  // Processing all the steps
  async (ctx) => {
    console.log(ctx.wizard.cursor);
    await ctx.editMessageText(
      `*Введите сообщение для администратора*`, { parse_mode: 'Markdown' },
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.message !== undefined) {
      const adminMessage = ctx.message.text;
      await ctx.telegram.sendMessage(
        ADMIN_ID, 
        `
Получено следующее сообщение от пользователя @${ctx.message.from.username}
        `.trim(),
      );
      await ctx.telegram.sendMessage(
        ADMIN_ID, `${adminMessage}`.trim(), { parse_mode: 'Markdown' }
      );
      await ctx.reply(
        `✅ *Сообщение отправлено успешно!*`, { parse_mode: 'Markdown' }
      );
      return ctx.scene.leave();
    } else {
      await ctx.reply(
        `❗️ *Завершите отправку обратной связи*`, { parse_mode: 'Markdown' }
      );
      return ctx.wizard.selectStep(1);
    }
  }
);

module.exports = {
  submitScene, registerScene, writeAdminScene
}