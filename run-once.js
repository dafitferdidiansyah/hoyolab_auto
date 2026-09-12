const Command = require("./classes/command.js");
const Config = require("./classes/config.js");
const Got = require("./classes/got.js");

const Cache = require("./singleton/cache.js");
const Logger = require("./singleton/logger.js");
const Utils = require("./singleton/utils.js");
const TestNotification = require("./singleton/test-notification.js");

const HoyoLab = require("./hoyolab-modules/template.js");
const Platform = require("./platforms/template.js");

const DateObj = require("./object/date.js");
const ErrorObj = require("./object/error.js");
const RegionalTaskManager = require("./object/regional-task-manager.js");

const config = require("./config.js");

(async () => {
	const start = process.hrtime.bigint();

	globalThis.app = {
		Date: DateObj,
		Error: ErrorObj,
		RegionalTaskManager,
		Config,
		Command,
		Got: await Got.initialize(),
		Cache: new Cache(),
		Logger: new Logger(config.loglevel),
		Utils: new Utils(),
		TestNotification
	};

	app.Logger.info("Client", "Loading configuration data");
	Config.load(config);

	const definitions = require("./gots/index.js");
	await app.Got.importData(definitions);

	const accountsConfig = config.accounts;
	if (!accountsConfig || accountsConfig.length === 0) {
		app.Logger.warn("Client", "No accounts configured! Exiting.");
		process.exit(0);
	}

	const accounts = new Set();
	for (const definition of accountsConfig) {
		if (!definition.active) {
			app.Logger.warn("Client", `Skipping ${definition.type} account (inactive)`);
			continue;
		}

		accounts.add(HoyoLab.create(definition.type, definition));
	}

	globalThis.app = {
		...app,
		Platform,
		HoyoLab
	};

	app.Logger.info("Client", "Logging in to accounts...");
	for (const account of accounts) {
		try {
			await account.login();
		} catch (err) {
			app.Logger.warn("Client", `Skipping ${account.name} account login: ${err.message || err}`);
		}
	}

	const platformsConfig = config.platforms || [];
	const platforms = new Set();
	for (const definition of platformsConfig) {
		if (!definition.active) {
			continue;
		}
		platforms.add(Platform.create(definition.type, definition));
	}

	const promises = [];
	for (const platform of platforms) {
		promises.push(platform.connect());
	}
	await Promise.all(promises);

	// Run Daily Check-In
	app.Logger.info("RunOnce", "=== Starting Daily Check-In ===");
	try {
		const CheckIn = require("./crons/check-in/index.js");
		await CheckIn.code();
	} catch (err) {
		app.Logger.error("RunOnce", `Check-In failed: ${err.message || err}`);
	}

	// Run Code Redeem
	app.Logger.info("RunOnce", "=== Starting Code Redeem ===");
	try {
		const CodeRedeem = require("./crons/code-redeem/index.js");
		await CodeRedeem.code();
	} catch (err) {
		app.Logger.error("RunOnce", `Code Redeem failed: ${err.message || err}`);
	}

	const end = process.hrtime.bigint();
	const duration = Number(end - start) / 1e9;
	app.Logger.info("RunOnce", `All tasks completed in ${duration.toFixed(2)}s`);
	process.exit(0);
})();
