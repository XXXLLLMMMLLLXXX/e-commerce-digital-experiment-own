// ====== ДАННЫЕ: 6 ТОВАРОВ + КАРТИНКИ ======
const PRODUCTS = [
  {
    id: "p1",
    name: "Choco Crunch",
    img: "images/bar_choco.jpg",
    desc: "20g Protein • 220 kcal • Knusprige Schoko-Stücke",
    price: 2.49
  },
  {
    id: "p2",
    name: "Peanut Power",
    img: "images/bar_peanut.jpg",
    desc: "21g Protein • 230 kcal • Erdnussbutter-Geschmack",
    price: 2.59
  },
  {
    id: "p3",
    name: "Vanilla Soft",
    img: "images/bar_vanilla.jpg",
    desc: "19g Protein • 210 kcal • Weiche Vanille-Creme",
    price: 2.39
  },
  {
    id: "p4",
    name: "Berry Boost",
    img: "images/bar_berry.jpg",
    desc: "18g Protein • 205 kcal • Beeriger, frischer Geschmack",
    price: 2.29
  },
  {
    id: "p5",
    name: "Cookie Cream",
    img: "images/bar_cookie.jpg",
    desc: "20g Protein • 225 kcal • Cookie-Stücke & Cream",
    price: 2.69
  },
  {
    id: "p6",
    name: "Coconut Delight",
    img: "images/bar_coconut.jpg",
    desc: "19g Protein • 215 kcal • Kokosflocken & Schoko",
    price: 2.49
  },
];

// ====== SOCIAL PROOF (звёзды + кол-во оценок) ======
const SOCIAL_PROOF = {
  p1: { rating: 5.0, count: 164 },
  p2: { rating: 4.0, count: 96 },
  p3: { rating: 0.0, count: 0 },
  p4: { rating: 0.0, count: 0 },
  p5: { rating: 0.0, count: 0 },
  p6: { rating: 4.5, count: 44 },
};

// ====== ⭐ НОВОЕ: ПОЛУЧЕНИЕ PARTICIPANTID ИЗ URL ======
function getParticipantId() {
  const urlParams = new URLSearchParams(window.location.search);
  let participantId = urlParams.get('participantId');
  
  // Если нет в URL, пробуем sessionStorage
  if (!participantId) {
    participantId = sessionStorage.getItem('participantId');
  }
  
  // Если всё ещё нет, генерируем новый (fallback)
  if (!participantId) {
    participantId = 'P' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    console.warn('⚠️ ParticipantId not found in URL, generated new:', participantId);
  }
  
  // Сохраняем в sessionStorage
  sessionStorage.setItem('participantId', participantId);
  
  console.log('🆔 ParticipantId:', participantId);
  return participantId;
}

// ====== ⭐ PROLIFIC: ПОЛУЧЕНИЕ ПАРАМЕТРОВ ======
function getProlificParams() {
  const urlParams = new URLSearchParams(window.location.search);
  
  const prolificPID = urlParams.get('prolificPID') || sessionStorage.getItem('prolificPID') || null;
  const studyID = urlParams.get('studyID') || sessionStorage.getItem('studyID') || null;
  const sessionID = urlParams.get('sessionID') || sessionStorage.getItem('sessionID') || null;
  
  // Сохраняем в sessionStorage если есть
  if (prolificPID) sessionStorage.setItem('prolificPID', prolificPID);
  if (studyID) sessionStorage.setItem('studyID', studyID);
  if (sessionID) sessionStorage.setItem('sessionID', sessionID);
  
  if (prolificPID) {
    console.log('✅ Prolific participant detected');
    console.log('🆔 Prolific PID:', prolificPID);
    console.log('📚 Study ID:', studyID);
    console.log('🔑 Session ID:', sessionID);
  }
  
  return { prolificPID, studyID, sessionID };
}

// ====== СОСТОЯНИЕ + ЛОГИ ======
const state = {
  participantId: getParticipantId(),  // ⭐ НОВОЕ!
  ...getProlificParams(),  // ⭐ PROLIFIC: добавляем prolificPID, studyID, sessionID
  condition: window.EXPERIMENT_CONDITION ?? 1,
  startTs: Date.now(),
  events: [],
  selected: {}, // selected[productId] = qty (выбор на карточке)
  cart: {},     // cart[productId] = qty (реальная корзина)
};

function logEvent(type, payload = {}) {
  state.events.push({
    type,
    t: Date.now(),
    msFromStart: Date.now() - state.startTs,
    ...payload,
  });
}

function formatEUR(value) {
  return value.toFixed(2).replace(".", ",") + " €";
}

