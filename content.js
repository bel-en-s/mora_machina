// content.js
// Prevent multiple injections
if (!window.moraMachinaInitialized) {
  window.moraMachinaInitialized = true;

  console.log("Mora Machina: Despertando entidad observadora...");

  const ui = new window.MoraMachinaUI();
  
  ui.init().then(() => {
    const activity = new window.MoraMachinaActivity(() => {
      // Triggered when threshold is met
      ui.showIntervention();
    });
    
    activity.init();
  });
}
