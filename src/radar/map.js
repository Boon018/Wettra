import { normalizedPoint, screenPoint } from "./projection.js";
import { TileLayer } from "./layers.js";
import { installGestures } from "./controls.js";
import { t } from "../ui/i18n.js";

// One instance owns the DOM, timers, listeners and tile requests. Its normalized
// viewport lives in application memory, so ordinary forecast renders don't recenter.
export class RadarMap {
  constructor(view, getData, setFrame, formatTime) {
    this.view = view;
    this.getData = getData;
    this.setFrame = setFrame;
    this.formatTime = formatTime;
    this.playing = false;
    this.disposed = false;
    this.raf = 0;
    this.element = document.createElement("div");
    this.element.className = "radar-widget";
    this.element.innerHTML = `<div class="radarbox"><div class="map-surface" tabindex="0" role="region" aria-label="${t("radar.map.label")}">
   <div class="map-layer base-tiles"></div><div class="map-layer radar-tiles"></div>
   <span class="map-marker" role="img" aria-label="${t("radar.map.location")}"></span><span class="map-compass" aria-hidden="true">N ↑</span>
   <div class="map-tools"><button type="button" data-map="out" aria-label="${t("radar.map.zoomOut")}">−</button><button type="button" data-map="in" aria-label="${t("radar.map.zoomIn")}">+</button><button type="button" data-map="center" aria-label="${t("radar.map.recenter")}">⌖</button></div>
   <div class="map-attribution">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> · <a href="https://www.rainviewer.com/" target="_blank" rel="noreferrer">RainViewer</a></div>
  </div></div><div class="radar-controls actions"><button type="button" class="radar-play" aria-pressed="false">▶ ${t("radar.play")}</button><label>${t("radar.opacity")} <input class="range" type="range" min="0" max="100" value="76" aria-label="${t("radar.opacity")}"></label></div>
  <div class="radar-timeline-head"><strong>${t("radar.timeline")}</strong><time id="radarSelectedTime"></time></div>
  <input id="radarTime" class="range" type="range" min="0" max="0" value="0" aria-label="${t("radar.timeline")}">
  <div class="radar-timeline-ends"><span id="radarFirstTime"></span><span id="radarLastTime"></span></div>
  <p id="radarLabel" class="small" role="status" aria-live="polite"></p>
  <p class="footnote">${t("radar.legend")}</p>`;
    this.surface = this.element.querySelector(".map-surface");
    this.base = new TileLayer(
      this.element.querySelector(".base-tiles"),
      () => this.status(),
      12,
    );
    this.rain = new TileLayer(
      this.element.querySelector(".radar-tiles"),
      () => this.status(),
      7,
    );
    this.removeGestures = installGestures(this.surface, view, () =>
      this.schedule(),
    );
    this.element.querySelector('[data-map="out"]').onclick = () => {
      view.z = Math.max(3, view.z - 1);
      this.schedule();
    };
    this.element.querySelector('[data-map="in"]').onclick = () => {
      view.z = Math.min(12, view.z + 1);
      this.schedule();
    };
    this.element.querySelector('[data-map="center"]').onclick = () => {
      Object.assign(
        view,
        normalizedPoint(
          this.getData().location.latitude,
          this.getData().location.longitude,
        ),
      );
      this.schedule();
    };
    this.playButton = this.element.querySelector(".radar-play");
    this.playButton.onclick = () => this.play(!this.playing);
    this.timeline = this.element.querySelector("#radarTime");
    this.timeline.oninput = () => {
      this.play(false);
      this.setFrame(+this.timeline.value);
      this.update();
    };
    const opacity = this.element.querySelector(
      '[aria-label="' + t("radar.opacity") + '"]',
    );
    opacity.value = String(view.opacity ?? 76);
    opacity.oninput = () => {
      view.opacity = +opacity.value;
      this.rain.element.style.opacity = String(view.opacity / 100);
    };
    this.visibility = () => {
      if (document.hidden) this.play(false);
    };
    document.addEventListener("visibilitychange", this.visibility);
    this.resize = new ResizeObserver(() => this.schedule());
    this.resize.observe(this.surface);
  }
  attach(host) {
    if (this.element.parentElement !== host) host.append(this.element);
    this.update();
  }
  schedule() {
    if (!this.raf && !this.disposed)
      this.raf = requestAnimationFrame(() => {
        this.raf = 0;
        this.update();
      });
  }
  update() {
    if (this.disposed || !this.element.isConnected) return;
    const { location, radar, index } = this.getData();
    const width = this.surface.clientWidth,
      height = this.surface.clientHeight;
    if (!width || !height) return;
    const frame = radar?.frames[index];
    const frames = radar?.frames || [];
    this.timeline.disabled = !frame;
    this.playButton.disabled = !frame;
    this.timeline.max = String(Math.max(0, frames.length - 1));
    this.timeline.value = String(index || 0);
    this.timeline.setAttribute(
      "aria-valuetext",
      frame ? this.formatTime(frame.time) : t("radar.noFrame"),
    );
    this.element.querySelector("#radarSelectedTime").textContent = frame
      ? this.formatTime(frame.time)
      : t("radar.noFrame");
    this.element.querySelector("#radarFirstTime").textContent = frames.length
      ? this.formatTime(frames[0].time)
      : "";
    this.element.querySelector("#radarLastTime").textContent = frames.length
      ? this.formatTime(frames[frames.length - 1].time)
      : "";
    // Local files cannot send the Referer required by OSM's web tile policy.
    // Keep precipitation usable and provide the HTTPS map link in the host view.
    this.base.update(this.view, width, height, (t) =>
      locationProtocol() === "file:"
        ? ""
        : `https://tile.openstreetmap.org/${t.z}/${t.x}/${t.y}.png`,
    );
    this.rain.update(this.view, width, height, (t) =>
      frame
        ? `${radar.host}${frame.path}/256/${t.z}/${t.x}/${t.y}/2/1_1.png`
        : "",
    );
    this.rain.element.style.opacity = String((this.view.opacity ?? 76) / 100);
    const pixel = screenPoint(
      normalizedPoint(location.latitude, location.longitude),
      this.view,
      width,
      height,
    );
    const marker = this.element.querySelector(".map-marker");
    marker.style.left = pixel.x + "px";
    marker.style.top = pixel.y + "px";
    marker.title = location.name;
    this.surface.dataset.zoom = String(this.view.z);
    this.surface.dataset.center = JSON.stringify({
      x: this.view.x,
      y: this.view.y,
    });
    this.status();
  }
  status() {
    if (this.disposed) return;
    const { location, radar, index, busy, error } = this.getData();
    const frame = radar?.frames[index];
    const b = this.base.counts(),
      r = this.rain.counts();
    let message = t("radar.locationStatus", { name: location.name }) + " · ";
    if (frame) {
      message += this.formatTime(frame.time) + " · ";
      if (Date.now() / 1000 - frame.time > 1800)
        message += t("radar.olderFrame") + " · ";
    }
    message += busy
      ? t("radar.refreshing")
      : !frame
        ? error
          ? t("radar.unavailable")
          : t("radar.noFrame")
        : r.loading
          ? t("radar.loadingTiles")
          : r.error
            ? t("radar.partialTiles", { count: r.error })
            : r.loaded
              ? t("radar.tilesLoaded")
              : t("radar.coverageUnavailable");
    if (b.error) message += " " + t("radar.basemapPartial");
    if (locationProtocol() === "file:")
      message += " " + t("radar.httpsRequired");
    this.element.querySelector("#radarLabel").textContent = message;
  }
  play(on) {
    clearTimeout(this.timer);
    this.playing = on;
    this.playButton.textContent = on
      ? "❚❚ " + t("radar.pause")
      : "▶ " + t("radar.play");
    this.playButton.setAttribute("aria-pressed", String(on));
    if (on)
      this.timer = setTimeout(() => {
        if (this.disposed || !this.element.isConnected || document.hidden) {
          this.play(false);
          return;
        }
        const { radar, index } = this.getData();
        if (radar?.frames.length && !this.rain.counts().loading) {
          this.setFrame((index + 1) % radar.frames.length);
          this.update();
        }
        this.play(true);
      }, 1000);
  }
  destroy() {
    this.play(false);
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resize.disconnect();
    this.removeGestures();
    document.removeEventListener("visibilitychange", this.visibility);
    this.base.destroy();
    this.rain.destroy();
    this.element.remove();
  }
}
function locationProtocol() {
  return window.location.protocol;
}
