const ELEMENTS = [
    { key: "qaq", name: "qaq", suit: "qaq", className: "gold", short: "qaq" },
    { key: "\u4e09", name: "\u4e09", suit: "\u4e09", className: "wood", short: "\u4e09" },
    { key: "\u6021", name: "\u6021", suit: "\u6021", className: "water", short: "\u6021" },
    { key: "\u65b9", name: "\u65b9", suit: "\u65b9", className: "fire", short: "\u65b9" },
    { key: "\u83f2", name: "\u83f2", suit: "\u83f2", className: "earth", short: "\u83f2" }
];

const STAR_SLOTS = [1, 1, 2, 1, 1, 1, 3, 1, 2, 1, 1, 1];
const ELEMENT_ASSETS = [
    { number: 1, image: "cimg/qaq.png" },
    { number: 2, image: "cimg/\u4e09.png" },
    { number: 3, image: "cimg/\u6021.png" },
    { number: 4, image: "cimg/\u65b9.png" },
    { number: 5, image: "cimg/\u83f2.png" }
];
const PROTECT_COSTS = { 1: 6, 2: 17, 3: 51, 4: 153, 5: 440, 6: 827 };
const MAX_STARS = 7;
const STORAGE_KEY = "chouche-wheel-state";

const state = {
    balance: 0,
    totalSpend: 0,
    tokens: 0,
    badges: 0,
    inventory: [],
    logs: [],
    roundActive: false,
    currentElement: null,
    currentStars: 0,
    currentPrize: null,
    protectFailCount: 0,
    spinning: false,
    selectedElementIndex: 0,
    selectedStarIndex: 0,
    starRotation: 0,
    elementRotation: 0
};

const ui = {};

window.addEventListener("DOMContentLoaded", () => {
    bindUi();
    buildWheel();
    bindEvents();
    updateAll();
    addLog("系统已就绪。点击“抽奖 (6)”开始新的一轮。");
});

function bindUi() {
    ui.starRing = document.getElementById("starRing");
    ui.elementOrbit = document.getElementById("elementOrbit");
    ui.balanceValue = document.getElementById("balanceValue");
    ui.tokenValue = document.getElementById("tokenValue");
    ui.badgeValue = document.getElementById("badgeValue");
    ui.resultLabel = document.getElementById("resultLabel");
    ui.elementValue = document.getElementById("elementValue");
    ui.starValue = document.getElementById("starValue");
    ui.protectCountValue = document.getElementById("protectCountValue");
    ui.roundStateValue = document.getElementById("roundStateValue");
    ui.costHint = document.getElementById("costHint");
    ui.tokenRewardValue = document.getElementById("tokenRewardValue");
    ui.tokenRewardText = document.getElementById("tokenRewardText");
    ui.prizeRewardValue = document.getElementById("prizeRewardValue");
    ui.prizeRewardText = document.getElementById("prizeRewardText");
    ui.starTrack = document.getElementById("starTrack");
    ui.wheelLegend = document.getElementById("wheelLegend");
    ui.starTrackText = document.getElementById("starTrackText");
    ui.rechargeButton = document.getElementById("rechargeButton");
    ui.drawButton = document.getElementById("drawButton");
    ui.normalAppendButton = document.getElementById("normalAppendButton");
    ui.protectedAppendButton = document.getElementById("protectedAppendButton");
    ui.claimTokenButton = document.getElementById("claimTokenButton");
    ui.claimPrizeButton = document.getElementById("claimPrizeButton");
    ui.openArchiveButton = document.getElementById("openArchiveButton");
    ui.totalSpendButton = document.getElementById("totalSpendButton");
    ui.resetButton = document.getElementById("resetButton");
}

