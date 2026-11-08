document.getElementById("ack").addEventListener("click", () => {
  const note = document.getElementById("ack-note");
  note.hidden = false;
  note.textContent = "Acknowledged";
});
