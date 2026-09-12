const fs = require('fs');

let cookie = (process.env.HOYOLAB_COOKIE || '').trim();
if (cookie) {
  const ltuidMatch = cookie.match(/ltuid_v2=([^;]+)/);
  if (ltuidMatch && !cookie.includes('ltuid=')) {
    cookie += ` ltuid=${ltuidMatch[1]};`;
  }
  const accountIdMatch = cookie.match(/account_id_v2=([^;]+)/);
  if (accountIdMatch && !cookie.includes('account_id=')) {
    cookie += ` account_id=${accountIdMatch[1]};`;
  }
  const ltokenMatch = cookie.match(/ltoken_v2=([^;]+)/);
  if (ltokenMatch && !cookie.includes('ltoken=')) {
    cookie += ` ltoken=${ltokenMatch[1]};`;
  }
}
const discordWebhook = process.env.DISCORD_WEBHOOK || '';
const telegramToken = process.env.TELEGRAM_TOKEN || '';
const telegramChatId = process.env.TELEGRAM_CHAT_ID || '';

if (!cookie) {
  console.error("ERROR: HOYOLAB_COOKIE environment variable is empty or missing!");
  process.exit(1);
}

const config = {
  loglevel: 'info',
  language: 'en-us',
  userAgent: 'Custom fork of HoyoLabAuto: github.com/torikushiii/hoyolab-auto',
  retry: {
    attempts: 3,
    delayMs: 1000,
    timeoutMs: 30000,
  },
  testNotification: {
    enabled: false,
  },
  platforms: [
    {
      id: 1,
      active: !!discordWebhook,
      type: 'webhook',
      url: discordWebhook,
    },
    {
      id: 2,
      active: !!(telegramToken && telegramChatId),
      type: 'telegram',
      chatId: telegramChatId,
      token: telegramToken,
      disableNotification: false,
    }
  ],
  crons: {
    whitelist: [],
    blacklist: [],
  },
  accounts: [
    {
      id: 1,
      active: true,
      type: 'genshin',
      data: [
        {
          cookie: cookie,
          redeemCode: true,
          dailiesCheck: true,
          weekliesCheck: false,
          realm: { check: false, persistent: false },
          stamina: { check: false, threshold: 0, persistent: false },
          expedition: { check: false, persistent: false }
        }
      ]
    },
    {
      id: 2,
      active: true,
      type: 'starrail',
      data: [
        {
          cookie: cookie,
          redeemCode: true,
          dailiesCheck: true,
          stamina: { check: false, threshold: 0, persistent: false },
          expedition: { check: false, persistent: false }
        }
      ]
    },
    {
      id: 3,
      active: true,
      type: 'zenless',
      data: [
        {
          cookie: cookie,
          redeemCode: true,
          dailiesCheck: true,
          stamina: { check: false, threshold: 0, persistent: false }
        }
      ]
    },
    {
      id: 4,
      active: true,
      type: 'honkai',
      data: [
        {
          cookie: cookie
        }
      ]
    }
  ]
};

fs.writeFileSync('./config.json5', JSON.stringify(config, null, 2));
console.log('Successfully generated config.json5');
