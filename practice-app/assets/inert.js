document.getElementById("open-panel").addEventListener("click", () => {
  document.getElementById("locked").removeAttribute("inert");
  document.getElementById("panel-state").textContent = "Panel open";
});

document.getElementById("save-pin").addEventListener("click", () => {
  document.getElementById("panel-state").textContent = "Pin saved";
});
