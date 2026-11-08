const status = document.querySelector("[role='status']");

fetch("/api/status")
  .then((response) => response.json())
  .then((data) => {
    status.textContent = data.ok ? "bench ok" : data.message;
  })
  .catch(() => {
    status.textContent = "status request failed";
  });
