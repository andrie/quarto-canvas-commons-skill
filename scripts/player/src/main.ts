import '@canvas-commons/core';
import '@canvas-commons/player';

// The player imports `src` relative to this script. The script used to sit in dist/, so a shortcode path of
// ./animations/src/x.js meant dist/animations/src/x.js. The bundle now lives in the extension's library
// folder, so resolve relative paths against the document's dist/ folder to keep existing decks working.
const Player = customElements.get('canvas-commons-player') as
  | (CustomElementConstructor & { prototype: { updateSource(src: string): Promise<void> } })
  | undefined;

if (Player) {
  const updateSource = Player.prototype.updateSource;
  Player.prototype.updateSource = function (src: string) {
    const resolved = /^([a-z][a-z0-9+.-]*:|\/)/i.test(src)
      ? src
      : new URL(src, new URL('dist/', document.baseURI)).href;
    return updateSource.call(this, resolved);
  };
}
