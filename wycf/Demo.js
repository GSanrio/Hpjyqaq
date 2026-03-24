const ELEMENTS = [
    { key: "qaq", name: "QAQ", suit: "qaq", className: "gold" },
    { key: "san", name: "三", suit: "san", className: "wood" },
    { key: "yi", name: "怡", suit: "yi", className: "water" },
    { key: "fang", name: "方", suit: "fang", className: "fire" },
    { key: "fei", name: "菲", suit: "fei", className: "earth" }
];

const STAR_SLOTS = [1, 1, 2, 1, 1, 1, 3, 1, 2, 1, 1, 1];
const ELEMENT_ASSETS = [
    { image: "cimg/qaq.png" },
    { image: "cimg/san.png" },
    { image: "cimg/yi.png" },
    { image: "cimg/fang.png" },
    { image: "cimg/fei.png" }
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
    roundNumber: 0,
    roundActive: false,
    roundLocked: false,
    currentElement: null,
    currentElementIndex: -1,
    currentStars: 0,
    currentPrize: null,
    pendingTokenReward: 0,
    protectFailCount: 0,
    spinning: false,
    skipAnimation: false,
    selectedElementIndex: 0,
    selectedStarIndex: 0,
    starRotation: 0,
    elementRotation: 0,
    claimSelection: ""
};

const ui = {};

function setText(node, value) {
    if (node) node.textContent = value;
}

window.addEventListener("DOMContentLoaded", () => {
    bindUi();
    buildWheel();
    bindEvents();
    updateAll();
    addLog("系统已就绪，点击“抽奖 (6)”开始。")
});

function bindUi() {
    ui.starRing = document.getElementById("starRing");
    ui.elementOrbit = document.getElementById("elementOrbit");
    ui.balanceValue = document.getElementById("balanceValue");
    ui.tokenValue = document.getElementById("tokenValue");
    ui.badgeValue = document.getElementById("badgeValue");
    ui.resultLabel = document.getElementById("resultLabel");
    ui.costHint = document.getElementById("costHint");
    ui.tokenRewardValue = document.getElementById("tokenRewardValue");
    ui.tokenRewardText = document.getElementById("tokenRewardText");
    ui.prizeRewardValue = document.getElementById("prizeRewardValue");
    ui.prizeRewardText = document.getElementById("prizeRewardText");
    ui.rewardHint = document.getElementById("rewardHint");
    ui.starTrack = document.getElementById("starTrack");
    ui.wheelLegend = document.getElementById("wheelLegend");
    ui.starTrackText = document.getElementById("starTrackText");
    ui.rechargeButton = document.getElementById("rechargeButton");
    ui.drawButton = document.getElementById("drawButton");
    ui.normalAppendButton = document.getElementById("normalAppendButton");
    ui.protectedAppendButton = document.getElementById("protectedAppendButton");
    ui.openClaimDialogButton = document.getElementById("openClaimDialogButton");
    ui.openArchiveButton = document.getElementById("openArchiveButton");
    ui.totalSpendButton = document.getElementById("totalSpendButton");
    ui.resetButton = document.getElementById("resetButton");
    ui.skipAnimationToggle = document.getElementById("skipAnimationToggle");
    ui.claimModal = document.getElementById("claimModal");
    ui.claimModalBackdrop = document.getElementById("claimModalBackdrop");
    ui.claimModalSummary = document.getElementById("claimModalSummary");
    ui.claimModalList = document.getElementById("claimModalList");
    ui.confirmClaimDialogButton = document.getElementById("confirmClaimDialogButton");
    ui.closeClaimDialogButton = document.getElementById("closeClaimDialogButton");
}

