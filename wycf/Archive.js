const STORAGE_KEY = "chouche-wheel-state";

const ui = {
    tokenValue: document.getElementById("tokenValue"),
    badgeValue: document.getElementById("badgeValue"),
    itemCountValue: document.getElementById("itemCountValue"),
    inventoryList: document.getElementById("inventoryList"),
    logList: document.getElementById("logList"),
    refreshButton: document.getElementById("refreshButton"),
    clearButton: document.getElementById("clearButton")
};

ui.refreshButton.addEventListener("click", render);
ui.clearButton.addEventListener("click", clearArchive);
window.addEventListener("storage", render);

render();

function readState() {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return { tokens: 0, badges: 0, inventory: [], logs: [] };
    }

    try {
        return JSON.parse(raw);
    } catch {
        return { tokens: 0, badges: 0, inventory: [], logs: [] };
    }
}

function render() {
    const data = readState();
    const inventory = Array.isArray(data.inventory) ? data.inventory : [];
    const logs = Array.isArray(data.logs) ? data.logs : [];

    ui.tokenValue.textContent = String(data.tokens || 0);
    ui.badgeValue.textContent = String(data.badges || 0);
    ui.itemCountValue.textContent = String(inventory.length);

    ui.inventoryList.innerHTML = "";
    if (inventory.length === 0) {
        const item = document.createElement("li");
        item.textContent = "暂无领取物品。";
        ui.inventoryList.appendChild(item);
    } else {
        inventory.forEach((entry) => {
            const item = document.createElement("li");
            item.textContent = entry;
            ui.inventoryList.appendChild(item);
        });
    }

    ui.logList.innerHTML = "";
    if (logs.length === 0) {
        const entry = document.createElement("div");
        entry.className = "log-entry";
        entry.textContent = "暂无日志记录。";
        ui.logList.appendChild(entry);
    } else {
        logs.forEach((log) => {
            const entry = document.createElement("div");
            entry.className = "log-entry";
            entry.innerHTML = "<strong>" + escapeHtml(log.stamp || "--:--:--") + "</strong><br>" + escapeHtml(log.message || "");
            ui.logList.appendChild(entry);
        });
    }
}

function clearArchive() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tokens: 0,
        badges: 0,
        inventory: [],
        logs: []
    }));
    render();
}

function escapeHtml(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
