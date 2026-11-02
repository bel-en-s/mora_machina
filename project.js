document.addEventListener("DOMContentLoaded", () => {
  const settingsForm = document.getElementById("settings-form");
  const intervalInput = document.getElementById("interval-input");
  const settingsStatus = document.getElementById("settings-status");

  const messagesList = document.getElementById("messages-list");
  const addBtn = document.getElementById("add-message-btn");
  const saveBtn = document.getElementById("save-messages-btn");
  const messagesStatus = document.getElementById("messages-status");

  let messages = [];

  const endpoint = window.MORA_CONFIG && window.MORA_CONFIG.messagesEndpoint;

  const fetchDefaults = async () => {
    try {
      const res = await fetch(chrome.runtime.getURL("messages.json"));
      return await res.json();
    } catch (err) {
      return ["Respira."];
    }
  };

  const fetchGlobal = async () => {
    if (!endpoint) return null;
    try {
      const res = await fetch(endpoint);
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && data.length) return data;
    } catch (err) {
      console.warn("No se pudo cargar el endpoint global.", err);
    }
    return null;
  };

  const renderMessages = () => {
    messagesList.innerHTML = "";
    messages.forEach((msg, i) => {
      const li = document.createElement("li");
      li.className = "message-item";

      const ta = document.createElement("textarea");
      ta.className = "message-edit";
      ta.value = msg;
      li.appendChild(ta);

      const del = document.createElement("button");
      del.className = "delete-btn";
      del.type = "button";
      del.textContent = "Eliminar";
      del.addEventListener("click", () => {
        messages.splice(i, 1);
        renderMessages();
      });
      li.appendChild(del);

      messagesList.appendChild(li);
    });
  };

  const loadMessages = async () => {
    const global = await fetchGlobal();
    if (global) {
      messages = [...global];
    } else {
      const defaults = await fetchDefaults();
      const data = await chrome.storage.local.get(["messages", "customMessages"]);
      messages = (data.messages && data.messages.length)
        ? [...data.messages]
        : [...defaults, ...(data.customMessages || [])];
    }
    renderMessages();
  };

  const loadSettings = () => {
    chrome.storage.local.get(["settings"], (data) => {
      const s = data.settings || {};
      intervalInput.value = s.intervalMinutes != null ? s.intervalMinutes : 1;
    });
  };

  settingsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const minutes = parseFloat(intervalInput.value);
    if (isNaN(minutes) || minutes <= 0) {
      settingsStatus.textContent = "Ingresá un valor válido.";
      return;
    }
    chrome.storage.local.set({ settings: { intervalMinutes: minutes } }, () => {
      settingsStatus.textContent = "Guardado.";
      setTimeout(() => { settingsStatus.textContent = ""; }, 2000);
    });
  });

  addBtn.addEventListener("click", () => {
    messages.push("");
    renderMessages();
  });

  saveBtn.addEventListener("click", async () => {
    const texts = Array.from(document.querySelectorAll(".message-edit"))
      .map((ta) => ta.value.trim())
      .filter((t) => t.length > 0);
    messages = texts;

    chrome.storage.local.set({ messages });

    let savedGlobally = false;
    if (endpoint) {
      try {
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: JSON.stringify(messages)
        });
        savedGlobally = true;
      } catch (err) {
        console.warn("No se pudo guardar en el endpoint global.", err);
      }
    }

    renderMessages();
    messagesStatus.textContent = savedGlobally
      ? "Guardado globalmente."
      : "Guardado localmente (sin conexión).";
    setTimeout(() => { messagesStatus.textContent = ""; }, 2500);
  });

  loadSettings();
  loadMessages();
});