function buildWheel() {
    ui.starRing.innerHTML = "";
    ui.elementOrbit.innerHTML = "";
    ui.starTrack.innerHTML = "";
    if (ui.wheelLegend) ui.wheelLegend.innerHTML = "";

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

        if (ui.wheelLegend) {
            const legend = document.createElement("div");
            legend.className = "legend-item";
            legend.innerHTML = '<img class="legend-image" src="' + asset.image + '" alt="' + element.name + '"><span>' + element.name + "</span>";
            ui.wheelLegend.appendChild(legend);
        }
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
    ui.openClaimDialogButton.addEventListener("click", openClaimDialog);
    ui.openArchiveButton.addEventListener("click", openArchivePage);
    ui.resetButton.addEventListener("click", resetAllData);
    ui.confirmClaimDialogButton.addEventListener("click", confirmClaimDialog);
    ui.closeClaimDialogButton.addEventListener("click", closeClaimDialog);
    ui.claimModalBackdrop.addEventListener("click", closeClaimDialog);
    ui.claimModalList.addEventListener("click", handleClaimOptionClick);
    if (ui.skipAnimationToggle) {
        ui.skipAnimationToggle.addEventListener("change", () => {
            state.skipAnimation = ui.skipAnimationToggle.checked;
        });
    }
}

function recharge() {
    const raw = window.prompt("请输入充值金额", "60");
    if (raw === null) return;
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) {
        window.alert("请输入大于 0 的数字。");
        return;
    }
    state.balance += value;
    addLog("充值成功，余额 +" + value);
    updateAll();
}

async function startDraw() {
    if (state.spinning) return;
    if (state.roundActive) {
        window.alert("当前轮次未结算，请先领取奖励。");
        return;
    }
    if (state.balance < 6) {
        window.alert("余额不足，请先充值。");
        return;
    }

    state.balance -= 6;
    state.totalSpend += 6;
    state.roundNumber += 1;
    state.roundActive = true;
    state.roundLocked = false;
    state.pendingTokenReward = 0;
    state.protectFailCount = 0;

    const elementIndex = randomIndex(ELEMENTS.length);
    const starIndex = randomIndex(STAR_SLOTS.length);
    const stars = STAR_SLOTS[starIndex];

    addLog("第 " + state.roundNumber + " 轮开始。");
    await spinWheel(elementIndex, starIndex);

    state.currentElement = ELEMENTS[elementIndex];
    state.currentElementIndex = elementIndex;
    state.currentStars = stars;
    state.currentPrize = generatePrize(state.currentElement, state.currentStars);
    state.selectedElementIndex = elementIndex;
    state.selectedStarIndex = starIndex;

    addLog("抽奖结果：" + state.currentElement.name + " " + stars + " 星。");
    updateAll();
}

async function normalAppend() {
    if (state.spinning) return;
    if (!state.roundActive) {
        window.alert("请先开始一轮抽奖。");
        return;
    }
    if (state.roundLocked) {
        window.alert("本轮已锁定，请先领取奖励。");
        return;
    }
    if (state.currentStars >= MAX_STARS) {
        window.alert("已达到星级上限。");
        return;
    }

    const elementIndex = randomIndex(ELEMENTS.length);
    const starIndex = randomIndex(STAR_SLOTS.length);
    const rolledElement = ELEMENTS[elementIndex];
    const rolledStars = STAR_SLOTS[starIndex];

    await spinWheel(elementIndex, starIndex);

    state.selectedElementIndex = elementIndex;
    state.selectedStarIndex = starIndex;

    if (rolledElement.key === state.currentElement.key) {
        state.currentStars = Math.min(MAX_STARS, state.currentStars + rolledStars);
        state.currentPrize = generatePrize(state.currentElement, state.currentStars);
        state.pendingTokenReward = 0;
        state.protectFailCount = 0;
        addLog("普通追加成功，星级 +" + rolledStars + "。");
    } else {
        state.protectFailCount = 0;
        addLog("普通追加失败。");
        resolveNormalFailure();
    }

    updateAll();
}

