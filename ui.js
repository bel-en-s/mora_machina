// ui.js
window.MoraMachinaUI = class MoraMachinaUI {
  constructor() {
    this.messages = [];
    this.initialized = false;
    this.hideTimeout = null;
    this.idleSrc = null;
    this.talkingSrc = null;
  }

  async init() {
    if (this.initialized) return;

    // Load messages from extension resources
    try {
      const url = chrome.runtime.getURL("messages.json");
      const response = await fetch(url);
      this.defaultMessages = await response.json();
    } catch (err) {
      console.warn("Mora Machina: Failed to load messages.", err);
      this.defaultMessages = ["Respira."]; // Fallback if fetch fails
    }

    const data = await chrome.storage.local.get(["messages"]);
    this.messages = (data.messages && data.messages.length)
      ? data.messages
      : this.defaultMessages;

    // Try to fetch the global message list from the endpoint (with local fallback)
    const global = await this.fetchGlobalMessages();
    if (global) {
      this.messages = global;
      chrome.storage.local.set({ messages: global });
    }

    this.render();

    // Listen to global entity state changes so the pet acts as ONE entity across all tabs
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local") {
        if (changes.petState && changes.petState.newValue) {
          this.handleGlobalState(changes.petState.newValue);
        }
        if (changes.messages) {
          this.messages = changes.messages.newValue || this.defaultMessages;
        }
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

  async fetchGlobalMessages() {
    const endpoint = window.MORA_CONFIG && window.MORA_CONFIG.messagesEndpoint;
    if (!endpoint) return null;
    try {
      const res = await fetch(endpoint);
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data.length) return data;
    } catch (err) {
      console.warn("Mora Machina: No se pudo cargar mensajes globales.", err);
    }
    return null;
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

    // Angel GIF (idle by default, switches to talking when speaking)
    this.angel = document.createElement("img");
    this.angel.id = "mora-machina-angel";
    this.angel.draggable = false;
    this.angel.alt = "";

    this.idleSrc = chrome.runtime.getURL("assets/idle.gif");
    this.talkingSrc = chrome.runtime.getURL("assets/talking.gif");
    this.angel.src = this.idleSrc;

    this.entity.appendChild(this.angel);

    this.container.appendChild(this.bubble);
    this.container.appendChild(this.entity);
    document.body.appendChild(this.container);

    this.setupDragging();
  }

  setSpeaking(isSpeaking) {
    const src = isSpeaking ? this.talkingSrc : this.idleSrc;
    if (this.angel.getAttribute("src") !== src) {
      this.angel.src = src;
    }
  }

  setupDragging() {
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;
    let hasDragged = false;

    this.entity.style.cursor = "grab";

    this.entity.addEventListener('mousedown', (e) => {
      isDragging = true;
      hasDragged = false;
      this.entity.style.cursor = "grabbing";

      startX = e.clientX;
      startY = e.clientY;

      const rect = this.container.getBoundingClientRect();

      // Override CSS bottom/right to allow free positioning
      this.container.style.bottom = 'auto';
      this.container.style.right = 'auto';

      initialLeft = rect.left;
      initialTop = rect.top;

      this.container.style.left = initialLeft + 'px';
      this.container.style.top = initialTop + 'px';

      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // Determine if it was an actual drag or just a click
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasDragged = true;
      }

      this.container.style.left = (initialLeft + dx) + 'px';
      this.container.style.top = (initialTop + dy) + 'px';
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      this.entity.style.cursor = "grab";
    });

    this.entity.addEventListener('mouseup', (e) => {
      if (!hasDragged) {
        window.open(chrome.runtime.getURL("project.html"), "_blank");
      }
    });
  }

  handleGlobalState(state) {
    const speaking = state.isSpeaking && Date.now() < state.expiresAt;
    if (!speaking) {
      this.setSpeaking(false);
      this.hideMessage();
      return;
    }

    // Still speaking
    this.setSpeaking(true);
    this.bubble.innerText = state.message;
    this.bubble.classList.add("mora-machina-show");

    const remainingTime = state.expiresAt - Date.now();
    if (this.hideTimeout) clearTimeout(this.hideTimeout);

    this.hideTimeout = setTimeout(() => {
      this.bubble.classList.remove("mora-machina-show");
      this.setSpeaking(false);
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
        expiresAt: Date.now() + 10000 // 10 seconds
      }
    });
  }
};
