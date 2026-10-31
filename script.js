"use strict";

const WHATSAPP_NUMBER = "59162131413";
const CART_KEY = "alfressi_cart_v2";
const REVIEW_KEY = "alfressi_reviews_v2";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

let cart = loadArray(CART_KEY);
let toastTimer;

function loadArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {}
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Abrir y cerrar carrito
const cartToggle = $("#cart-toggle");
const cartPanel = $("#cart-panel");

function setCartOpen(open) {
  if (!cartPanel || !cartToggle) return;
  cartPanel.hidden = !open;
  cartToggle.setAttribute("aria-expanded", String(open));
}

cartToggle?.addEventListener("click", () => setCartOpen(cartPanel.hidden));
$("#cart-close")?.addEventListener("click", () => setCartOpen(false));

// Personalizador de vasos
const sizeSelect = $("#size");
const builderPrice = $("#builder-price");
const toppingInputs = $$('input[name="topping"]');
const toppingCount = $("#topping-count");
const builderMessage = $("#builder-message");

function selectedToppings() {
  return toppingInputs.filter(input => input.checked).map(input => input.value);
}

function selectedSauces() {
  return $$('input[name="sauce"]:checked').map(input => input.value);
}

function updateBuilder() {
  if (!sizeSelect || !builderPrice || !toppingCount) return;
  const option = sizeSelect.selectedOptions[0];
  if (!option) return;
  builderPrice.textContent = `${Number(option.dataset.price)} Bs`;
  toppingCount.textContent = `${selectedToppings().length} de 3 toppings seleccionados`;
}

toppingInputs.forEach(input => {
  input.addEventListener("change", () => {
    if (selectedToppings().length > 3) {
      input.checked = false;
      if (builderMessage) {
        builderMessage.textContent = "Puedes elegir máximo 3 toppings gratis por vaso. 💗";
      }
      showToast("¡Máximo 3 toppings por vaso! 🍓");
    } else if (builderMessage) {
      builderMessage.textContent = "";
    }
    updateBuilder();
  });
});

sizeSelect?.addEventListener("change", updateBuilder);

// Productos predeterminados
$$(".add-product").forEach(button => {
  button.addEventListener("click", () => {
    addToCart({
      name: `Fresas con crema — ${button.dataset.size}`,
      size: button.dataset.size,
      price: Number(button.dataset.price),
      toppings: [],
      sauces: []
    });
  });
});

// Vaso personalizado
$("#builder-form")?.addEventListener("submit", event => {
  event.preventDefault();
  const option = sizeSelect?.selectedOptions[0];
  if (!option) return;

  const toppings = selectedToppings();
  const sauces = selectedSauces();

  if (toppings.length > 3) {
    showToast("Elige máximo 3 toppings.");
    return;
  }

  addToCart({
    name: `Fresas con crema — ${option.value}`,
    size: option.value,
    price: Number(option.dataset.price),
    toppings,
    sauces
  });

  if (builderMessage) builderMessage.textContent = "¡Tu vaso se agregó al carrito! 🍓";
});

// Carrito
function addToCart(product) {
  cart.push({ ...product, id: makeId(), quantity: 1 });
  saveCart();
  renderCart();
  showToast("¡Agregado a tu carrito! 💗");
}

function changeQuantity(id, amount) {
  const item = cart.find(product => product.id === id);
  if (!item) return;
  item.quantity += amount;
  if (item.quantity <= 0) cart = cart.filter(product => product.id !== id);
  saveCart();
  renderCart();
}

function removeItem(id) {
  cart = cart.filter(product => product.id !== id);
  saveCart();
  renderCart();
}

