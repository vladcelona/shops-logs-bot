const { Context, Markup } = require('telegraf');
const { cityNames } = require('../process/texts');

/**
 * Export function for getting information about Telegram bot message
 * 
 * @param {*} ctx - Main ctx object for getting data
 * @returns Object containing information about message
 */
function getCtxInfo(ctx) {

  /** @type {number} */
  const chatId = ctx.message.chat.id;
  /** @type {number} */
  const userId = ctx.message.from.id;
  /** @type {number} */
  const messageId = ctx.message.message_id;
  /** @type {string} */
  const text = ctx.message.text;

  /** @type {string} */
  const username = ctx.message.from.username;
  /** @type {string} */
  const firstName = ctx.message.from.first_name;
  /** @type {string} */
  const lastName = ctx.message.from.last_name;

  return {
    chatId, userId, messageId, text,
    username, firstName, lastName,
  }
}

async function getDataFromUrl(url) {
  const response = await fetch(url, { method: 'GET' });
}

/**
* Function for getting status of URL
* 
* @param {string} url - URL to check status
* @returns Status text of provided URL
*/
async function getStatusText(url) {
  try {
    const response = await fetch(url);
    return response.statusText;
  } catch (error) {
    console.error(`Error while trying to fetch data: ${error}`);
    return 'FAILURE';
  }
}

/**
 * Function that gets cities list where shops are located
 * @param {Context} ctx 
 * @returns A list of strings
 */
function getCitiesList(ctx) {
  const shopsData = require('../../data/shops-data.json');
  let citiesList = [];
  Object.keys(shopsData).forEach((key) => {
    citiesList.push([Markup.button.callback(cityNames[key], key)]);
  });
  return citiesList;
}

/**
 * Function that get shops list for a certain city selected in the previous stage
 * @param {Context} ctx 
 * @param {number} shops 
 * @returns A list of inline markup buttons
 */
function getShopsList(ctx, cityId) {
  const shopsData = require('../../data/shops-data.json');
  let shopsList = [];
  Object.keys(shopsData[cityId.toString()]).forEach((key) => {
    shopsList.push([Markup.button.callback(shopsData[cityId.toString()][key], key)]);
  });
  return shopsList;
}

module.exports = { 
  getCtxInfo: getCtxInfo, 
  getStatusText: getStatusText,
  getCitiesList: getCitiesList,
  getShopsList: getShopsList
};