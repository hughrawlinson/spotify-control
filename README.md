# spotify-control
A CLI for Spotify Connect. I built this so that I could use it with [skhd](https://github.com/koekeishiya/skhd) to be able to control whichever Spotify Connect device happens to be playing, without having to have the Spotify Desktop Client open.

## Config

A json file called `~/.config/spotify-control.json`, containing a `client_id` and `client_secret`. You can register a client id and secret at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard). You can specify an alternative file using the `-c` flag.

From there, you run `spotify-control login`, which will log you in and auth you up.

## Usage

```
  Usage: spotify-control [options] [command]

  Options:

    -V, --version        output the version number
    -c, --config <path>  Set config path. Defaults to ~/.config/spotify-control.json
    -h, --help           output usage information

  Commands:

    login [options]
    next
    previous
    toggle
    play [options]
    pause
    printconfig
```

`spotify-control` works well with [skhd](https://github.com/koekeishiya/skhd), the simple hotkey daemon for macOS. In fact, that's why I built it - so that I could use the media keys on my mac to control Spotify playing in the browser, or on my speakers. You can find an example configuration in `example.skhdrc`.
