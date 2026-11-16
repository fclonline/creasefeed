#!/bin/sh
# Regenerates the PNG app icons in public/ from scripts/icons/mark.html using
# headless Chrome (needs network for the Barlow Condensed web font).
set -e
cd "$(dirname "$0")/../.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PAGE="file://$PWD/scripts/icons/mark.html"
# Chrome enforces a minimum window width, so render everything at 512 and
# downscale with sips (macOS).
render() { # size mode out
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --default-background-color=00000000 --virtual-time-budget=6000 \
    --window-size=512,512 --screenshot="public/$3" "$PAGE?mode=$2" >/dev/null 2>&1
  [ "$1" = 512 ] || sips -z "$1" "$1" "public/$3" >/dev/null
}
render 32  ring     favicon-32.png
render 180 square   apple-touch-icon.png
render 192 full     icon-192.png
render 512 full     icon-512.png
render 512 maskable icon-512-maskable.png
echo "icons written to public/"
