// ui.js
window.MoraMachinaUI = class MoraMachinaUI {
  constructor() {
    this.messages = [];
    this.initialized = false;
    this.hideTimeout = null;
  }

  async init() {
    if (this.initialized) return;

    // Load messages from extension resources
    try {
      const url = chrome.runtime.getURL("messages.json");
      const response = await fetch(url);
      this.messages = await response.json();
    } catch (err) {
      console.warn("Mora Machina: Failed to load messages.", err);
      this.messages = ["Respira."]; // Fallback if fetch fails
    }

    this.render();
    
    // Listen to global entity state changes so the pet acts as ONE entity across all tabs
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.petState && changes.petState.newValue) {
        this.handleGlobalState(changes.petState.newValue);
      }
    });

    // On load, check if the pet was already saying something globally
    chrome.storage.local.get("petState", (data) => {
      if (data.petState) {
        this.handleGlobalState(data.petState);
      }
    });

    this.initialized = true;
  }

  render() {
    // Main container
    this.container = document.createElement("div");
    this.container.id = "mora-machina-root";

    // Speech bubble
    this.bubble = document.createElement("div");
    this.bubble.id = "mora-machina-bubble";

    // Entity placeholder
    this.entity = document.createElement("div");
    this.entity.id = "mora-machina-entity";

    // Synchronize animation rhythm perfectly across tabs using absolute time
    const startMs = Date.now();
    const cycleMs = 4000; // 4s animation
    const delay = -(startMs % cycleMs) + "ms";
    this.entity.style.animationDelay = delay;

    this.container.appendChild(this.bubble);
    this.container.appendChild(this.entity);
    document.body.appendChild(this.container);
  }

  handleGlobalState(state) {
    if (!state.isSpeaking || Date.now() >= state.expiresAt) {
      this.hideMessage();
      return;
    }

    // Still speaking
    this.bubble.innerText = state.message;
    this.bubble.classList.add("mora-machina-show");

    const remainingTime = state.expiresAt - Date.now();
    if (this.hideTimeout) clearTimeout(this.hideTimeout);

    this.hideTimeout = setTimeout(() => {
      this.bubble.classList.remove("mora-machina-show");
    }, remainingTime);
  }

  hideMessage() {
    this.bubble.classList.remove("mora-machina-show");
  }

  showIntervention() {
    if (!this.initialized) return;

    // Pick a random message
    const randomIndex = Math.floor(Math.random() * this.messages.length);
    const text = this.messages[randomIndex];
    
    // Save to global storage so ALL tabs display it immediately, including new ones
    chrome.storage.local.set({
      petState: {
        isSpeaking: true,
        message: text,
        expiresAt: Date.now() + 15000 // 15 seconds
      }
    });
  }
};
