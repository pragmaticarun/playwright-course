const KEY = "bench-shelf";
const summary = document.getElementById("shelf-summary");
const hidden = document.getElementById("items");

function readShelf() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

const items = readShelf();
if (hidden) {
  hidden.value = items.map((item) => `${item.id}:${item.qty}`).join(",");
}
if (summary) {
  summary.textContent = items.length
    ? `Ready to order: ${items.map((item) => `${item.name} × ${item.qty}`).join(", ")}.`
    : "The shelf is empty. Add a tool before placing an order.";
}
