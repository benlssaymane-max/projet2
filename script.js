(() => {
  const selectors = {
    menuToggle: document.getElementById("menuToggle"),
    nav: document.getElementById("mainNav"),
    cartButton: document.getElementById("cartButton"),
    cartPanel: document.getElementById("cartPanel"),
    closeCart: document.getElementById("closeCart"),
    clearCart: document.getElementById("clearCart"),
    checkoutBtn: document.getElementById("checkoutBtn"),
    cartCount: document.getElementById("cartCount"),
    cartList: document.getElementById("cartList"),
    cartTotal: document.getElementById("cartTotal"),
    toast: document.getElementById("toast"),
    year: document.getElementById("year"),
    contactForm: document.getElementById("contactForm"),
    revealBlocks: document.querySelectorAll(".reveal"),
    productGrid: document.getElementById("productGrid")
  };

  const storageKey = "electroshop_cart";
  let cart = loadCart();

  function loadCart() {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Unable to load cart:", error);
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(storageKey, JSON.stringify(cart));
  }

  function formatCurrency(value) {
    return `${value.toFixed(2)} EUR`;
  }

  function showToast(message) {
    selectors.toast.textContent = message;
    selectors.toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => selectors.toast.classList.remove("show"), 1900);
  }

  function renderCart(products = []) {
    selectors.cartCount.textContent = String(cart.length);
    selectors.cartList.innerHTML = "";

    if (!cart.length) {
      const empty = document.createElement("li");
      empty.textContent = "Panier vide";
      selectors.cartList.appendChild(empty);
      selectors.cartTotal.textContent = formatCurrency(0);
      return;
    }

    let total = 0;
    cart.forEach((itemId) => {
      const item = products.find((product) => product.id === itemId);
      if (!item) {
        return;
      }
      total += Number(item.price);

      const li = document.createElement("li");
      li.innerHTML = `<span>${item.name}</span><strong>${formatCurrency(Number(item.price))}</strong>`;
      selectors.cartList.appendChild(li);
    });

    selectors.cartTotal.textContent = formatCurrency(total);
  }

  function addToCart(productId) {
    cart.push(productId);
    saveCart();
  }

  function toggleMenu() {
    const isOpen = selectors.nav.classList.toggle("open");
    selectors.menuToggle.setAttribute("aria-expanded", String(isOpen));
  }

  function openCart() {
    selectors.cartPanel.classList.add("open");
    selectors.cartPanel.setAttribute("aria-hidden", "false");
  }

  function closeCart() {
    selectors.cartPanel.classList.remove("open");
    selectors.cartPanel.setAttribute("aria-hidden", "true");
  }

  function setupRevealAnimation() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    selectors.revealBlocks.forEach((block) => observer.observe(block));
  }

  function setupHeroParallax() {
    const hero = document.querySelector(".hero");
    if (!hero || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }
    const shapeA = hero.querySelector(".hero-shape-a");
    const shapeB = hero.querySelector(".hero-shape-b");
    if (!shapeA || !shapeB) {
      return;
    }

    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      shapeA.style.transform = `translate3d(${x * 24}px, ${y * 24}px, 0)`;
      shapeB.style.transform = `translate3d(${x * -20}px, ${y * -20}px, 0)`;
    });

    hero.addEventListener("pointerleave", () => {
      shapeA.style.transform = "";
      shapeB.style.transform = "";
    });
  }

  function setupAdvancedHero3D() {
    const mount = document.getElementById("hero3d");
    const hero = document.querySelector(".hero");
    if (!mount || !hero || !window.THREE) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { THREE } = window;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0b1220, 8, 22);

    const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 100);
    camera.position.set(0, 0.35, 6.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x66ddff, 0.55);
    scene.add(ambient);

    const rimLight = new THREE.PointLight(0x22d3ee, 2.1, 35);
    rimLight.position.set(3.5, 1.8, 4);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0x1d4ed8, 1.5, 30);
    fillLight.position.set(-3.8, -1.2, 2.4);
    scene.add(fillLight);

    const coreGeometry = new THREE.IcosahedronGeometry(1.12, 14);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x6ee7ff,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.62,
      metalness: 0.8,
      roughness: 0.2,
      transmission: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.15
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    const ringA = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.03, 20, 220),
      new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.55 })
    );
    ringA.rotation.x = Math.PI * 0.4;
    ringA.rotation.y = Math.PI * 0.1;
    scene.add(ringA);

    const ringB = new THREE.Mesh(
      new THREE.TorusGeometry(2.35, 0.02, 18, 220),
      new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.4 })
    );
    ringB.rotation.x = -Math.PI * 0.35;
    ringB.rotation.y = -Math.PI * 0.25;
    scene.add(ringB);

    const particleCount = 1800;
    const positionArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const i3 = i * 3;
      const radius = 3.2 + Math.random() * 5.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positionArray[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positionArray[i3 + 1] = radius * Math.cos(phi) * 0.5;
      positionArray[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positionArray, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0x7dd3fc,
        size: 0.04,
        transparent: true,
        opacity: 0.82
      })
    );
    scene.add(particles);

    const pointer = { x: 0, y: 0 };
    const scrollState = { targetZ: 6.6, targetY: 0.35, factor: 0 };
    window.addEventListener("pointermove", (event) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    });

    const updateScrollState = () => {
      const rect = hero.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height * 0.9, 1)));
      scrollState.factor = progress;
      scrollState.targetZ = 6.6 - progress * 1.9;
      scrollState.targetY = 0.35 + progress * 0.28;
      hero.style.setProperty("--film", progress.toFixed(3));
    };
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    function resize() {
      const width = mount.clientWidth || window.innerWidth;
      const height = mount.clientHeight || 460;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    resize();
    window.addEventListener("resize", resize);

    let rafId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      if (!reduceMotion) {
        core.rotation.x = t * 0.22;
        core.rotation.y = t * 0.35;
        ringA.rotation.z = t * 0.18;
        ringB.rotation.z = -t * 0.14;
        particles.rotation.y = t * 0.03;
        particles.rotation.x = Math.sin(t * 0.25) * 0.08;
      }

      camera.position.x += ((pointer.x * 0.55) - camera.position.x) * 0.05;
      camera.position.y += ((-pointer.y * 0.2 + scrollState.targetY) - camera.position.y) * 0.05;
      camera.position.z += (scrollState.targetZ - camera.position.z) * 0.06;
      camera.lookAt(0, 0, 0);
      rimLight.intensity = 2.1 + scrollState.factor * 0.9;
      fillLight.intensity = 1.5 - scrollState.factor * 0.45;
      particles.material.opacity = 0.82 - scrollState.factor * 0.3;

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(animate);
    };

    animate();

    window.addEventListener("beforeunload", () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      renderer.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      particleGeometry.dispose();
    });
  }

  function setupProductTilt() {
    if (!window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    selectors.productGrid.querySelectorAll(".product-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const rx = ((y / rect.height) - 0.5) * -10;
        const ry = ((x / rect.width) - 0.5) * 10;
        card.style.setProperty("--mx", `${(x / rect.width) * 100}%`);
        card.style.setProperty("--my", `${(y / rect.height) * 100}%`);
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      });

      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  function renderProducts(products) {
    selectors.productGrid.innerHTML = "";

    products.forEach((product) => {
      const article = document.createElement("article");
      article.className = "product-card";
      article.innerHTML = `
        <img class="product-media" src="${product.image}" alt="${product.name}" loading="lazy" />
        <div class="product-body">
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <div class="product-row">
            <strong>${formatCurrency(Number(product.price))}</strong>
            <button class="btn btn-small btn-primary" data-product-id="${product.id}">Ajouter</button>
          </div>
          <a class="detail-link" href="product.html?id=${product.id}">Voir details</a>
        </div>
      `;
      selectors.productGrid.appendChild(article);
    });
  }

  async function submitContactForm(event) {
    event.preventDefault();

    const payload = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      message: document.getElementById("message").value.trim()
    };

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      showToast("Echec envoi contact");
      return;
    }

    selectors.contactForm.reset();
    showToast("Message envoye");
  }

  async function checkout() {
    if (!cart.length) {
      showToast("Votre panier est vide");
      return;
    }

    selectors.checkoutBtn.disabled = true;
    selectors.checkoutBtn.textContent = "Redirection...";

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart })
      });

      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Checkout error");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      showToast("Stripe non configure ou erreur checkout");
    } finally {
      selectors.checkoutBtn.disabled = false;
      selectors.checkoutBtn.textContent = "Payer";
    }
  }

  function setupEvents(products) {
    selectors.menuToggle.addEventListener("click", toggleMenu);

    selectors.nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        selectors.nav.classList.remove("open");
        selectors.menuToggle.setAttribute("aria-expanded", "false");
      });
    });

    selectors.productGrid.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-product-id]");
      if (!button) {
        return;
      }
      addToCart(button.dataset.productId);
      renderCart(products);
      showToast("Produit ajoute au panier");
    });

    selectors.cartButton.addEventListener("click", openCart);
    selectors.closeCart.addEventListener("click", closeCart);

    selectors.clearCart.addEventListener("click", () => {
      cart = [];
      saveCart();
      renderCart(products);
      showToast("Panier vide");
    });

    selectors.checkoutBtn.addEventListener("click", checkout);
    selectors.contactForm.addEventListener("submit", submitContactForm);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeCart();
      }
    });
  }

  async function init() {
    selectors.year.textContent = String(new Date().getFullYear());
    setupRevealAnimation();
    setupHeroParallax();
    setupAdvancedHero3D();

    const response = await fetch("/api/products");
    const products = await response.json();

    renderProducts(products);
    setupProductTilt();
    renderCart(products);
    setupEvents(products);
  }

  init().catch((error) => {
    console.error(error);
    showToast("Impossible de charger la boutique");
  });
})();