function cartTotals() {
  let count = 0;
  let total = 0;
  for (const [pid, qty] of Object.entries(state.cart)) {
    const p = PRODUCTS.find(x => x.id === pid);
    if (!p) continue;
    count += qty;
    total += qty * p.price;
  }
  return { count, total };
}

// ====== SCARCITY: стабильные "остатки" в рамках сессии ======
const scarcityStock = {}; // stock[productId] = number

function getRemainingStock(productId) {
  if (scarcityStock[productId] != null) return scarcityStock[productId];

  // диапазон остатков (например 3..12)
  const min = 3;
  const max = 12;
  const value = Math.floor(Math.random() * (max - min + 1)) + min;

  scarcityStock[productId] = value;
  return value;
}

// ====== SOCIAL PROOF helpers ======
function buildStars(rating) {
  // rating: 0..5, может быть 4.5
  const wrap = document.createElement("div");
  wrap.className = "stars";

  for (let i = 1; i <= 5; i++) {
    const s = document.createElement("span");
    s.className = "star";

    if (rating >= i) {
      s.classList.add("full");
    } else if (rating >= i - 0.5) {
      s.classList.add("half");
    }
    wrap.appendChild(s);
  }

  return wrap;
}

function buildSocialProof(productId) {
  const data = SOCIAL_PROOF[productId] ?? { rating: 0, count: 0 };

  const box = document.createElement("div");
  box.className = "social-proof";

  const stars = buildStars(data.rating);

  const count = document.createElement("div");
  count.className = "rating-count";
  count.textContent = `(${data.count} Bewertungen)`;

  box.appendChild(stars);
  box.appendChild(count);

  return box;
}

// ====== РЕНДЕР ПРОДУКТОВ ======
function renderProducts() {
  const root = document.getElementById("productList");
  if (!root) return;

  root.innerHTML = "";

  // SCARCITY только для первых двух товаров
  const scarcityProducts = new Set(["p1", "p2"]);

  PRODUCTS.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";

    // КАРТИНКА
    const img = document.createElement("img");
    img.className = "product-img";
    img.src = p.img;
    img.alt = p.name;
    img.loading = "lazy";

    const title = document.createElement("h3");
    title.textContent = p.name;

    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = p.desc;

    const price = document.createElement("div");
    price.className = "price";
    price.textContent = formatEUR(p.price);

    // ====== SOCIAL PROOF UI (только для condition 2 и 4) ======
    let socialBox = null;
    if (state.condition === 2 || state.condition === 4) {
      socialBox = buildSocialProof(p.id);
    }

    // ====== SCARCITY UI (только для condition 3 и 4, и только для p1/p2) ======
    let scarcityBox = null;
    if ((state.condition === 3 || state.condition === 4) && scarcityProducts.has(p.id)) {
      scarcityBox = document.createElement("div");
      scarcityBox.className = "badge";
      const remaining = getRemainingStock(p.id);
      scarcityBox.textContent = `Nur ${remaining} Stück verfügbar`;
    }

    // Выбор количества (ещё НЕ корзина)
    const qtyRow = document.createElement("div");
    qtyRow.className = "qty-row";

    const minus = document.createElement("button");
    minus.className = "qty-btn";
    minus.type = "button";
    minus.textContent = "–";

    const qtyPill = document.createElement("div");
    qtyPill.className = "qty-pill";
    qtyPill.textContent = String(state.selected[p.id] ?? 0);

    const plus = document.createElement("button");
    plus.className = "qty-btn";
    plus.type = "button";
    plus.textContent = "+";

    // Кнопка добавления в корзину — показывать только если выбран qty > 0
    const addBtn = document.createElement("button");
    addBtn.className = "add-btn";
    addBtn.type = "button";
    addBtn.textContent = "In den Warenkorb";
    addBtn.style.display = (state.selected[p.id] ?? 0) > 0 ? "inline-block" : "none";

    function refreshSelectedUI() {
      const q = state.selected[p.id] ?? 0;
      qtyPill.textContent = String(q);
      addBtn.style.display = q > 0 ? "inline-block" : "none";
    }

    minus.addEventListener("click", () => {
      const current = state.selected[p.id] ?? 0;
      if (current <= 0) return;

      state.selected[p.id] = current - 1;
      if (state.selected[p.id] === 0) delete state.selected[p.id];

      logEvent("select_minus", { productId: p.id, newQty: state.selected[p.id] ?? 0 });
      refreshSelectedUI();
    });

    plus.addEventListener("click", () => {
      const current = state.selected[p.id] ?? 0;
      state.selected[p.id] = current + 1;

      logEvent("select_plus", { productId: p.id, newQty: state.selected[p.id] });
      refreshSelectedUI();
    });

    addBtn.addEventListener("click", () => {
      const qty = state.selected[p.id] ?? 0;
      if (qty <= 0) return;

      state.cart[p.id] = (state.cart[p.id] ?? 0) + qty;
      delete state.selected[p.id];

      logEvent("add_to_cart", {
        productId: p.id,
        qtyAdded: qty,
        newCartQty: state.cart[p.id],
      });

      refreshSelectedUI();
      renderCart();
      updateGoSurveyState();
    });

    qtyRow.appendChild(minus);
    qtyRow.appendChild(qtyPill);
    qtyRow.appendChild(plus);

    const note = document.createElement("div");
    note.className = "small-note";
    note.textContent = "Nutzen Sie +/–, um die Menge auszuwählen, dann „In den Warenkorb";

    // Сборка карточки
    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(price);

    if (socialBox) card.appendChild(socialBox);
    if (scarcityBox) card.appendChild(scarcityBox);

    card.appendChild(qtyRow);
    card.appendChild(addBtn);
    card.appendChild(note);

    root.appendChild(card);
  });

  logEvent("render_products", { condition: state.condition });
}

