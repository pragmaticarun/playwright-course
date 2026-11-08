const KEY = "bench-shelf";

function readShelf() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

const empty = document.getElementById("empty");
const table = document.getElementById("shelf");
const body = document.querySelector("#shelf tbody");
const items = readShelf();

if (items.length && table && body && empty) {
  empty.hidden = true;
  table.hidden = false;
  for (const item of items) {
    const row = document.createElement("tr");
    for (const value of [item.name, item.pin, String(item.qty)]) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    }
    body.appendChild(row);
  }
}
