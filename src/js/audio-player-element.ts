
import { setState } from "./state.js";
export class AudioPlayerElement extends HTMLElement {
  static observedAttributes = ["src", "current-time"];

  #audioElement = document.createElement("audio");

  constructor() {
    super();

    this.#audioElement.controls = true;
    this.#audioElement.autoplay = true;
    this.#audioElement.hidden = !new URLSearchParams(
      window.location.search.slice(1),
    ).get("debug");
    this.#audioElement.addEventListener("play", this);
    this.#audioElement.addEventListener("pause", this);
    this.#audioElement.addEventListener("timeupdate", this);
    this.#audioElement.addEventListener("loadedmetadata", this);

    this.attachShadow({ mode: "open" });
    this.shadowRoot!.innerHTML = `<style>
    :host {
      display: block;
    }

    #player {
      display: flex;
      border-top: solid var(--gray-5) var(--border-size-1);
      user-select: none;
    }

    button { 
      cursor: pointer;
      margin: var(--size-1);
      text-align: center;
      height: var(--size-8);
      width: var(--size-8);
      font-size: 2em;
      padding: 0;
      background: transparent;
      border: none;
    }

    #timingContainer {
      display: flex;
      align-items: center;
    }

    #progress {
      width: 100%;
    }


    </style>
    <div id="player">
      <button id="playButton" disabled>⏵</button>
      <button id="pauseButton" disabled hidden>⏸</button>
      <div id="timingContainer">
        <div id="currentTime">00:00</div>/<div id="duration">00:00</div>
      </div>
      <input type="range" value="0" id="progress" disabled>
      <button id="muteButton">🔇</button>
      <button id="unmuteButton" hidden>🔈</button>
    </div>
    `;

    this.shadowRoot?.append(this.#audioElement);
    this.shadowRoot
      ?.querySelector("#progress")
      ?.addEventListener("input", this);

    this.shadowRoot
      ?.querySelector("#playButton")
      ?.addEventListener("click", this);
    this.shadowRoot
      ?.querySelector("#pauseButton")
      ?.addEventListener("click", this);
  }

  handleEvent(event: Event): void {
    switch (event.type) {
      case "play":
      case "pause": {
        this.#playEventHandler();
        break;
      }
      case "timeupdate": {
        this.#timeUpdateHandler();
        break;
      }
      case "loadedmetadata": {
        this.#loadedMetadataHandler();
        break;
      }
      case "input": {
        this.#seekHandler();
        break;
      }
      // TODO: I feel like this is gonna be a problem in the near future.
      case "click": {
        this.#clickHandler(event);
        break;
      }
    }
  }

  #clickHandler(event: MouseEvent) {
    if (event.currentTarget?.id === "pauseButton") {
      this.#audioElement.pause();
    } else if (event.currentTarget?.id === "playButton") {
      this.#audioElement.play();
    }
  }

  #seekHandler() {
    this.#audioElement.currentTime =
      this.shadowRoot?.querySelector<HTMLInputElement>("#progress")?.value;
  }

  #loadedMetadataHandler() {
    // TODO: Handle this better. It needs to slice off any trailing `00:` if the audio is shorter than an hour.
    this.shadowRoot.querySelector("#duration").textContent = new Date(
      this.#audioElement.duration * 1000,
    )
      .toISOString()
      .slice(11, 19);

    this.shadowRoot
      ?.querySelector("#progress")
      ?.setAttribute("max", this.#audioElement.duration.toString());

    this.#playEventHandler();
  }

  #timeUpdateHandler() {
    // TODO: There's probably a better way. Especially when the current time is over an hour lmao.
    this.shadowRoot.querySelector("#currentTime").textContent = new Date(
      this.#audioElement.currentTime * 1000,
    )
      .toISOString()
      .slice(14, 19);

    this.shadowRoot
      ?.querySelector("#progress")
      .setAttribute("value", this.#audioElement.currentTime);

    setState("audio-player-state", {
      currentTime: this.#audioElement.currentTime,
    });
  }

  #playEventHandler(): void {
    this.shadowRoot.querySelector("#playButton").disabled = false;
    this.shadowRoot.querySelector("#pauseButton").disabled = false;
    this.shadowRoot.querySelector("#progress").disabled = false;

    if (this.#audioElement.paused) {
      this.shadowRoot.querySelector("#playButton").hidden = false;
      this.shadowRoot.querySelector("#pauseButton").hidden = true;
    } else {
      this.shadowRoot.querySelector("#playButton").hidden = true;
      this.shadowRoot.querySelector("#pauseButton").hidden = false;
    }
  }

  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string,
  ): void {
    // Just pass the src attribute directly to the internal HTMLAudioElement
    if (name === "src") {
      this.#audioElement.src = newValue;
    } else if (name === "current-time") {
      this.#audioElement.currentTime = Number.parseFloat(newValue);
    }
  }
}
