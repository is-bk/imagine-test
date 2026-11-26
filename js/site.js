"use strict";

function initMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.getElementById(toggle.getAttribute("aria-controls"));

  function closeMenu(restoreFocus = false) {
    toggle.setAttribute("aria-expanded", "false");
    if (restoreFocus) toggle.focus();
  }

  toggle.hidden = false;
  toggle.parentElement.classList.add("is-enhanced");

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  toggle.parentElement.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      closeMenu(true);
    }
  });
}

function initFilters() {
  const filters = document.querySelector("[data-filters]");
  if (!filters) return;

  const buttons = Array.from(filters.querySelectorAll("button"));
  const cards = document.querySelectorAll(".catalog-grid [data-category]");
  const status = document.querySelector("[data-filter-status]");

  function showCategory(category) {
    const selected = buttons.some((button) => button.dataset.filter === category) ? category : "tous";
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === selected)));
    let visible = 0;
    cards.forEach((card) => {
      card.hidden = selected !== "tous" && card.dataset.category !== selected;
      if (!card.hidden) visible++;
    });
    status.textContent = visible === 1 ? "1 produit affiché." : visible + " produits affichés.";
  }

  filters.hidden = false;
  showCategory(new URLSearchParams(location.search).get("categorie"));

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    const category = button.dataset.filter;
    showCategory(category);

    const url = new URL(location.href);
    if (category === "tous") {
      url.searchParams.delete("categorie");
    } else {
      url.searchParams.set("categorie", category);
    }
    history.replaceState(null, "", url);
  });
}

function initVisuals() {
  const dialog = document.querySelector("[data-visual-dialog]");
  if (!dialog || typeof dialog.showModal !== "function") return;

  const title = dialog.querySelector("h2");
  const image = dialog.querySelector("img");
  const quoteLink = dialog.querySelector("a");
  let trigger;

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-visual]");
    if (!link || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();

    trigger = link;
    title.textContent = link.dataset.visual;
    image.src = link.href;
    image.alt = link.dataset.visual;
    quoteLink.href = link.dataset.devis;
    dialog.showModal();
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    if (trigger) trigger.focus({ preventScroll: true });
  });
}

const textileSupport = ["Technique", ["DTF", "Sublimation", "À définir"]];
const textileColor = ["Couleur du support", ["Blanc", "Couleur", "À définir"]];
const textile = [textileSupport, textileColor];
const rectoVerso = ["Faces imprimées", ["Recto", "Recto verso", "À définir"]];
const vinylQuality = ["Qualité", ["Standard", "Haute qualité", "À définir"]];

const productSpecs = {
  tshirt: textile,
  lacoste: textile,
  casquette: textile,
  gilet: textile,
  flyers: [["Support", ["Papier"]], rectoVerso],
  carte: [["Support", ["Papier 250 g/m²", "Papier 350 g/m²", "PVC", "À définir"]], rectoVerso],
  brochure: [["Support", ["Papier"]]],
  bache: [["Support", ["Bâche"]], ["Type", ["Mate", "Roll-up", "À définir"]]],
  vinyle: [["Support", ["Vinyle adhésif"]], vinylQuality],
  on_way: [["Support", ["Vinyle microperforé (One Way)"]], vinylQuality],
};

function initQuote() {
  const form = document.querySelector("[data-quote]");
  if (!form) return;

  const { produit, support, finition, quantite, nom, telephone, details } = form.elements;
  const summary = document.querySelector("[data-quote-summary]");
  const status = form.querySelector("[data-quote-status]");
  const messageLink = status.querySelector("[data-quote-link]");
  const selectedProduct = new URLSearchParams(location.search).get("produit");
  const specs = [support, finition];
  const quantityFormat = new Intl.NumberFormat("fr");

  function productLabel() {
    return produit.value ? produit.selectedOptions[0].text : "";
  }

  function updateSummary() {
    summary.querySelector('[data-summary="produit"]').textContent = productLabel() || "À choisir";
    summary.querySelector('[data-summary="quantite"]').textContent =
      quantite.validity.valid ? quantityFormat.format(quantite.valueAsNumber) : "À renseigner";

    specs.forEach((field) => {
      const summaryValue = summary.querySelector('[data-summary="' + field.name + '"]');
      summaryValue.textContent = field.value || "À préciser";
    });
  }

  function updateProduct() {
    const options = Object.prototype.hasOwnProperty.call(productSpecs, produit.value) ? productSpecs[produit.value] : [];
    specs.forEach((field, index) => {
      const summaryValue = summary.querySelector('[data-summary="' + field.name + '"]');
      const row = summaryValue.parentElement;
      const [label, choices] = options[index] || ["", []];
      const enabled = choices.length > 0;

      field.closest("[data-spec-field]").hidden = !enabled;
      field.disabled = !enabled;
      field.required = enabled;
      row.hidden = !enabled;
      field.options.length = 0;
      if (!enabled) return;

      field.labels[0].textContent = label;
      row.querySelector("dt").textContent = label;
      if (choices.length > 1) field.add(new Option("Sélectionner", ""));
      choices.forEach((choice) => field.add(new Option(choice, choice)));
    });
    updateSummary();
  }

  if (selectedProduct && Array.from(produit.options).some((option) => option.value === selectedProduct)) {
    produit.value = selectedProduct;
  }
  updateProduct();
  form.hidden = false;
  summary.hidden = false;

  produit.addEventListener("change", updateProduct);
  form.addEventListener("input", (event) => {
    event.target.setCustomValidity("");
    status.hidden = true;
    updateSummary();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nom.value.trim();
    const phone = telephone.value.trim();
    const digits = phone.replace(/\D/g, "");
    const quantity = quantite.valueAsNumber;

    nom.setCustomValidity(name ? "" : "Indiquez votre nom ou celui de votre entreprise.");
    const validPhone = /^\+?[\d ().-]+$/.test(phone) && digits.length >= 7 && digits.length <= 15;
    telephone.setCustomValidity(validPhone ? "" : "Saisissez un numéro de téléphone de 7 à 15 chiffres.");
    quantite.setCustomValidity(Number.isSafeInteger(quantity) ? "" : "Saisissez une quantité entière.");
    if (!form.reportValidity()) return;

    const message = [
      "Bonjour IMAGINE GROUP, je souhaite demander un devis.",
      "",
      "Produit : " + productLabel(),
      ...specs.filter((field) => !field.disabled).map((field) => field.labels[0].textContent + " : " + field.value),
      "Quantité : " + quantityFormat.format(quantity),
      "Nom ou entreprise : " + name,
      "Téléphone : " + phone,
    ];
    if (details.value.trim()) message.push("Détails : " + details.value.trim());

    const url = new URL(form.dataset.whatsapp);
    url.searchParams.set("text", message.join("\n"));
    messageLink.href = url.href;
    status.hidden = false;
    window.open(url.href, "_blank", "noopener,noreferrer");
  });
}

initMenu();
initFilters();
initVisuals();
initQuote();
