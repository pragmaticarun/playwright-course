const KEY = "bench-shelf";

function readShelf() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeShelf(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

document.querySelectorAll("[data-kind]").forEach((button) => {
  button.addEventListener("click", () => {
    const kind = button.getAttribute("data-kind");
    document.querySelectorAll("[data-kind]").forEach((other) => {
      other.setAttribute("aria-pressed", String(other === button));
    });
    document.querySelectorAll("[data-card]").forEach((card) => {
      const show = kind === "all" || card.getAttribute("data-card") === kind;
      card.hidden = !show;
    });
  });
});

document.querySelectorAll("[data-add]").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.getAttribute("data-add");
    const name = button.getAttribute("data-name") || id;
    const pin = button.getAttribute("data-pin") || "";
    const items = readShelf();
    const found = items.find((item) => item.id === id);
    if (found) found.qty += 1;
    else items.push({ id, name, pin, qty: 1 });
    writeShelf(items);
    const status = document.getElementById("shelf-status");
    if (status) status.textContent = `Added ${name} to the shelf`;
  });
});