// ====== РЕНДЕР КОРЗИНЫ (с возможностью удалять/уменьшать) ======
function renderCart() {
  const root = document.getElementById("cartItems");
  if (!root) return;

  root.innerHTML = "";

  const entries = Object.entries(state.cart).filter(([, qty]) => qty > 0);

  if (entries.length === 0) {
    root.innerHTML = `<div class="hint">Ihr Warenkorb ist leer.</div>`;
  } else {
    entries.forEach(([pid, qty]) => {
      const p = PRODUCTS.find(x => x.id === pid);
      if (!p) return;

      const row = document.createElement("div");
      row.className = "cart-item";

      // левый блок: название + qty
      const left = document.createElement("div");
      left.innerHTML = `<strong>${p.name}</strong><div class="hint">Menge: <span id="cartQty_${pid}">${qty}</span></div>`;

      // правый блок: controls + цена
      const right = document.createElement("div");
      right.style.display = "flex";
      right.style.flexDirection = "column";
      right.style.alignItems = "flex-end";
      right.style.gap = "8px";

      // controls (- qty +)
      const controls = document.createElement("div");
      controls.className = "cart-controls";

      const minus = document.createElement("button");
      minus.className = "qty-btn";
      minus.type = "button";
      minus.textContent = "–";

      const pill = document.createElement("div");
      pill.className = "qty-pill";
      pill.textContent = String(qty);

      const plus = document.createElement("button");
      plus.className = "qty-btn";
      plus.type = "button";
      plus.textContent = "+";

      controls.appendChild(minus);
      controls.appendChild(pill);
      controls.appendChild(plus);

      // цена строки
      const priceLine = document.createElement("div");
      priceLine.className = "cart-line-price";
      priceLine.innerHTML = `<strong>${formatEUR(qty * p.price)}</strong>`;

      // handlers
      minus.addEventListener("click", () => {
        const current = state.cart[pid] ?? 0;
        if (current <= 0) return;

        const newQty = current - 1;

        if (newQty <= 0) {
          delete state.cart[pid];
          logEvent("cart_minus_to_zero", { productId: pid });
          // проще перерисовать строку удалением
          renderCart();
        } else {
          state.cart[pid] = newQty;
          logEvent("cart_minus", { productId: pid, newQty });

          // обновляем UI локально
          pill.textContent = String(newQty);
          const qtySpan = document.getElementById(`cartQty_${pid}`);
          if (qtySpan) qtySpan.textContent = String(newQty);
          priceLine.innerHTML = `<strong>${formatEUR(newQty * p.price)}</strong>`;
        }

        // обновим totals и кнопку
        const { count, total } = cartTotals();
        const countEl = document.getElementById("cartCount");
        const totalEl = document.getElementById("cartTotal");
        if (countEl) countEl.textContent = String(count);
        if (totalEl) totalEl.textContent = formatEUR(total);

        updateGoSurveyState();
      });

      plus.addEventListener("click", () => {
        const current = state.cart[pid] ?? 0;
        const newQty = current + 1;
        state.cart[pid] = newQty;

        logEvent("cart_plus", { productId: pid, newQty });

        // UI локально
        pill.textContent = String(newQty);
        const qtySpan = document.getElementById(`cartQty_${pid}`);
        if (qtySpan) qtySpan.textContent = String(newQty);
        priceLine.innerHTML = `<strong>${formatEUR(newQty * p.price)}</strong>`;

        // totals + кнопка
        const { count, total } = cartTotals();
        const countEl = document.getElementById("cartCount");
        const totalEl = document.getElementById("cartTotal");
        if (countEl) countEl.textContent = String(count);
        if (totalEl) totalEl.textContent = formatEUR(total);

        updateGoSurveyState();
      });

      right.appendChild(controls);
      right.appendChild(priceLine);

      row.appendChild(left);
      row.appendChild(right);
      root.appendChild(row);
    });
  }

  // totals
  const { count, total } = cartTotals();
  const countEl = document.getElementById("cartCount");
  const totalEl = document.getElementById("cartTotal");
  if (countEl) countEl.textContent = String(count);
  if (totalEl) totalEl.textContent = formatEUR(total);
}