function buildWheel() {
    ui.starRing.innerHTML = "";
    ui.elementOrbit.innerHTML = "";
    ui.starTrack.innerHTML = "";
    ui.wheelLegend.innerHTML = "";

    const starStep = 360 / STAR_SLOTS.length;
    STAR_SLOTS.forEach((stars, index) => {
        const slot = document.createElement("div");
        slot.className = "star-slot star" + stars;
        slot.dataset.label = String(stars);
        slot.style.transform = "rotate(" + index * starStep + "deg) translateY(calc(var(--wheel-size) * -0.43))";
        ui.starRing.appendChild(slot);
    });

    const elementStep = 360 / ELEMENTS.length;
    ELEMENTS.forEach((element, index) => {
        const asset = ELEMENT_ASSETS[index];
        const ball = document.createElement("div");
        ball.className = "element-ball " + element.className;
        ball.style.transform = "rotate(" + index * elementStep + "deg) translateY(calc(var(--wheel-size) * -0.16))";
        ball.innerHTML = '<img class="element-ball-image" src="' + asset.image + '" alt="' + element.name + '">';
        ui.elementOrbit.appendChild(ball);

        const legend = document.createElement("div");
        legend.className = "legend-item";
        legend.innerHTML = '<img class="legend-image" src="' + asset.image + '" alt="' + element.name + '"><span>' + element.name + "</span>";
        ui.wheelLegend.appendChild(legend);
    });

    for (let i = 0; i < MAX_STARS; i += 1) {
        const node = document.createElement("div");
        node.className = "track-node";
        ui.starTrack.appendChild(node);
    }
}

function bindEvents() {
    ui.rechargeButton.addEventListener("click", recharge);
    ui.drawButton.addEventListener("click", startDraw);
    ui.normalAppendButton.addEventListener("click", normalAppend);
    ui.protectedAppendButton.addEventListener("click", protectedAppend);
    ui.claimTokenButton.addEventListener("click", claimTokens);
    ui.claimPrizeButton.addEventListener("click", claimPrize);
    ui.openArchiveButton.addEventListener("click", openArchivePage);
    ui.resetButton.addEventListener("click", resetAllData);
}

function recharge() {
    const raw = window.prompt("请输入充值金额", "60");
    if (raw === null) {
        return;
    }

    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) {
        window.alert("请输入大于 0 的有效数字。");
        return;
    }

    state.balance += value;
    addLog("充值成功，余额 +" + value + "。");
    updateAll();
}

async function startDraw() {
    if (state.spinning) {
        return;
    }
    if (state.roundActive) {
        window.alert("当前轮次还有奖励未处理，请先领取令牌或奖励。");
        return;
    }
    if (state.balance < 6) {
        window.alert("余额不足，请先充值。");
        return;
    }

    state.balance -= 6;
    state.totalSpend += 6;
    state.protectFailCount = 0;

    const elementIndex = randomIndex(ELEMENTS.length);
    const starIndex = randomIndex(STAR_SLOTS.length);
    const stars = STAR_SLOTS[starIndex];

    addLog("开始抽奖，消耗 6 余额。");
    await spinWheel(elementIndex, starIndex);

    state.roundActive = true;
    state.currentElement = ELEMENTS[elementIndex];
    state.currentStars = stars;
    state.currentPrize = generatePrize(state.currentElement, state.currentStars);
    state.selectedElementIndex = elementIndex;
    state.selectedStarIndex = starIndex;

    addLog("抽奖结果：" + state.currentElement.name + " " + stars + " 星。");
    updateAll();
}

async function normalAppend() {
    if (state.spinning) {
        return;
    }
    if (!state.roundActive) {
        window.alert("请先开始一轮抽奖。");
        return;
    }
    if (state.currentStars >= MAX_STARS) {
        window.alert("已达到 7 星上限，请直接领奖。");
        return;
    }

    const elementIndex = randomIndex(ELEMENTS.length);
    const starIndex = randomIndex(STAR_SLOTS.length);
    const rolledElement = ELEMENTS[elementIndex];
    const rolledStars = STAR_SLOTS[starIndex];

    addLog("普通追加开始。");
    await spinWheel(elementIndex, starIndex);

    if (rolledElement.key === state.currentElement.key) {
        state.currentStars = Math.min(MAX_STARS, state.currentStars + rolledStars);
        state.currentPrize = generatePrize(state.currentElement, state.currentStars);
        state.protectFailCount = 0;
        addLog("普通追加成功，命中 " + rolledElement.name + "，星级 +" + rolledStars + "，当前 " + state.currentStars + " 星。");
    } else {
        state.protectFailCount = 0;
        addLog("普通追加失败，抽到 " + rolledElement.name + "，未命中当前主属性。");
        resolveNormalFailure();
    }

    state.selectedElementIndex = elementIndex;
    state.selectedStarIndex = starIndex;
    updateAll();
}