async function protectedAppend() {
    if (state.spinning) return;
    if (!state.roundActive) {
        window.alert("请先开始一轮抽奖。");
        return;
    }
    if (state.roundLocked) {
        window.alert("本轮已锁定，请先领取奖励。");
        return;
    }
    if (state.currentStars >= MAX_STARS) {
        window.alert("已达到星级上限。");
        return;
    }

    const cost = PROTECT_COSTS[state.currentStars];
    if (!cost) {
        window.alert("当前星级无法进行保护追加。");
        return;
    }
    if (state.balance < cost) {
        window.alert("余额不足，请先充值。");
        return;
    }

    state.balance -= cost;
    state.totalSpend += cost;

    const forcedSuccess = state.protectFailCount >= 2;
    const starIndex = randomIndex(STAR_SLOTS.length);
    const elementIndex = forcedSuccess
        ? (state.currentElementIndex >= 0 ? state.currentElementIndex : state.selectedElementIndex)
        : randomIndex(ELEMENTS.length);
    const rolledElement = ELEMENTS[elementIndex];
    const rolledStars = STAR_SLOTS[starIndex];

    await spinWheel(elementIndex, starIndex);

    state.selectedElementIndex = elementIndex;
    state.selectedStarIndex = starIndex;

    if (rolledElement.key === state.currentElement.key) {
        state.currentStars = Math.min(MAX_STARS, state.currentStars + rolledStars);
        state.currentPrize = generatePrize(state.currentElement, state.currentStars);
        state.pendingTokenReward = 0;
        state.protectFailCount = 0;
        addLog("保护追加成功，星级 +" + rolledStars + "。");
    } else {
        state.protectFailCount += 1;
        addLog("保护追加失败，累计失败 " + state.protectFailCount + " 次。");
    }

    updateAll();
}

function resolveNormalFailure() {
    const current = state.currentStars;

    if (current <= 1) {
        state.pendingTokenReward = 2;
        state.currentPrize = null;
        state.roundLocked = true;
        return;
    }

    const drop = Math.random() < 0.75 ? 1 : 2;
    const settlement = getFailureSettlement(current, drop);
    state.roundLocked = true;

    if (settlement.mode === "settle") {
        state.pendingTokenReward = settlement.tokens;
        state.currentPrize = null;
        return;
    }

    state.currentStars = settlement.nextStars;
    state.currentPrize = generatePrize(state.currentElement, state.currentStars);
    state.pendingTokenReward = getTokenReward(state.currentStars);
}

function getFailureSettlement(currentStars, drop) {
    if (currentStars === 2) return { mode: "settle", tokens: drop === 1 ? 12 : 4 };
    if (currentStars === 3) return { mode: "settle", tokens: drop === 1 ? 36 : 12 };
    if (currentStars === 4) return drop === 1 ? { mode: "continue", nextStars: 3 } : { mode: "settle", tokens: 36 };
    if (currentStars === 5) return drop === 1 ? { mode: "continue", nextStars: 4 } : { mode: "continue", nextStars: 3 };
    if (currentStars === 6) return drop === 1 ? { mode: "continue", nextStars: 5 } : { mode: "continue", nextStars: 4 };
    if (currentStars >= 7) return drop === 1 ? { mode: "continue", nextStars: 6 } : { mode: "continue", nextStars: 5 };
    return { mode: "settle", tokens: 2 };
}

function claimTokens() {
    const tokenReward = getCurrentTokenReward();
    if (!state.roundActive || !tokenReward) {
        window.alert("当前没有可领取的令牌奖励。");
        return;
    }
    state.tokens += tokenReward;
    addLog("领取令牌成功，获得 x" + tokenReward + "。");
    resetRound("本轮已完成。");
    updateAll();
}

function claimPrize() {
    if (!state.roundActive || !state.currentPrize) {
        window.alert("当前没有可领取的物品或徽章奖励。");
        return;
    }

    if (state.currentStars === 6) {
        state.badges += 1;
        addLog("领取徽章成功，获得 x1。");
    } else if (state.currentStars >= 7) {
        state.badges += 3;
        addLog("领取徽章成功，获得 x3。");
    } else {
        state.inventory.unshift(state.currentPrize);
        addLog("领取物品成功：" + state.currentPrize);
    }

    resetRound("本轮已完成。");
    updateAll();
}

