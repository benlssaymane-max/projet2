(() => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  const detail = document.getElementById("productDetail");
  const toast = document.getElementById("toast");

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function formatCurrency(value) {
    return `${value.toFixed(2)} EUR`;
  }

  function addToCart(id) {
    const key = "electroshop_cart";
    const cart = JSON.parse(localStorage.getItem(key) || "[]");
    cart.push(id);
    localStorage.setItem(key, JSON.stringify(cart));
  }

  async function init() {
    if (!productId) {
      detail.innerHTML = "<p>Produit introuvable.</p>";
      return;
    }

    const response = await fetch(`/api/products/${productId}`);
    if (!response.ok) {
      detail.innerHTML = "<p>Produit introuvable.</p>";
      return;
    }

    const product = await response.json();

    detail.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <div class="product-body">
        <p class="eyebrow">${product.category}</p>
        <h1>${product.name}</h1>
        <p>${product.description}</p>
        <strong>${formatCurrency(Number(product.price))}</strong>
        <h3>Specifications</h3>
        <ul class="product-specs">
          ${product.specs.map((spec) => `<li>${spec}</li>`).join("")}
        </ul>
        <div class="hero-cta">
          <button id="addDetailCart" class="btn btn-primary" type="button">Ajouter au panier</button>
          <a class="btn btn-ghost" href="index.html">Continuer les achats</a>
        </div>
      </div>
    `;

    const addButton = document.getElementById("addDetailCart");
    addButton.addEventListener("click", () => {
      addToCart(product.id);
      showToast("Produit ajoute au panier");
    });

    detail.classList.add("show");
  }

  init().catch((error) => {
    console.error(error);
    detail.innerHTML = "<p>Erreur lors du chargement du produit.</p>";
  });
})();