async function protectedAppend() {
    if (state.spinning) {
        return;
    }
    if (!state.roundActive) {
        window.alert("请先开始一轮抽奖。");
        return;
    }
    if (state.currentStars >= MAX_STARS) {
        window.alert("已达到 7 星上限，请直接领奖。");
        return;
    }

    const cost = PROTECT_COSTS[state.currentStars];
    if (!cost) {
        window.alert("当前星级无法继续保护追加。");
        return;
    }
    if (state.balance < cost) {
        window.alert("余额不足，无法进行保护追加。");
        return;
    }

    state.balance -= cost;
    state.totalSpend += cost;
    const forcedSuccess = state.protectFailCount >= 2;
    const starIndex = randomIndex(STAR_SLOTS.length);
    const elementIndex = forcedSuccess
        ? ELEMENTS.findIndex((item) => item.key === state.currentElement.key)
        : randomIndex(ELEMENTS.length);
    const rolledElement = ELEMENTS[elementIndex];
    const rolledStars = STAR_SLOTS[starIndex];

    addLog("保护追加开始，消耗 " + cost + " 余额。");
    await spinWheel(elementIndex, starIndex);

    if (rolledElement.key === state.currentElement.key) {
        state.currentStars = Math.min(MAX_STARS, state.currentStars + rolledStars);
        state.currentPrize = generatePrize(state.currentElement, state.currentStars);
        addLog("保护追加成功，星级 +" + rolledStars + "，当前 " + state.currentStars + " 星。");
        if (forcedSuccess) {
            addLog("本次触发保护保底，第 3 次保护追加必定成功。");
        }
        state.protectFailCount = 0;
    } else {
        state.protectFailCount += 1;
        addLog("保护追加未命中当前主属性，不降级。当前保护失败计数：" + state.protectFailCount + "。");
    }

    state.selectedElementIndex = elementIndex;
    state.selectedStarIndex = starIndex;
    updateAll();
}

function resolveNormalFailure() {
    const current = state.currentStars;

    if (current <= 1) {
        state.tokens += 2;
        addLog("1 星普通追加失败，直接结算五曜令牌 ×2。");
        resetRound("本轮已结束。");
        return;
    }

    const drop = Math.random() < 0.75 ? 1 : 2;
    addLog("失败判定：降 " + drop + " 星。");

    const settlement = getFailureSettlement(current, drop);
    if (settlement.mode === "settle") {
        state.tokens += settlement.tokens;
        addLog("本次失败直接结算五曜令牌 ×" + settlement.tokens + "。");
        resetRound("本轮已结束。");
        return;
    }

    state.currentStars = settlement.nextStars;
    state.currentPrize = generatePrize(state.currentElement, state.currentStars);
    addLog("星级回退至 " + state.currentStars + " 星，请选择领取令牌或奖励。");
}

function getFailureSettlement(currentStars, drop) {
    if (currentStars === 2) {
        return { mode: "settle", tokens: drop === 1 ? 12 : 4 };
    }
    if (currentStars === 3) {
        return { mode: "settle", tokens: drop === 1 ? 36 : 12 };
    }
    if (currentStars === 4) {
        return drop === 1 ? { mode: "continue", nextStars: 3 } : { mode: "settle", tokens: 36 };
    }
    if (currentStars === 5) {
        return drop === 1 ? { mode: "continue", nextStars: 4 } : { mode: "continue", nextStars: 3 };
    }
    if (currentStars === 6) {
        return drop === 1 ? { mode: "continue", nextStars: 5 } : { mode: "continue", nextStars: 4 };
    }
    if (currentStars >= 7) {
        return drop === 1 ? { mode: "continue", nextStars: 6 } : { mode: "continue", nextStars: 5 };
    }
    return { mode: "settle", tokens: 2 };
}

function claimTokens() {
    if (!state.roundActive) {
        window.alert("当前没有可领取的内容。");
        return;
    }

    const tokenReward = getTokenReward(state.currentStars);
    if (!tokenReward) {
        window.alert("当前轮次没有令牌奖励。");
        return;
    }

    state.tokens += tokenReward;
    addLog("领取令牌成功，获得五曜令牌 ×" + tokenReward + "。");
    resetRound("已领取令牌。");
    updateAll();
}