// ====== КНОПКА "ДАЛЬШЕ" + ВРЕМЯ ======
function updateGoSurveyState() {
  const { count } = cartTotals();
  const btn = document.getElementById("goSurveyBtn");
  const hint = document.getElementById("hintText");
  if (!btn || !hint) return;

  btn.disabled = count <= 0;

  hint.textContent = count > 0
    ? "Sie können jetzt zur Umfrage wechseln."
    : "Fügen Sie mindestens 1 Artikel in den Warenkorb hinzu.";
}

// ====== ⭐ ИЗМЕНЕНО: ПЕРЕХОД НА SURVEY.HTML (вместо LimeSurvey) ======
function handleGoSurvey() {
  const endTs = Date.now();
  const timeOnSiteMs = endTs - state.startTs;
  logEvent("go_to_survey_click", { timeOnSiteMs });

  // Собираем все данные эксперимента
  const { total } = cartTotals();
  
  const payload = {
    participantId: state.participantId,  // ⭐ НОВОЕ!
    prolificPID: state.prolificPID || null,  // ⭐ PROLIFIC
    studyID: state.studyID || null,          // ⭐ PROLIFIC
    sessionID: state.sessionID || null,      // ⭐ PROLIFIC
    condition: state.condition,
    startTs: state.startTs,
    endTs,
    timeOnSiteMs,
    cart: state.cart,
    cartTotal: total,  // Добавляем сумму для удобства
    events: state.events,
  };

  // Выводим в консоль для отладки
  console.log("📦 EXPERIMENT_PAYLOAD", payload);

  // ====== ПОДГОТОВКА ДАННЫХ (сохраняем оригинальный код для совместимости) ======
  
  // 1. Группа эксперимента
  const groupNames = {
    1: 'control',
    2: 'socialproof',
    3: 'scarcity',
    4: 'both'
  };
  const groupName = groupNames[state.condition] || 'unknown';

  // 2. Время на сайте (в секундах)
  const timeOnSiteSec = Math.round(timeOnSiteMs / 1000);

  // 3. Формируем строку с товарами в корзине: "p1:2,p3:1,p5:3"
  const cartProductsArray = [];
  for (const [pid, qty] of Object.entries(state.cart)) {
    if (qty > 0) {
      cartProductsArray.push(`${pid}:${qty}`);
    }
  }
  const cartProductsString = cartProductsArray.join(',') || 'empty';

  // 4. Общая сумма корзины (в евро, с точкой)
  const cartTotalValue = total.toFixed(2);

  // Выводим для отладки (оригинальный код)
  console.log('=== ДАННЫЕ ЭКСПЕРИМЕНТА ===');
  console.log('🆔 ParticipantId:', state.participantId);
  console.log('🧪 Группа:', groupName, '(ID:', state.condition + ')');
  console.log('⏱️ Время на сайте:', timeOnSiteSec, 'секунд');
  console.log('🛒 Товары в корзине:', cartProductsString);
  console.log('💰 Общая сумма:', cartTotalValue, '€');

  // ⭐ НОВОЕ: Сохраняем данные в sessionStorage для survey.js
  sessionStorage.setItem('experimentData', JSON.stringify(payload));
  console.log('✅ Данные сохранены в sessionStorage');

  // ⭐ НОВОЕ: Переход на survey.html вместо LimeSurvey
  console.log('🔄 Переход на survey.html...');
  window.location.href = 'survey.html';
}

// ====== INIT ======
window.addEventListener("load", () => {
  console.log('🚀 Страница магазина загружена');
  console.log('🆔 ParticipantId:', state.participantId);
  console.log('🧪 Condition:', state.condition);
  if (state.prolificPID) {
    console.log('✅ Prolific PID:', state.prolificPID);
    console.log('📚 Study ID:', state.studyID);
    console.log('🔑 Session ID:', state.sessionID);
  }
  
  logEvent("page_load", { 
    condition: state.condition,
    participantId: state.participantId  // ⭐ Добавляем в лог
  });
  
  renderProducts();
  renderCart();
  updateGoSurveyState();

  const btn = document.getElementById("goSurveyBtn");
  if (btn) btn.addEventListener("click", handleGoSurvey);
});

window.addEventListener("beforeunload", () => {
  logEvent("page_unload", { timeOnSiteMs: Date.now() - state.startTs });
});



