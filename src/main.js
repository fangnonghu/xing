import "./style.css";

const BASE_DURATIONS = {
  ".surface": 8,
  ".clouds": 5.6,
  ".meridians": 4,
  ".stars circle": 2.8,
  ".axis": 1.8,
};

const earth = document.getElementById("earth");
const speedInput = document.getElementById("speed");
const speedValue = document.getElementById("speedValue");
const toggleBtn = document.getElementById("toggle");
const status = document.getElementById("status");

let running = true;

function setStatus(message, state) {
  status.textContent = message;
  if (state) {
    status.dataset.state = state;
  } else {
    delete status.dataset.state;
  }
}

function buildControlCss(speed, paused) {
  const rules = Object.entries(BASE_DURATIONS).map(([selector, base]) => {
    const duration = (base / speed).toFixed(3);
    const playState = paused ? "paused" : "running";
    return `${selector} { animation-duration: ${duration}s !important; animation-play-state: ${playState} !important; }`;
  });
  return rules.join("\n");
}

function applyControls(svgDoc) {
  const speed = Number(speedInput.value);
  let styleEl = svgDoc.getElementById("__controls");
  if (!styleEl) {
    styleEl = svgDoc.createElementNS("http://www.w3.org/2000/svg", "style");
    styleEl.id = "__controls";
    svgDoc.documentElement.appendChild(styleEl);
  }
  styleEl.textContent = buildControlCss(speed, !running);
  speedValue.textContent = `${speed.toFixed(2)}×`;
}

function getSvgDoc() {
  return earth.contentDocument;
}

function wireControls() {
  const svgDoc = getSvgDoc();
  if (!svgDoc || !svgDoc.documentElement) {
    setStatus("Could not read the SVG document.", "error");
    return;
  }

  applyControls(svgDoc);
  setStatus("Animation running — pure SVG + CSS.", "ready");

  speedInput.addEventListener("input", () => applyControls(getSvgDoc()));

  toggleBtn.addEventListener("click", () => {
    running = !running;
    toggleBtn.textContent = running ? "Pause" : "Play";
    toggleBtn.setAttribute("aria-pressed", String(running));
    applyControls(getSvgDoc());
  });
}

earth.addEventListener("load", wireControls);
earth.addEventListener("error", () =>
  setStatus("Failed to load earth-rotation.svg.", "error"),
);

if (earth.contentDocument && earth.contentDocument.readyState === "complete") {
  wireControls();
}