function openClaimDialog() {
    const rewards = getDialogRewards();
    if (!rewards.tokenAmount && !rewards.prizeAvailable) {
        window.alert("当前没有可领取奖励。");
        return;
    }
    state.claimSelection = rewards.tokenAmount ? "token" : "prize";
    renderClaimDialog(rewards);
    ui.claimModal.hidden = false;
}

function closeClaimDialog() {
    ui.claimModal.hidden = true;
    state.claimSelection = "";
}

function getBadgeRewardAmount() {
    if (!state.roundActive || !state.currentPrize) return 0;
    if (state.currentStars === 6) return 1;
    if (state.currentStars >= 7) return 3;
    return 0;
}

function getDialogRewards() {
    const badgeAmount = getBadgeRewardAmount();
    return {
        tokenAmount: getCurrentTokenReward(),
        badgeAmount,
        prizeAvailable: !!state.roundActive && !!state.currentPrize,
        prizeLabel: badgeAmount ? ("徽章 x" + badgeAmount) : (state.currentPrize || "暂无物品"),
        prizeDescription: badgeAmount ? "本次将领取徽章奖励。" : "本次将领取当前物品奖励。"
    };
}

function renderClaimDialog(rewards) {
    const items = [];
    if (rewards.tokenAmount) {
        items.push(
            '<button class="claim-modal-item claim-option-token' + (state.claimSelection === "token" ? ' is-selected' : '') + '" type="button" data-claim-option="token">' +
            "<span>领取令牌</span>" +
            "<strong>x" + rewards.tokenAmount + "</strong>" +
            "<small>选择后将结算本轮令牌奖励。</small>" +
            "</button>"
        );
    }
    if (rewards.prizeAvailable) {
        items.push(
            '<button class="claim-modal-item claim-option-prize' + (state.claimSelection === "prize" ? ' is-selected' : '') + '" type="button" data-claim-option="prize">' +
            "<span>" + (rewards.badgeAmount ? "领取徽章" : "领取物品") + "</span>" +
            "<strong>" + rewards.prizeLabel + "</strong>" +
            "<small>" + rewards.prizeDescription + "</small>" +
            "</button>"
        );
    }
    setText(ui.claimModalSummary, items.length > 1
        ? "请选择本轮要领取的奖励。"
        : "本轮仅有一种奖励可领取。");
    ui.claimModalList.innerHTML = items.join("");
    ui.claimModalList.classList.toggle("has-dual", items.length > 1);
    ui.confirmClaimDialogButton.disabled = !state.claimSelection || state.spinning;
    ui.confirmClaimDialogButton.textContent = state.claimSelection === "prize" ? "确认领取物品/徽章" : "确认领取令牌";
}

function handleClaimOptionClick(event) {
    const button = event.target.closest("[data-claim-option]");
    if (!button) return;
    state.claimSelection = button.getAttribute("data-claim-option") || "";
    renderClaimDialog(getDialogRewards());
}

function confirmClaimDialog() {
    if (state.claimSelection === "token") {
        claimTokens();
        return;
    }
    if (state.claimSelection === "prize") {
        claimPrize();
    }
}

function openArchivePage() {
    persistArchiveState();
    window.open("Archive.html", "_blank", "noopener");
}

function resetAllData() {
    const confirmed = window.confirm("确认重置所有数据？");
    if (!confirmed) return;

    state.balance = 0;
    state.totalSpend = 0;
    state.tokens = 0;
    state.badges = 0;
    state.inventory = [];
    state.logs = [];
    state.roundNumber = 0;
    state.roundActive = false;
    state.roundLocked = false;
    state.currentElement = null;
    state.currentElementIndex = -1;
    state.currentStars = 0;
    state.currentPrize = null;
    state.pendingTokenReward = 0;
    state.protectFailCount = 0;
    state.spinning = false;
    state.selectedElementIndex = 0;
    state.selectedStarIndex = 0;
    state.starRotation = 0;
    state.elementRotation = 0;
    state.claimSelection = "";

    closeClaimDialog();
    setWheelRotation(0, 0, false);
    clearHighlights();
    addLog("已重置全部数据。");
    updateAll();
}

