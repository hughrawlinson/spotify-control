const qs = require('querystring');
const opn = require('opn');
const http = require('http');
const url = require('url');
const fetch = require('node-fetch');

const SPOTIFY_API_URL = "https://api.spotify.com/v1"
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com"
const redirect_uri = "http://localhost:8082/"

function login(config) {
  return new Promise((resolve, reject) => {
    const params = qs.stringify({
      client_id: config.client_id,
      redirect_uri,
      response_type: "code",
      show_dialog:true
    });
    opn(`${SPOTIFY_AUTH_URL}/authorize?${params}`, {wait: false}).then(() => {
      const server = http.createServer((req, res) => {
        const {code} = url.parse(req.url, true).query;
        res.write("<script>window.close()</script>");
        res.end(() => {
          server.close();
          const client_creds = Buffer.from(
            `${config.client_id}:${config.client_secret}`
          ).toString('base64');
          fetch(`${SPOTIFY_AUTH_URL}/api/token`, {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              "authorization": `Basic ${client_creds}`
            },
            body: qs.stringify({
              code,
              redirect_uri,
              grant_type: 'authorization_code'
            })
          }).then(j => j.json()).then(resp => {
            resolve(resp);
          }).catch(console.log)
        });
      });
      server.listen(8082, '0.0.0.0');
    });
  });
}

function refresh(config) {
  return new Promise((resolve, reject) => {
    const client_creds = Buffer.from(
      `${config.client_id}:${config.client_secret}`
    ).toString('base64');
    fetch(`${SPOTIFY_AUTH_URL}/api/token`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "authorization": `Basic ${client_creds}`
      },
      body: qs.stringify({
        refresh_token: config.refresh_token,
        grant_type: 'refresh_token'
      })
    }).then(j => {
      return j.json();
    }).then(resp => {
      resolve(resp);
    }).catch(console.log)
  });
}

function spotifyRequest(path, config, method, body) {
  return fetch(`${SPOTIFY_API_URL}${path}`, {
    method: method || "POST",
    headers: {
      "authorization": `Bearer ${config.access_token}`
    },
    body
  });
}

function next(config) {
  return spotifyRequest('/me/player/next', config).catch(console.log);
}

function previous(config) {
  return spotifyRequest('/me/player/previous', config).catch(console.log);
}

function player(config) {
  return spotifyRequest('/me/player', config, "GET").catch(console.log);
}

function play(config, uri) {
  return spotifyRequest('/me/player/play', config, "PUT", uri && JSON.stringify({
    uris: [uri]
  })).catch(console.log);
}

function pause(config) {
  return spotifyRequest('/me/player/pause', config, "PUT").catch(console.log);
}

function toggle(config) {
  return player(config).then(j => j.json()).then(response => {
    response.is_playing
      ? pause(config)
      : play(config);
    return response;
  });
}

module.exports = {
  login,
  refresh,
  next,
  previous,
  toggle,
  pause,
  play
}