function claimPrize() {
    if (!state.roundActive) {
        window.alert("当前没有可领取的奖励。");
        return;
    }
    if (!state.currentPrize) {
        window.alert("当前星级还没有物品奖励，请领取令牌。");
        return;
    }

    if (state.currentStars === 6) {
        state.badges += 1;
        addLog("领取奖励成功，获得玛莎拉蒂兑换徽章 ×1。");
    } else if (state.currentStars >= 7) {
        state.badges += 3;
        addLog("领取奖励成功，获得玛莎拉蒂兑换徽章 ×3。");
    } else {
        state.inventory.unshift(state.currentPrize);
        addLog("领取奖励成功，获得：" + state.currentPrize + "。");
    }

    resetRound("已领取奖励。");
    updateAll();
}

function clearLogs() {
    state.logs = [];
    addLog("日志已清空。");
}

function openArchivePage() {
    persistArchiveState();
    window.open("Archive.html", "_blank", "noopener");
}

function resetAllData() {
    const confirmed = window.confirm("点击重抽会清空当前轮次、令牌、徽章、物品、日志和总消费，是否继续？");
    if (!confirmed) {
        return;
    }

    state.balance = 0;
    state.totalSpend = 0;
    state.tokens = 0;
    state.badges = 0;
    state.inventory = [];
    state.logs = [];
    state.roundActive = false;
    state.currentElement = null;
    state.currentStars = 0;
    state.currentPrize = null;
    state.protectFailCount = 0;
    state.spinning = false;
    state.selectedElementIndex = 0;
    state.selectedStarIndex = 0;
    state.starRotation = 0;
    state.elementRotation = 0;

    ui.starRing.style.transform = "rotate(0deg)";
    ui.elementOrbit.style.transform = "rotate(0deg)";
    clearHighlights();

    addLog("已执行重抽，全部数据已清空。");
    updateAll();
}

function resetRound(roundMessage) {
    state.roundActive = false;
    state.currentElement = null;
    state.currentStars = 0;
    state.currentPrize = null;
    state.protectFailCount = 0;
    if (roundMessage) {
        addLog(roundMessage);
    }
}

function getTokenReward(stars) {
    if (stars === 1) return 12;
    if (stars === 2) return 36;
    if (stars === 3) return 54;
    if (stars === 4) return 160;
    if (stars === 5) return 480;
    if (stars === 6) return 1440;
    if (stars >= 7) return 4320;
    return 0;
}

function generatePrize(element, stars) {
    if (!element || stars < 3) {
        return null;
    }

    if (stars === 3) {
        const roll = Math.random() * 10;
        if (roll > 6.6) return "平底锅-五爪金龙";
        if (roll > 3.3) return "至尊龙雀降落伞";
        return "背包挂件-" + element.suit;
    }

    if (stars === 4) {
        return Math.random() < 0.5 ? element.suit + "背包" : element.suit + "头盔";
    }

    if (stars === 5) {
        const roll = Math.random() * 10;
        if (roll > 6.6) return "M416-五爪金龙";
        if (roll > 3.3) return "至尊龙雀飞行服";
        return "套装-" + element.suit;
    }

    if (stars === 6) {
        return "玛莎拉蒂兑换徽章 ×1";
    }

    return "玛莎拉蒂兑换徽章 ×3";
}

function addLog(message) {
    const stamp = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    state.logs.unshift({ stamp, message });
    if (state.logs.length > 40) {
        state.logs.pop();
    }
    persistArchiveState();
}

