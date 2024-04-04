# shops-logs-bot

`shops-logs-bot` is a Telegram bot designed to automate the storage and processing of data from all the shops. Utilizing the power of Node.js, this bot effortlessly captures, stores, and processes data sent through Telegram chats, streamlining operations and enhancing data management practices.

## Features

- **Automated Data Capture**: Automatically captures and stores information sent through Telegram messages.

- **Data Processing**: Processes stored data for analysis, reporting, and decision-making support.

- **Customizable Workflows**: Easily configurable to match your specific data handling and processing needs.

- **Secure Data Management**: Implements best practices for data security, ensuring your information is safely managed.

## Prerequisites 

Before you begin, ensure you have met the following requirements:

- Node.js (v16.0.0 or later)
- npm (v8.0.0 or later)
- A Telegram account and a bot token ([How to create a bot](https://core.telegram.org/bots#6-botfather))

## Installation

To install `shops-logs-bot`, follow these steps:

1. Clone the repository:

```bash
git clone https://github.com/vladcelona/shops-logs-bot.git
```

2. Navigate to the project directory:

```bash
cd shops-logs-bot
```

3. Install dependencies:

```bash
npm install
```

4. Copy `.env.example` to `.env` and fill in your Telegram bot token and other configuration settings:

```bash
cp .env.example .env
```

## Usage

To start the bot, run the following command in your project directory:

```bash
npm run start
```

or

```bash
nodemon app.js
```

Once the bot is running, you can interact with it through Telegram by sending messages or commands that the bot is configured to respond to.

## Demo

Here is a short demo of what the bot can do:



**The bot can be used only by group of people** with usernames in a .env.USERNAMES_LIST variable. Otherwise Telegram users get **this message**:



## License

This project is licensed under the GNU AGPLv3 License - see the LICENSE.md file for details.