function resetRound(roundMessage) {
    closeClaimDialog();
    state.roundActive = false;
    state.roundLocked = false;
    state.currentElement = null;
    state.currentElementIndex = -1;
    state.currentStars = 0;
    state.currentPrize = null;
    state.pendingTokenReward = 0;
    state.protectFailCount = 0;
    state.claimSelection = "";
    if (roundMessage) addLog(roundMessage);
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

function getCurrentTokenReward() {
    if (state.pendingTokenReward > 0) return state.pendingTokenReward;
    if (!state.roundActive) return 0;
    return getTokenReward(state.currentStars);
}

function generatePrize(element, stars) {
    if (!element || stars < 3) return null;
    if (stars === 3) {
        const roll = Math.random() * 10;
        if (roll > 6.6) return "五爪金龙";
        if (roll > 3.3) return "至尊龙雀";
        return "挂件-" + element.name;
    }
    if (stars === 4) return Math.random() < 0.5 ? element.name + "背包" : element.name + "头盔";
    if (stars === 5) {
        const roll = Math.random() * 10;
        if (roll > 6.6) return "M416-五爪金龙";
        if (roll > 3.3) return "至尊龙雀飞行器";
        return "套装-" + element.name;
    }
    if (stars === 6) return "徽章 x1";
    return "徽章 x3";
}

function addLog(message) {
    const stamp = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    state.logs.unshift({ stamp, message });
    if (state.logs.length > 40) state.logs.pop();
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
    clearHighlights();

    const starStep = 360 / STAR_SLOTS.length;
    const elementStep = 360 / ELEMENTS.length;
    const targetStarRotation = normalizeTargetRotation(state.starRotation, -starIndex * starStep);
    const targetElementRotation = normalizeTargetRotation(state.elementRotation, -elementIndex * elementStep);

    state.selectedElementIndex = elementIndex;
    state.selectedStarIndex = starIndex;

    if (state.skipAnimation) {
        state.starRotation = targetStarRotation;
        state.elementRotation = targetElementRotation;
        setWheelRotation(targetStarRotation, targetElementRotation, false);
        highlightStar(starIndex);
        highlightElement(elementIndex);
        state.spinning = false;
        updateAll();
        return;
    }

    const starSpins = 4 + randomIndex(2);
    const elementSpins = 6 + randomIndex(3);
    const animatedStarRotation = targetStarRotation + starSpins * 360;
    const animatedElementRotation = targetElementRotation + elementSpins * 360;

    setWheelTransition(2.8, 4.2);
    setWheelRotation(animatedStarRotation, animatedElementRotation, true);

    await wait(3000);
    highlightStar(starIndex);
    await wait(1200);
    highlightElement(elementIndex);

    state.starRotation = targetStarRotation;
    state.elementRotation = targetElementRotation;
    setWheelTransition(0, 0);
    setWheelRotation(targetStarRotation, targetElementRotation, false);
    setWheelTransition(2.2, 3.6);

    state.spinning = false;
    updateAll();
}

function setWheelTransition(starSeconds, elementSeconds) {
    ui.starRing.style.transitionDuration = starSeconds + "s";
    ui.elementOrbit.style.transitionDuration = elementSeconds + "s";
}

function setWheelRotation(starRotation, elementRotation, keepTransition) {
    if (!keepTransition) {
        ui.starRing.style.transitionDuration = "0s";
        ui.elementOrbit.style.transitionDuration = "0s";
    }

    ui.starRing.style.transform = "rotate(" + starRotation + "deg)";
    ui.elementOrbit.style.transform = "rotate(" + elementRotation + "deg)";

    if (!keepTransition) {
        ui.starRing.offsetHeight;
        ui.elementOrbit.offsetHeight;
        ui.starRing.style.transitionDuration = "2.2s";
        ui.elementOrbit.style.transitionDuration = "3.6s";
    }
}

function normalizeTargetRotation(currentRotation, targetNormalized) {
    const currentNormalized = normalizeAngle(currentRotation);
    let delta = targetNormalized - currentNormalized;
    while (delta < 0) delta += 360;
    while (delta >= 360) delta -= 360;
    return currentRotation + delta;
}

function normalizeAngle(angle) {
    let normalized = angle % 360;
    if (normalized < 0) normalized += 360;
    return normalized;
}

function clearHighlights() {
    ui.starRing.querySelectorAll(".star-slot").forEach((slot) => slot.classList.remove("is-active"));
    ui.elementOrbit.querySelectorAll(".element-ball").forEach((ball) => ball.classList.remove("is-active"));
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
    const tokenReward = getCurrentTokenReward();
    const waitingForClaim = state.roundActive && state.roundLocked;
    const rewards = getDialogRewards();

    setText(ui.balanceValue, String(state.balance));
    setText(ui.tokenValue, String(state.tokens));
    setText(ui.badgeValue, String(state.badges));
    setText(ui.totalSpendButton, "总消费 " + state.totalSpend);

    ui.rechargeButton.disabled = state.spinning;
    ui.openArchiveButton.disabled = state.spinning;
    ui.resetButton.disabled = state.spinning;

    setText(
        ui.resultLabel,
        state.roundActive && state.currentElement
            ? state.currentElement.name + " · " + state.currentStars + " 星"
            : "等待开始"
    );

    setText(ui.tokenRewardValue, tokenReward ? "x" + tokenReward : "0");
    setText(
        ui.tokenRewardText,
        waitingForClaim
            ? "本轮已锁定，请先领取奖励。"
            : (state.roundActive ? "当前可领取令牌奖励。" : "开始抽奖后生成奖励。")
    );

    setText(ui.prizeRewardValue, state.currentPrize || "无");
    setText(
        ui.prizeRewardText,
        state.currentPrize ? "当前轮次已生成物品/徽章奖励。" : "3 星开始出现物品奖励，6 星及以上出现徽章奖励。"
    );
    setText(
        ui.rewardHint,
        rewards.tokenAmount && rewards.prizeAvailable
            ? "当前可在弹窗中二选一领取奖励。"
            : "点击“领取奖励”后在弹窗中进行选择。"
    );

    setText(ui.starTrackText, state.currentStars + " / " + MAX_STARS + " 星");
    ui.starTrack.querySelectorAll(".track-node").forEach((node, index) => {
        node.classList.toggle("is-filled", index < state.currentStars);
    });

    ui.openClaimDialogButton.disabled = state.spinning;
    ui.drawButton.disabled = state.spinning || state.roundActive;
    ui.normalAppendButton.disabled = state.spinning || !state.roundActive || state.roundLocked || state.currentStars >= MAX_STARS;

    const protectCost = PROTECT_COSTS[state.currentStars] || 0;
    ui.protectedAppendButton.disabled = state.spinning || !state.roundActive || state.roundLocked || state.currentStars >= MAX_STARS || !protectCost;
    ui.protectedAppendButton.textContent = protectCost ? "保护追加 (" + protectCost + ")" : "保护追加";
    ui.costHint.textContent = waitingForClaim
        ? "本轮已锁定，请先领取奖励后继续。"
        : (state.roundActive && protectCost
            ? "当前保护追加消耗 " + protectCost + "，连续失败 2 次后第 3 次必成。"
            : "保护追加消耗会随星级变化。");

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
        ui.openClaimDialogButton,
        ui.openArchiveButton
    ].forEach((button) => {
        if (button) button.disabled = disabled;
    });
}

function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function randomIndex(length) {
    return Math.floor(Math.random() * length);
}