function persistArchiveState() {
    const payload = {
        totalSpend: state.totalSpend,
        tokens: state.tokens,
        badges: state.badges,
        inventory: state.inventory,
        logs: state.logs
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

async function spinWheel(elementIndex, starIndex) {
    state.spinning = true;
    setButtonsDisabled(true);

    const starStep = 360 / STAR_SLOTS.length;
    const elementStep = 360 / ELEMENTS.length;
    state.starRotation += 1800 - starIndex * starStep;
    state.elementRotation += 2160 - elementIndex * elementStep;

    ui.starRing.style.transform = "rotate(" + state.starRotation + "deg)";
    ui.elementOrbit.style.transform = "rotate(" + state.elementRotation + "deg)";
    clearHighlights();

    await wait(2250);
    highlightStar(starIndex);
    await wait(1400);
    highlightElement(elementIndex);

    state.spinning = false;
    updateAll();
}

function clearHighlights() {
    ui.starRing.querySelectorAll(".star-slot").forEach((slot) => {
        slot.classList.remove("is-active");
    });
    ui.elementOrbit.querySelectorAll(".element-ball").forEach((ball) => {
        ball.classList.remove("is-active");
    });
}

function highlightStar(starIndex) {
    ui.starRing.querySelectorAll(".star-slot").forEach((slot, index) => {
        slot.classList.toggle("is-active", index === starIndex);
    });
}

function highlightElement(elementIndex) {
    ui.elementOrbit.querySelectorAll(".element-ball").forEach((ball, index) => {
        ball.classList.toggle("is-active", index === elementIndex);
    });
}

function updateAll() {
    ui.balanceValue.textContent = String(state.balance);
    ui.tokenValue.textContent = String(state.tokens);
    ui.badgeValue.textContent = String(state.badges);
    ui.totalSpendButton.textContent = "总消费 " + state.totalSpend;

    ui.rechargeButton.disabled = state.spinning;
    ui.openArchiveButton.disabled = state.spinning;
    ui.resetButton.disabled = state.spinning;

    ui.resultLabel.textContent = state.roundActive && state.currentElement
        ? state.currentElement.name + " · " + state.currentStars + " 星"
        : "等待开始";
    ui.elementValue.textContent = state.currentElement ? state.currentElement.name : "-";
    ui.starValue.textContent = state.currentStars + " 星";
    ui.protectCountValue.textContent = state.protectFailCount + " / 2";
    ui.roundStateValue.textContent = String(state.roundActive ? getTokenReward(state.currentStars) : 0);

    const tokenReward = state.roundActive ? getTokenReward(state.currentStars) : 0;
    ui.tokenRewardValue.textContent = tokenReward ? "×" + tokenReward : "0";
    ui.tokenRewardText.textContent = state.roundActive ? "当前星级可领取五曜令牌。" : "达到星级后可领取五曜令牌。";

    ui.prizeRewardValue.textContent = state.currentPrize || "NULL";
    ui.prizeRewardText.textContent = state.currentPrize ? "右侧奖励会随当前星级重新生成。" : "3 星后开始出现物品奖励，6 星及以上可领取徽章。";

    ui.starTrackText.textContent = state.currentStars + " / " + MAX_STARS + " 星";
    ui.starTrack.querySelectorAll(".track-node").forEach((node, index) => {
        node.classList.toggle("is-filled", index < state.currentStars);
    });

    ui.claimTokenButton.disabled = !state.roundActive;
    ui.claimPrizeButton.disabled = !state.roundActive || !state.currentPrize;
    ui.drawButton.disabled = state.spinning || state.roundActive;
    ui.normalAppendButton.disabled = state.spinning || !state.roundActive || state.currentStars >= MAX_STARS;

    const protectCost = PROTECT_COSTS[state.currentStars] || 0;
    ui.protectedAppendButton.disabled = state.spinning || !state.roundActive || state.currentStars >= MAX_STARS || !protectCost;
    ui.protectedAppendButton.textContent = protectCost ? "保护追加 (" + protectCost + ")" : "保护追加";
    ui.costHint.textContent = state.roundActive && protectCost
        ? "当前 " + state.currentStars + " 星，保护追加将消耗 " + protectCost + " 余额。连续失败两次后第 3 次必成。"
        : "保护追加费用会随当前星级变化。";
    persistArchiveState();
}

function setButtonsDisabled(disabled) {
    [
        ui.rechargeButton,
        ui.totalSpendButton,
        ui.resetButton,
        ui.drawButton,
        ui.normalAppendButton,
        ui.protectedAppendButton,
        ui.claimTokenButton,
        ui.claimPrizeButton,
        ui.openArchiveButton
    ].forEach((button) => {
        button.disabled = disabled;
    });
}

function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function randomIndex(length) {
    return Math.floor(Math.random() * length);
}
