import { RssReader } from "./rss-reader.js";

const reader = new RssReader({
  subscriptions: [{ url: "https://feeds.megaphone.fm/theyard" }],
});

const template = document.querySelector<HTMLTemplateElement>("#episode-row")!;

for (const item of await reader.getItems()) {
  const element = template.content.cloneNode(true) as HTMLElement;
  element.querySelector(".title")!.textContent = item.title;
  element.querySelector("a")?.setAttribute("data-url", item.link);
  element.querySelector("a")?.setAttribute("data-image", item.image);
  element.querySelector("a")?.addEventListener("click", onItemSelect);
  document.body.append(element);
}

function onItemSelect(event: PointerEvent) {
  const link = event.currentTarget as HTMLAnchorElement;
  const player = document.querySelector("audio")!;

  player.setAttribute("src", link.dataset.url!);

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
