# spotify-control
A CLI for Spotify Connect. I built this so that I could use it with [skhd](https://github.com/koekeishiya/skhd) to be able to control whichever Spotify Connect device happens to be playing, without having to have the Spotify Desktop Client open.

## Config

A json file called `~/.config/spotify-control.json`, containing a `client_id` and `client_secret`. You can register a client id and secret at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard). You can specify an alternative file using the `-c` flag.

From there, you run `spotify-control login`, which will log you in and auth you up.

## Usage

```
  Usage: cli [options] [command]

  Options:

    -V, --version        output the version number
    -c, --config <path>  set config path. defaults to ~/.config/spotify-control.json
    -h, --help           output usage information

  Commands:

    login
    next
    printconfig
```
