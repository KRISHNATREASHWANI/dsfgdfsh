const overlay = document.getElementById("overlay");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
const logList = document.getElementById("logList");

document.querySelectorAll(".node").forEach((btn) => {
  btn.addEventListener("click", () => openModal(btn.dataset.action));
});

modalClose.addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

function openModal(action) {
  modalBody.innerHTML = templates[action]();
  overlay.classList.add("open");
  bindHandlers(action);
  const firstInput = modalBody.querySelector("input, textarea");
  if (firstInput) firstInput.focus();
}

function closeModal() {
  overlay.classList.remove("open");
  modalBody.innerHTML = "";
}

function addLogEntry(message, ok) {
  const empty = logList.querySelector(".log-empty");
  if (empty) empty.remove();

  const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const entry = document.createElement("div");
  entry.className = `log-entry ${ok ? "ok" : "err"}`;
  entry.textContent = `[${ts}] ${ok ? "✔" : "✘"} ${message}`;
  logList.prepend(entry);

  while (logList.children.length > 8) {
    logList.removeChild(logList.lastChild);
  }
}

const templates = {
  create: () => `
    <h2>Create a file</h2>
    <p class="sub">Add a new entry to the vault.</p>
    <div class="field">
      <label for="create-name">File name</label>
      <input id="create-name" type="text" placeholder="notes.txt" />
    </div>
    <div class="field">
      <label for="create-content">Content</label>
      <textarea id="create-content" rows="4" placeholder="Type the starting content..."></textarea>
    </div>
    <button class="btn" id="create-submit">Create file</button>
  `,
  read: () => `
    <h2>Read a file</h2>
    <p class="sub">Open an existing entry.</p>
    <div class="field">
      <label for="read-name">File name</label>
      <input id="read-name" type="text" placeholder="notes.txt" />
    </div>
    <button class="btn" id="read-submit">Read file</button>
    <div class="read-output" id="read-output" style="display:none;"></div>
  `,
  update: () => `
    <h2>Update a file</h2>
    <p class="sub">Rename, append to, or overwrite an entry.</p>
    <div class="field">
      <label for="update-name">File name</label>
      <input id="update-name" type="text" placeholder="notes.txt" />
    </div>
    <div class="mode-row">
      <label><input type="radio" name="mode" value="rename" checked /> Rename</label>
      <label><input type="radio" name="mode" value="append" /> Append</label>
      <label><input type="radio" name="mode" value="overwrite" /> Overwrite</label>
    </div>
    <div class="field">
      <label for="update-value" id="update-value-label">New file name</label>
      <input id="update-value" type="text" />
    </div>
    <button class="btn" id="update-submit">Apply update</button>
  `,
  delete: () => `
    <h2>Delete a file</h2>
    <p class="sub">This removes the entry permanently.</p>
    <div class="field">
      <label for="delete-name">File name</label>
      <input id="delete-name" type="text" placeholder="notes.txt" />
    </div>
    <div class="confirm-row">
      <input type="checkbox" id="delete-confirm" />
      <label for="delete-confirm">I understand this cannot be undone</label>
    </div>
    <button class="btn danger" id="delete-submit" disabled>Delete file</button>
  `,
};

function bindHandlers(action) {
  if (action === "create") {
    document.getElementById("create-submit").addEventListener("click", async () => {
      const name = document.getElementById("create-name").value.trim();
      const content = document.getElementById("create-content").value;
      if (!name) return;
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content }),
      });
      const data = await res.json();
      addLogEntry(data.message, data.ok);
      if (data.ok) closeModal();
    });
  }

  if (action === "read") {
    document.getElementById("read-submit").addEventListener("click", async () => {
      const name = document.getElementById("read-name").value.trim();
      if (!name) return;
      const res = await fetch(`/api/files/${encodeURIComponent(name)}`);
      const data = await res.json();
      const output = document.getElementById("read-output");
      if (data.ok) {
        output.style.display = "block";
        output.textContent = data.content || "(empty file)";
        addLogEntry(`"${name}" loaded.`, true);
      } else {
        output.style.display = "none";
        addLogEntry(data.message, false);
      }
    });
  }

  if (action === "update") {
    const valueLabel = document.getElementById("update-value-label");
    const valueInput = document.getElementById("update-value");
    document.querySelectorAll('input[name="mode"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        valueLabel.textContent = radio.value === "rename" ? "New file name" : "Content";
      });
    });

    document.getElementById("update-submit").addEventListener("click", async () => {
      const name = document.getElementById("update-name").value.trim();
      const mode = document.querySelector('input[name="mode"]:checked').value;
      const value = valueInput.value;
      if (!name) return;
      const res = await fetch(`/api/files/${encodeURIComponent(name)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, value }),
      });
      const data = await res.json();
      addLogEntry(data.message, data.ok);
      if (data.ok) closeModal();
    });
  }

  if (action === "delete") {
    const confirmBox = document.getElementById("delete-confirm");
    const submitBtn = document.getElementById("delete-submit");
    confirmBox.addEventListener("change", () => {
      submitBtn.disabled = !confirmBox.checked;
    });

    submitBtn.addEventListener("click", async () => {
      const name = document.getElementById("delete-name").value.trim();
      if (!name) return;
      const res = await fetch(`/api/files/${encodeURIComponent(name)}`, { method: "DELETE" });
      const data = await res.json();
      addLogEntry(data.message, data.ok);
      if (data.ok) closeModal();
    });
  }
}
