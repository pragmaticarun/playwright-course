const result = document.getElementById("result");

document.getElementById("alert-btn").addEventListener("click", () => {
  window.alert("Shelf is locked");
  result.textContent = "Alert closed";
});

document.getElementById("confirm-btn").addEventListener("click", () => {
  const ok = window.confirm("Discard the shelf?");
  result.textContent = ok ? "Discarded" : "Kept";
});

document.getElementById("prompt-btn").addEventListener("click", () => {
  const name = window.prompt("Pin name", "rustc");
  result.textContent = name ? `Named ${name}` : "Unnamed";
});
