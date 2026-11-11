(function () {
  const LAB = Number(document.body.dataset.lab || 1);
  const STORAGE_KEY = "lunchcity-order";
  const ORDERS_KEY = "lunchcity-orders";
  const API_DISHES = "https://edu.std-900.ist.mospolytech.ru/labs/api/dishes";
  const API_BASE = "https://edu.std-900.ist.mospolytech.ru/labs/api";
  const API_KEY = window.APP_CONFIG && window.APP_CONFIG.apiKey;

  const CATEGORIES = [
    { key: "soup", title: "Выберите суп", filters: [["fish", "рыбный"], ["meat", "мясной"], ["veg", "вегетарианский"]], empty: "Блюдо не выбрано", formName: "soup" },
    { key: "main", title: "Выберите главное блюдо", filters: [["fish", "рыбное"], ["meat", "мясное"], ["veg", "вегетарианское"]], empty: "Блюдо не выбрано", formName: "main_course" },
    { key: "salad", title: "Выберите салат или стартер", filters: [["fish", "рыбный"], ["meat", "мясной"], ["veg", "вегетарианский"]], empty: "Блюдо не выбрано", formName: "salad" },
    { key: "drink", title: "Выберите напиток", filters: [["cold", "холодный"], ["hot", "горячий"]], empty: "Напиток не выбран", formName: "drink" },
    { key: "dessert", title: "Выберите десерт", filters: [["small", "маленькая порция"], ["medium", "средняя порция"], ["large", "большая порция"]], empty: "Блюдо не выбрано", formName: "dessert" }
  ];

  const COMBOS = [
    ["soup", "main", "salad", "drink"],
    ["soup", "main", "drink"],
    ["soup", "salad", "drink"],
    ["main", "salad", "drink"],
    ["main", "drink"]
  ];

  let dishes = [];
  const selected = { soup: null, main: null, salad: null, drink: null, dessert: null };
  const activeFilter = { soup: null, main: null, salad: null, drink: null, dessert: null };

  function normalizeDish(d) {
    const category = d.category === "main_course" || d.category === "main-course" ? "main" : d.category;
    let image = d.image || "";
    if (image.startsWith("http")) {
      /* keep remote */
    } else if (!image.startsWith("../") && !image.startsWith("/")) {
      image = "../images/" + image.replace(/^images\//, "") + (image.includes(".") ? "" : ".jpg");
    }
    return Object.assign({}, d, { category, image });
  }

  function loadStored() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      Object.keys(selected).forEach(function (k) {
        selected[k] = raw[k] || null;
      });
    } catch (e) {
      /* ignore */
    }
  }

  function saveStored() {
    const payload = {};
    Object.keys(selected).forEach(function (k) {
      payload[k] = selected[k];
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function findByKeyword(keyword) {
    return dishes.find(function (d) { return d.keyword === keyword; });
  }

  function findById(id) {
    return dishes.find(function (d) { return String(d.id) === String(id); });
  }

  function resolveSelected(value) {
    if (value == null) return null;
    return findByKeyword(value) || findById(value);
  }

  function selectedSet() {
    return Object.keys(selected).filter(function (k) {
      return k !== "dessert" && selected[k];
    });
  }

  function comboValid() {
    const set = selectedSet().sort().join(",");
    return COMBOS.some(function (c) {
      return c.slice().sort().join(",") === set;
    });
  }

  function comboMessage() {
    const has = {
      soup: !!selected.soup,
      main: !!selected.main,
      salad: !!selected.salad,
      drink: !!selected.drink,
      dessert: !!selected.dessert
    };
    if (!has.soup && !has.main && !has.salad && !has.drink && !has.dessert) {
      return "Ничего не выбрано. Выберите блюда для заказа";
    }
    if ((has.soup && has.main && has.salad && !has.drink) ||
        (has.soup && has.main && !has.salad && !has.drink) ||
        (has.soup && !has.main && has.salad && !has.drink) ||
        (!has.soup && has.main && has.salad && !has.drink) ||
        (!has.soup && has.main && !has.salad && !has.drink)) {
      return "Выберите напиток";
    }
    if (has.soup && !has.main && !has.salad) {
      return "Выберите главное блюдо/салат/стартер";
    }
    if (has.salad && !has.soup && !has.main) {
      return "Выберите суп или главное блюдо";
    }
    if ((has.drink || has.dessert) && !has.main && !has.soup && !has.salad) {
      return "Выберите главное блюдо";
    }
    if (!comboValid()) {
      return "Выберите напиток";
    }
    return "Выберите блюда так, чтобы получилось одно из доступных комбо";
  }

  function totalPrice() {
    return Object.keys(selected).reduce(function (sum, k) {
      const dish = resolveSelected(selected[k]);
      return sum + (dish ? dish.price : 0);
    }, 0);
  }

  function showModal(html, actions) {
    let modal = document.querySelector(".modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "modal";
      document.body.appendChild(modal);
    }
    modal.innerHTML = '<div class="modal-card"><button type="button" class="modal-close" aria-label="Закрыть">×</button>' + html + (actions || "") + "</div>";
    modal.classList.add("open");
    modal.querySelector(".modal-close").onclick = hideModal;
    modal.addEventListener("click", function (e) {
      if (e.target === modal) hideModal();
    });
    const ok = modal.querySelector(".ok, [data-close]");
    if (ok) ok.onclick = hideModal;
    return modal;
  }

  function hideModal() {
    const modal = document.querySelector(".modal");
    if (modal) modal.classList.remove("open");
  }

  function notify(text) {
    showModal("<p>" + text + "</p><button type='button' class='ok'>Окей</button>");
  }

  function categoriesForLab() {
    if (LAB < 5) return CATEGORIES.filter(function (c) { return ["soup", "main", "drink"].indexOf(c.key) >= 0; });
    return CATEGORIES;
  }

  function renderCategory(cat) {
    const section = document.querySelector('[data-category="' + cat.key + '"]');
    if (!section) return;
    const grid = section.querySelector(".dishes");
    const kind = activeFilter[cat.key];
    let list = dishes.filter(function (d) { return d.category === cat.key; });
    list.sort(function (a, b) { return a.name.localeCompare(b.name, "ru"); });
    if (kind) list = list.filter(function (d) { return d.kind === kind; });
    grid.innerHTML = "";
    list.forEach(function (dish) {
      const card = document.createElement("div");
      card.className = "dish";
      card.dataset.dish = dish.keyword;
      if (selected[cat.key] === dish.keyword || String(selected[cat.key]) === String(dish.id)) {
        card.classList.add("selected");
      }
      const btnLabel = section.dataset.remove === "true" ? "Удалить" : "Добавить";
      card.innerHTML =
        '<img src="' + dish.image + '" alt="' + dish.name + '">' +
        '<p class="price">' + dish.price + " ₽</p>" +
        '<p class="name">' + dish.name + "</p>" +
        '<p class="count">' + dish.count + "</p>" +
        "<button type='button'>" + btnLabel + "</button>";
      card.querySelector("button").addEventListener("click", function () {
        if (section.dataset.remove === "true") {
          selected[cat.key] = null;
        } else {
          selected[cat.key] = dish.keyword;
        }
        if (LAB >= 8) saveStored();
        renderAll();
      });
      grid.appendChild(card);
    });
  }

  function bindFilters() {
    categoriesForLab().forEach(function (cat) {
      const section = document.querySelector('[data-category="' + cat.key + '"]');
      if (!section) return;
      section.querySelectorAll(".filters button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const kind = btn.dataset.kind;
          if (activeFilter[cat.key] === kind) {
            activeFilter[cat.key] = null;
            btn.classList.remove("active");
          } else {
            activeFilter[cat.key] = kind;
            section.querySelectorAll(".filters button").forEach(function (b) { b.classList.remove("active"); });
            btn.classList.add("active");
          }
          renderCategory(cat);
        });
      });
    });
  }

  function updateFormSummary() {
    const box = document.getElementById("order-summary");
    if (!box) return;
    const any = Object.keys(selected).some(function (k) { return selected[k]; });
    if (!any) {
      box.innerHTML = "<p>Ничего не выбрано</p>";
      const cost = document.getElementById("order-cost");
      if (cost) cost.hidden = true;
      return;
    }
    let html = "";
    categoriesForLab().forEach(function (cat) {
      const dish = resolveSelected(selected[cat.key]);
      html += "<p><b>" + cat.title.replace("Выберите ", "") + ":</b> " + (dish ? dish.name + " — " + dish.price + " ₽" : cat.empty) + "</p>";
      const hidden = document.querySelector('[name="' + cat.formName + '"]');
      if (hidden) hidden.value = dish ? ((LAB >= 8 && dish.id) ? dish.id : dish.keyword) : "";
    });
    box.innerHTML = html;
    const cost = document.getElementById("order-cost");
    if (cost) {
      cost.hidden = false;
      cost.textContent = "Стоимость заказа: " + totalPrice() + " ₽";
    }
  }

  function updateCheckoutBar() {
    const bar = document.querySelector(".checkout-bar");
    if (!bar) return;
    const any = Object.keys(selected).some(function (k) { return selected[k]; });
    bar.hidden = !any;
    const total = document.getElementById("bar-total");
    if (total) total.textContent = totalPrice() + " ₽";
    const link = bar.querySelector("a");
    if (link) link.setAttribute("aria-disabled", comboValid() ? "false" : "true");
  }

  function renderCheckoutPage() {
    const list = document.getElementById("checkout-dishes");
    const empty = document.getElementById("checkout-empty");
    const formBox = document.getElementById("checkout-form-wrap");
    if (!list) return;
    const any = Object.keys(selected).some(function (k) { return selected[k]; });
    if (empty) empty.hidden = any;
    if (formBox) formBox.hidden = !any;
    list.innerHTML = "";
    if (!any) return;
    CATEGORIES.forEach(function (cat) {
      const dish = resolveSelected(selected[cat.key]);
      if (!dish) return;
      const section = document.createElement("div");
      section.className = "dish";
      section.innerHTML =
        '<img src="' + dish.image + '" alt="' + dish.name + '">' +
        '<p class="price">' + dish.price + " ₽</p>" +
        '<p class="name">' + dish.name + "</p>" +
        '<p class="count">' + dish.count + "</p>" +
        "<button type='button'>Удалить</button>";
      section.querySelector("button").onclick = function () {
        selected[cat.key] = null;
        saveStored();
        renderAll();
      };
      list.appendChild(section);
    });
    updateFormSummary();
  }

  function renderAll() {
    categoriesForLab().forEach(renderCategory);
    updateFormSummary();
    updateCheckoutBar();
    renderCheckoutPage();
  }

  function bindForm() {
    const form = document.getElementById("order-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      if (LAB >= 6) {
        if (!comboValid()) {
          e.preventDefault();
          notify(comboMessage());
          return;
        }
      }
      if (LAB >= 8) {
        e.preventDefault();
        submitOrder(form);
      }
    });
  }

  function collectOrder(form) {
    const data = new FormData(form);
    const payload = {
      full_name: data.get("full_name"),
      email: data.get("email"),
      subscribe: data.get("subscribe") ? 1 : 0,
      phone: data.get("phone"),
      delivery_address: data.get("delivery_address"),
      delivery_type: data.get("delivery_type"),
      delivery_time: data.get("delivery_time") || null,
      comment: data.get("comment") || ""
    };
    CATEGORIES.forEach(function (cat) {
      const dish = resolveSelected(selected[cat.key]);
      const field = cat.key === "main" ? "main_course_id" : cat.key + "_id";
      payload[field] = dish && dish.id ? dish.id : null;
      payload[cat.formName] = dish ? dish.keyword : "";
    });
    return payload;
  }

  function submitOrder(form) {
    const payload = collectOrder(form);
    if (API_KEY && API_KEY !== "YOUR_API_KEY") {
      fetch(API_BASE + "/orders?api_key=" + encodeURIComponent(API_KEY), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (res) {
        return res.json().then(function (body) {
          if (!res.ok) throw new Error(body.error || "Ошибка оформления заказа");
          return body;
        });
      }).then(function () {
        localStorage.removeItem(STORAGE_KEY);
        notify("Заказ успешно оформлен");
        setTimeout(function () { location.href = "orders.html"; }, 800);
      }).catch(function (err) {
        notify(err.message);
      });
      return;
    }
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
    payload.id = Date.now();
    payload.created_at = new Date().toISOString();
    payload.updated_at = payload.created_at;
    orders.push(payload);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    localStorage.removeItem(STORAGE_KEY);
    notify("Заказ успешно оформлен (локально, без API-ключа)");
    setTimeout(function () { location.href = "orders.html"; }, 800);
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU");
  }

  function dishNameByIdOrKeyword(order, cat) {
    const idField = cat.key === "main" ? "main_course_id" : cat.key + "_id";
    const kw = order[cat.formName];
    const dish = findById(order[idField]) || findByKeyword(kw);
    return dish ? dish.name : null;
  }

  function orderComposition(order) {
    return CATEGORIES.map(function (cat) { return dishNameByIdOrKeyword(order, cat); })
      .filter(Boolean)
      .join(", ");
  }

  function orderTotal(order) {
    return CATEGORIES.reduce(function (sum, cat) {
      const idField = cat.key === "main" ? "main_course_id" : cat.key + "_id";
      const dish = findById(order[idField]) || findByKeyword(order[cat.formName]);
      return sum + (dish ? dish.price : 0);
    }, 0);
  }

  function loadOrders() {
    if (API_KEY && API_KEY !== "YOUR_API_KEY") {
      return fetch(API_BASE + "/orders?api_key=" + encodeURIComponent(API_KEY))
        .then(function (r) { return r.json(); })
        .then(function (data) { return Array.isArray(data) ? data : []; })
        .catch(function () { return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]"); });
    }
    return Promise.resolve(JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]"));
  }

  function renderOrdersPage() {
    const tbody = document.getElementById("orders-body");
    if (!tbody) return;
    loadOrders().then(function (orders) {
      orders.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
      tbody.innerHTML = "";
      orders.forEach(function (order, i) {
        const tr = document.createElement("tr");
        const delivery = order.delivery_type === "by_time" && order.delivery_time
          ? order.delivery_time
          : "Как можно скорее (с 7:00 до 23:00)";
        tr.innerHTML =
          "<td>" + (i + 1) + "</td>" +
          "<td>" + formatDate(order.created_at) + "</td>" +
          "<td>" + orderComposition(order) + "</td>" +
          "<td>" + orderTotal(order) + " ₽</td>" +
          "<td>" + delivery + "</td>" +
          "<td>" +
            "<button type='button' data-act='view'>Подробнее</button> " +
            "<button type='button' data-act='edit'>Редактирование</button> " +
            "<button type='button' data-act='delete'>Удаление</button>" +
          "</td>";
        tr.querySelector("[data-act=view]").onclick = function () { viewOrder(order); };
        tr.querySelector("[data-act=edit]").onclick = function () { editOrder(order); };
        tr.querySelector("[data-act=delete]").onclick = function () { deleteOrder(order); };
        tbody.appendChild(tr);
      });
    });
  }

  function viewOrder(order) {
    showModal(
      "<h3>Заказ №" + order.id + "</h3>" +
      "<p>Имя: " + (order.full_name || "") + "</p>" +
      "<p>Email: " + (order.email || "") + "</p>" +
      "<p>Телефон: " + (order.phone || "") + "</p>" +
      "<p>Адрес: " + (order.delivery_address || "") + "</p>" +
      "<p>Состав: " + orderComposition(order) + "</p>" +
      "<p>Комментарий: " + (order.comment || "—") + "</p>" +
      "<button type='button' class='ok'>Ок</button>"
    );
  }

  function editOrder(order) {
    const modal = showModal(
      "<h3>Редактирование заказа</h3>" +
      "<label>Имя <input id='e-name' value='" + (order.full_name || "") + "'></label>" +
      "<label>Email <input id='e-email' value='" + (order.email || "") + "'></label>" +
      "<label>Телефон <input id='e-phone' value='" + (order.phone || "") + "'></label>" +
      "<label>Адрес <input id='e-address' value='" + (order.delivery_address || "") + "'></label>" +
      "<label>Тип доставки <select id='e-type'><option value='now'>Как можно скорее</option><option value='by_time'>Ко времени</option></select></label>" +
      "<label>Время <input id='e-time' type='time' value='" + (order.delivery_time || "") + "'></label>" +
      "<label>Комментарий <input id='e-comment' value='" + (order.comment || "") + "'></label>" +
      "<button type='button' class='ok' id='e-save'>Сохранить</button> <button type='button' data-close>Отмена</button>"
    );
    modal.querySelector("#e-type").value = order.delivery_type || "now";
    modal.querySelector("#e-save").onclick = function () {
      const patch = {
        full_name: modal.querySelector("#e-name").value,
        email: modal.querySelector("#e-email").value,
        phone: modal.querySelector("#e-phone").value,
        delivery_address: modal.querySelector("#e-address").value,
        delivery_type: modal.querySelector("#e-type").value,
        delivery_time: modal.querySelector("#e-time").value,
        comment: modal.querySelector("#e-comment").value
      };
      saveOrderPatch(order, patch);
    };
  }

  function saveOrderPatch(order, patch) {
    if (API_KEY && API_KEY !== "YOUR_API_KEY") {
      fetch(API_BASE + "/orders/" + order.id + "?api_key=" + encodeURIComponent(API_KEY), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      }).then(function (r) {
        if (!r.ok) throw new Error("Не удалось изменить заказ");
        hideModal();
        notify("Заказ успешно изменён");
        renderOrdersPage();
      }).catch(function (e) { notify(e.message); });
      return;
    }
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
    const next = orders.map(function (o) {
      if (o.id === order.id) return Object.assign({}, o, patch, { updated_at: new Date().toISOString() });
      return o;
    });
    localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
    hideModal();
    notify("Заказ успешно изменён");
    renderOrdersPage();
  }

  function deleteOrder(order) {
    const modal = showModal(
      "<h3>Удалить заказ?</h3><p>Заказ №" + order.id + " будет удалён.</p>" +
      "<button type='button' class='ok' id='d-yes'>Да</button> <button type='button' data-close>Отмена</button>"
    );
    modal.querySelector("#d-yes").onclick = function () {
      if (API_KEY && API_KEY !== "YOUR_API_KEY") {
        fetch(API_BASE + "/orders/" + order.id + "?api_key=" + encodeURIComponent(API_KEY), { method: "DELETE" })
          .then(function (r) {
            if (!r.ok) throw new Error("Не удалось удалить заказ");
            hideModal();
            notify("Заказ успешно удалён");
            renderOrdersPage();
          }).catch(function (e) { notify(e.message); });
        return;
      }
      const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]").filter(function (o) { return o.id !== order.id; });
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      hideModal();
      notify("Заказ успешно удалён");
      renderOrdersPage();
    };
  }

  function loadDishes() {
    if (LAB < 7) {
      dishes = (window.DISHES || []).map(normalizeDish);
      if (LAB < 5) {
        dishes = dishes.filter(function (d) { return ["soup", "main", "drink"].indexOf(d.category) >= 0; });
      }
      return Promise.resolve(dishes);
    }
    return fetch(API_DISHES)
      .then(function (r) {
        if (!r.ok) throw new Error("api");
        return r.json();
      })
      .then(function (data) { dishes = data.map(normalizeDish); })
      .catch(function () {
        return fetch("../data/dishes.json")
          .then(function (r) { return r.json(); })
          .then(function (data) { dishes = data.map(normalizeDish); });
      });
  }

  if (LAB >= 8) loadStored();

  loadDishes().then(function () {
    bindFilters();
    bindForm();
    renderAll();
    renderOrdersPage();
  });
})();
