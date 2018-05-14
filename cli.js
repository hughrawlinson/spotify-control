const program = require('commander');
const package = require('./package.json');
const untildify = require('untildify');
const commands = require('./index.js');
const fs = require('fs');

const DEFAULT_CONFIG = '~/.config/spotify-control.json';

const withConfig = (configPath, f) => {
  let config;
  try {
    config = require(untildify(configPath || DEFAULT_CONFIG));
  } catch (e) {
    console.error(`Failed to load config ${configPath || DEFAULT_CONFIG}`);
    process.exit(1);
  }
  return () => {
    return f(config)
  }
}

const saveConfig = (configPath, updatedValues) => {
  withConfig(configPath, (config) => {
    const newconf = {
      ...config,
      ...updatedValues
    };
    fs.writeFile(
      untildify(configPath || DEFAULT_CONFIG),
      Buffer.from(JSON.stringify(newconf, null, true)),
      () => {}
    );
  })();
}

const errorOut = (message) => {
  console.error(message);
  process.exit(1);
}
const login = (configPath) => {
  withConfig(configPath, commands.login)().then(creds => {
    saveConfig(configPath, creds);
  });
}

const ensureAuthorized = (f, configPath) => {
  withConfig(configPath, (config) => {
    if (!config.client_id) {
      errorOut(`You must specify a client id in ${configPath || DEFAULT_CONFIG}`);
    }
    if (!config.client_secret) {
      errorOut(`You must specify a client secret in ${configPath || DEFAULT_CONFIG}`);
    }
    if (!config.refresh_token) {
      login(configPath);
      ensureAuthorized(f, configPath);
    }
    if (!config.access_token) {
      // this shouldn't happen, but I guess refresh?
    }
    if (false) {
      // should handle expired access tokens
    }
    return f();
  })();
}

program
  .version(package.version)
  .option('-c, --config <path>', `set config path. defaults to ${DEFAULT_CONFIG}`)

program
  .command('login')
  .action(cmd => login(cmd.parent.config));

program
  .command('next')
  .action(cmd => ensureAuthorized(() => {
    withConfig(cmd.parent.config, (config) => {
      commands.next(config);
    })();
  }));

program
  .command('printconfig')
  .action((cmd) => {
    withConfig(cmd.parent.config, (config) => {
      console.log(config);
    })();
  });

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
