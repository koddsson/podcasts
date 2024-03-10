import { RssReader } from "./rss-reader.js";
import { AudioPlayerElement } from "./audio-player-element.js";
import { sha256 } from "./hash-string.js";
import { getState, setState } from "./state.js";

interface State extends Record<string, unknown> {
  url: URL;
  id: string;
  currentTime?: number;
}

window.customElements.define("audio-player", AudioPlayerElement);
const player = document.querySelector<AudioPlayerElement>("audio-player")!;

const reader = new RssReader({
  subscriptions: [{ url: "https://feeds.megaphone.fm/theyard" }],
});

const template = document.querySelector<HTMLTemplateElement>("#episode-row")!;
const list = document.querySelector("#episode-list");

for (const item of await reader.getItems()) {
  const element = template.content.cloneNode(true) as HTMLElement;
  const link = element.querySelector("a");

  element.querySelector(".title")!.textContent = item.title;
  link?.setAttribute("id", `${await sha256(JSON.stringify(item))}`);
  link?.setAttribute("data-url", item.link);
  link?.setAttribute("data-image", item.image);
  link?.addEventListener("click", onItemSelect);

  list?.append(element);
}

const state = getState<State>("audio-player-state");
if (state) {
  player.setAttribute("src", state.url);
  player.setAttribute("current-time", state.currentTime);
}

function onItemSelect(event: PointerEvent) {
  const link = event.currentTarget as HTMLAnchorElement;

  // Somewhat annoyingly the "state" of the player is stored both in the attributes of the
  // component _and_ in localStorage, via `state.ts`. There should probably just be one place
  // where it's state is stored.
  //
  // Maybe it's should all be in the component via a `player.state = {...}` property? Or a
  // `setState` function? The operation of the component is then derived from the state? Or should
  // the syncing of state and the component be seperated? Not quite sure yet.
  player.setAttribute("src", link.dataset.url!);
  setState<State>("audio-player-state", {
    id: link.id,
    url: new URL(link.dataset.url!),
  });

  navigator.mediaSession.metadata = new MediaMetadata({
    title: "Shadows of Ourselves",
    artist: "The Yard",
    artwork: [
      {
        sizes: "256x256",
        src: link.dataset.image!,
        type: "image/jpeg",
      },
    ],
  });

  navigator.mediaSession.setActionHandler("play", () => player.play());
  navigator.mediaSession.setActionHandler("pause", () => player.pause());
  navigator.mediaSession.setActionHandler("seekbackward", (details) => {
    const skipTime = details.seekOffset || 1;
    player.currentTime = Math.max(player.currentTime - skipTime, 0);
  });

  navigator.mediaSession.setActionHandler("seekforward", (details) => {
    const skipTime = details.seekOffset || 1;
    player.currentTime = Math.min(
      player.currentTime + skipTime,
      player.duration,
    );
  });

  navigator.mediaSession.setActionHandler("seekto", (details) => {
    if (details.fastSeek && "fastSeek" in player) {
      player.fastSeek(details.seekTime);
      return;
    }
    player.currentTime = details.seekTime;
  });

  navigator.mediaSession.setActionHandler("previoustrack", () => {
    player.currentTime = 0;
  });
}