function renderCart() {
  const list = $("#cart-items");
  if (!list) return;
  list.replaceChildren();

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if ($("#cart-count")) $("#cart-count").textContent = count;
  if ($("#cart-total")) $("#cart-total").textContent = `${total} Bs`;

  if (cart.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Tu carrito está vacío. ¡Elige algo delicioso! 🍓";
    list.appendChild(empty);
    return;
  }

  cart.forEach(item => {
    const line = document.createElement("article");
    line.className = "cart-line";

    const title = document.createElement("h3");
    title.textContent = item.name;

    const details = document.createElement("p");
    details.textContent =
      `Toppings: ${item.toppings.length ? item.toppings.join(", ") : "Ninguno"} · ` +
      `Salsas: ${item.sauces.length ? item.sauces.join(", ") : "Ninguna"}`;

    const bottom = document.createElement("div");
    bottom.className = "cart-line-bottom";

    const subtotal = document.createElement("strong");
    subtotal.textContent = `${item.price * item.quantity} Bs`;

    const controls = document.createElement("div");
    controls.className = "quantity-controls";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.setAttribute("aria-label", "Disminuir cantidad");
    minus.addEventListener("click", () => changeQuantity(item.id, -1));

    const quantity = document.createElement("span");
    quantity.textContent = item.quantity;

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", "Aumentar cantidad");
    plus.addEventListener("click", () => changeQuantity(item.id, 1));

    controls.append(minus, quantity, plus);
    bottom.append(subtotal, controls);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-item";
    remove.textContent = "Eliminar";
    remove.addEventListener("click", () => removeItem(item.id));

    line.append(title, details, bottom, remove);
    list.appendChild(line);
  });
}

$("#empty-cart")?.addEventListener("click", () => {
  if (!cart.length) {
    showToast("Tu carrito ya está vacío.");
    return;
  }
  cart = [];
  saveCart();
  renderCart();
  showToast("Carrito vaciado.");
});

// Método de pago y QR
const paymentInputs = $$('input[name="payment-method"]');
const qrPayment = $("#qr-payment");

function selectedPaymentMethod() {
  return $('input[name="payment-method"]:checked')?.value || "Efectivo";
}

function updatePaymentDisplay() {
  if (qrPayment) qrPayment.hidden = selectedPaymentMethod() !== "QR";
}

paymentInputs.forEach(input => {
  input.addEventListener("change", updatePaymentDisplay);
});
updatePaymentDisplay();

// Enviar pedido por WhatsApp
$("#checkout")?.addEventListener("click", () => {
  if (!cart.length) {
    showToast("Agrega un producto antes de hacer tu pedido.");
    return;
  }

  const lines = cart.map((item, index) => [
    `${index + 1}. ${item.name}`,
    `Cantidad: ${item.quantity}`,
    `Toppings gratis: ${item.toppings.length ? item.toppings.join(", ") : "Ninguno"}`,
    `Salsas: ${item.sauces.length ? item.sauces.join(", ") : "Ninguna"}`,
    `Subtotal: ${item.price * item.quantity} Bs`
  ].join("\n"));

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const message = [
    "¡Hola, Alfressi! 🍓💗",
    "Quiero realizar este pedido:",
    "",
    ...lines,
    "",
    `TOTAL: ${total} Bs`,
    `Forma de pago: ${selectedPaymentMethod()}`,
    "",
    "Por favor, confirmen la disponibilidad y cómo coordinar la entrega."
  ].join("\n");

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  const opened = window.open(url, "_blank");
  if (!opened) window.location.href = url;
});

// Comentarios
function renderReviews() {
  const container = $("#reviews-list");
  if (!container) return;
  container.replaceChildren();

  loadArray(REVIEW_KEY).slice(0, 12).forEach(review => {
    const card = document.createElement("article");
    card.className = "review-card";

    const name = document.createElement("h3");
    name.textContent = review.name;

    const stars = document.createElement("div");
    stars.className = "stars";
    stars.textContent = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
    stars.setAttribute("aria-label", `${review.rating} de 5 estrellas`);

    const comment = document.createElement("p");
    comment.textContent = review.text;

    card.append(name, stars, comment);
    container.appendChild(card);
  });
}

$("#review-form")?.addEventListener("submit", event => {
  event.preventDefault();

  const name = $("#review-name")?.value.trim();
  const text = $("#review-text")?.value.trim();
  const rating = Number($("#review-rating")?.value);

  if (!name || !text || rating < 1 || rating > 5) return;

  const reviews = loadArray(REVIEW_KEY);
  reviews.unshift({ name, text, rating });

  try {
    localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews.slice(0, 30)));
  } catch {
    showToast("No se pudo guardar el comentario en este navegador.");
    return;
  }

  renderReviews();
  event.target.reset();
  showToast("¡Gracias por compartir tu opinión! 💗");
});

// Año e inicio
const year = $("#year");
if (year) year.textContent = new Date().getFullYear();

updateBuilder();
renderCart();
renderReviews();