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

function spotifyRequest(path, config) {
  return fetch(`${SPOTIFY_API_URL}${path}`, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${config.access_token}`
    }
  });
}

function next(config) {
  spotifyRequest('/me/player/next', config).then(console.log).catch(console.log);
}

module.exports = {
  login,
  next
}
