// activity.js
window.MoraMachinaActivity = class MoraMachinaActivity {
  constructor(onInterventionCallback) {
    this.onIntervention = onInterventionCallback;
    
    // Configurable thresholds for easy testing
    // Default: 1 minute active -> Trigger intervention (testing mode)
    // Default: 5 minutes idle -> Reset accumulated time
    this.ACTIVE_THRESHOLD = 1 * 60 * 1000; 
    this.RESET_THRESHOLD = 5 * 60 * 1000;
    
    this.lastActivityTime = Date.now();
    this.accumulatedTime = 0;
    
    this.boundHandleActivity = this.handleActivity.bind(this);
    this.timerInterval = null;
  }

  async init() {
    // Load accumulated state from storage
    const data = await chrome.storage.local.get(["accumulatedTime", "lastActivityTime"]);
    
    const now = Date.now();
    if (data.lastActivityTime && data.accumulatedTime) {
      const timeSinceLastActivity = now - data.lastActivityTime;
      
      if (timeSinceLastActivity >= this.RESET_THRESHOLD) {
        this.accumulatedTime = 0;
      } else {
        this.accumulatedTime = data.accumulatedTime;
      }
    }

    // Sync state from other tabs
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local") {
        if (changes.accumulatedTime && changes.accumulatedTime.newValue !== undefined) {
          // Avoid self-triggering updates loop
          if (Math.abs(this.accumulatedTime - changes.accumulatedTime.newValue) > 2000) {
            this.accumulatedTime = changes.accumulatedTime.newValue;
          }
        }
        if (changes.lastActivityTime && changes.lastActivityTime.newValue !== undefined) {
          if (Math.abs(this.lastActivityTime - changes.lastActivityTime.newValue) > 2000) {
            this.lastActivityTime = changes.lastActivityTime.newValue;
          }
        }
      }
    });

    this.lastActivityTime = now;
    this.startTracking();
  }

  startTracking() {
    // Listen to mouse movement and key presses as signs of activity
    window.addEventListener("mousemove", this.boundHandleActivity, { passive: true });
    window.addEventListener("keydown", this.boundHandleActivity, { passive: true });

    // Ensure we save exact state when tab is hidden, and fetch latest when it becomes visible
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === 'hidden') {
        this.saveState();
      } else {
        chrome.storage.local.get(["accumulatedTime", "lastActivityTime"]).then(data => {
          if (data.accumulatedTime !== undefined) this.accumulatedTime = data.accumulatedTime;
          if (data.lastActivityTime !== undefined) this.lastActivityTime = data.lastActivityTime;
        });
      }
    });

    // Validate state every second
    this.timerInterval = setInterval(() => this.tick(), 1000);
  }

  handleActivity() {
    if (document.visibilityState === 'visible') {
      this.lastActivityTime = Date.now();
    }
  }

  tick() {
    // CRITICAL: Only accumulate time if this tab is the one currently visible.
    // This prevents 10 open tabs from adding 10 seconds of time every 1 real second!
    if (document.visibilityState !== 'visible') {
      return;
    }

    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivityTime;

    if (timeSinceLastActivity >= this.RESET_THRESHOLD) {
      // User is idle enough to reset the accumulation
      if (this.accumulatedTime > 0) {
        this.accumulatedTime = 0;
        this.saveState();
      }
      return;
    }

    // Accumulate time (adding 1 second)
    this.accumulatedTime += 1000;

    // Check if intervention threshold is reached
    if (this.accumulatedTime >= this.ACTIVE_THRESHOLD) {
      this.triggerIntervention();
      // Reset accumulated time after intervention
      this.accumulatedTime = 0;
      this.saveState();
    } else if (this.accumulatedTime % 5000 === 0) {
      // Save roughly every 5 seconds to reduce storage writes, but maintain state across tabs
      this.saveState();
    }
  }

  saveState() {
    chrome.storage.local.set({
      accumulatedTime: this.accumulatedTime,
      lastActivityTime: this.lastActivityTime
    });
  }

  triggerIntervention() {
    if (this.onIntervention) {
      this.onIntervention();
    }
  }
};
