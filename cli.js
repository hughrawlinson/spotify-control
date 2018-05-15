#! /usr/bin/env node
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

const retryWithRefreshIfUnauthorized = (request, configPath) => {
  withConfig(configPath, (config) => {
    request(config).then((response) => {
      if (response.status === 401) {
        commands.refresh(config).then(response => {
          saveConfig(configPath, response);
          withConfig(configPath, (updatedConfig) => {
            request(config);
          });
        });
      }
    }).catch(console.log);
  })();
}

program
  .version(package.version)
  .option('-c, --config <path>', `Set config path. Defaults to ${DEFAULT_CONFIG}`)

program
  .command('login')
  .option('--show-dialog', 'Show Spotify Auth Dialog. Defaults to False')
  .action(cmd => login(cmd.parent.config));

program
  .command('next')
  .action(cmd => ensureAuthorized(() => {
    retryWithRefreshIfUnauthorized(commands.next);
  }));

program
  .command('previous')
  .action(cmd => ensureAuthorized(() => {
    retryWithRefreshIfUnauthorized(commands.previous);
  }));

program
  .command('toggle')
  .action(cmd => ensureAuthorized(() => {
    retryWithRefreshIfUnauthorized(commands.toggle);
  }));

program
  .command('play')
  .option('-e, --entity <spotify_uri>', `Pass an optional Spotify URI to play a context`)
  .action(cmd => ensureAuthorized(() => {
    retryWithRefreshIfUnauthorized((config) => commands.play(config, cmd.entity));
  }));

program
  .command('pause')
  .action(cmd => ensureAuthorized(() => {
    retryWithRefreshIfUnauthorized(commands.pause);
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
