// AURA E-Commerce Application Script

// ==========================================
// 1. Mock Database Products
// ==========================================
const PRODUCTS = [
    {
        id: 1,
        title: "AeroSound Max ANC Headphones",
        category: "tech",
        price: 299.99,
        rating: 4.9,
        reviews: 124,
        badge: "Best Seller",
        description: "Studio-grade active noise-cancelling headphones featuring 40-hour battery life, high-resolution audio, custom EQ profiles, and ultra-breathable memory foam ear cushions for long listening sessions.",
        images: [
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?auto=format&fit=crop&w=600&q=80"
        ],
        colors: [
            { name: "Matte Black", value: "#1a1a1a" },
            { name: "Slate Silver", value: "#d1d5db" },
            { name: "Nordic Gold", value: "#e5c158" }
        ],
        sizes: ["Standard"]
    },
    {
        id: 2,
        title: "Nova Charge Duo Stand",
        category: "tech",
        price: 79.99,
        rating: 4.7,
        reviews: 86,
        badge: "New Release",
        description: "A sleek, heavy-base magnetic charging stand crafted from aerospace-grade aluminum. Powers your smartphone and wireless earbuds simultaneously with fast wireless Qi charging technology.",
        images: [
            "https://images.unsplash.com/photo-1622445262465-2481c4574875?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80"
        ],
        colors: [
            { name: "Space Gray", value: "#374151" },
            { name: "Polar White", value: "#f9fafb" }
        ],
        sizes: ["Standard"]
    },
    {
        id: 3,
        title: "Chronos Slate Hybrid Watch",
        category: "lifestyle",
        price: 189.99,
        rating: 4.6,
        reviews: 58,
        badge: "Featured",
        description: "Blending classic analog design with modern biometric monitoring. Tracks heart rate, sleep metrics, and daily steps behind a minimalist sapphire crystal display with 14-day battery reserve.",
        images: [
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=600&q=80"
        ],
        colors: [
            { name: "Obsidian Black", value: "#111827" },
            { name: "Saddle Leather", value: "#b45309" }
        ],
        sizes: ["40mm", "44mm"]
    },
    {
        id: 4,
        title: "Lumina Smart Desk LED Bar",
        category: "tech",
        price: 59.99,
        rating: 4.8,
        reviews: 93,
        badge: "Studio Pack",
        description: "An architectural monitor-mounted light bar with customizable color temperatures, dimming, and back-facing RGB ambient lighting to reduce eye strain and perfect your desktop workspace aesthetics.",
        images: [
            "https://images.unsplash.com/photo-1534067783941-51c9c23eccfd?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1507646227500-4d389b0012be?auto=format&fit=crop&w=600&q=80"
        ],
        colors: [
            { name: "Carbon Fiber", value: "#1f2937" }
        ],
        sizes: ["Standard"]
    },
    {
        id: 5,
        title: "Apex Mechanical Keyboard",
        category: "tech",
        price: 149.99,
        rating: 4.9,
        reviews: 142,
        badge: "Mechanical",
        description: "A compact 75% mechanical keyboard built with hot-swappable tactile brown switches, double-shot PBT keycaps, sound-dampening foam inserts, and a premium solid aluminum outer chassis.",
        images: [
            "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80"
        ],
        colors: [
            { name: "Dark Slate", value: "#1f2937" },
            { name: "Minimal Chalk", value: "#f3f4f6" }
        ],
        sizes: ["Tactile Brown", "Linear Red"]
    },
    {
        id: 6,
        title: "Velo Leather Laptop Sleeve",
        category: "gear",
        price: 45.99,
        rating: 4.5,
        reviews: 37,
        badge: "Handcrafted",
        description: "Hand-stitched premium vegan leather sleeve designed specifically for ultraportable laptops. Features a soft microfiber interior lining, secure magnetic closure flap, and a rear accessory pocket.",
        images: [
            "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80"
        ],
        colors: [
            { name: "Tan Brown", value: "#78350f" },
            { name: "Ash Gray", value: "#4b5563" }
        ],
        sizes: ["13-Inch", "15-Inch"]
    },
    {
        id: 7,
        title: "Orion Waterproof Backpack",
        category: "gear",
        price: 125.00,
        rating: 4.8,
        reviews: 74,
        badge: "Limited Edition",
        description: "A rugged, waterproof modular commuter backpack featuring a padded 16-inch laptop compartment, hidden security pockets, expandable side pockets, and ergonomically padded air-mesh shoulder straps.",
        images: [
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=600&q=80"
        ],
        colors: [
            { name: "Stealth Black", value: "#111827" },
            { name: "Forest Green", value: "#065f46" }
        ],
        sizes: ["20 Liters", "25 Liters"]
    },
    {
        id: 8,
        title: "Iris Sleep & Health Ring",
        category: "lifestyle",
        price: 219.00,
        rating: 4.4,
        reviews: 29,
        badge: "Smart Wear",
        description: "A lightweight titanium smart ring that seamlessly monitors your sleep cycles, heart rate variability, and body temperature. Integrates with the AURA health dashboard app.",
        images: [
            "https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=600&q=80"
        ],
        colors: [
            { name: "Brushed Chrome", value: "#9ca3af" },
            { name: "Deep Gold", value: "#d97706" }
        ],
        sizes: ["Size 7", "Size 9", "Size 11"]
    }
];

// ==========================================
// 2. Global State Management
// ==========================================
let cart = JSON.parse(localStorage.getItem('aura_cart')) || [];
let activeCategory = "all";
let searchQuery = "";
let sortBy = "featured";

// Quickview Modal Temporary Config Selection
let qvActiveProduct = null;
let qvSelectedColor = null;
let qvSelectedSize = null;

// ==========================================
// 3. Initialization & Event Binding
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Theme Toggle Initialization
    initTheme();

    // Render Products Initial
    renderProducts();

    // Render Cart
    updateCartUI();

    // Check Auth status from cached token
    checkAuthStatus();

    // Global Search Event Listeners
    const searchInput = document.getElementById("global-search");
    const mobileSearchInput = document.getElementById("mobile-search");

    searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        if (mobileSearchInput) mobileSearchInput.value = searchQuery;
        renderProducts();
    });

    if (mobileSearchInput) {
        mobileSearchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            searchInput.value = searchQuery;
            renderProducts();
        });
    }

    // Category Filter Chips
    const chips = document.querySelectorAll(".filter-chip");
    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            chips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            activeCategory = chip.dataset.category;
            renderProducts();
        });
    });

    // Sorting selector
    const sortSelect = document.getElementById("sort-select");
    sortSelect.addEventListener("change", (e) => {
        sortBy = e.target.value;
        renderProducts();
    });

    // Drawer Toggle Event Listeners
    const cartToggle = document.getElementById("cart-toggle");
    const cartClose = document.getElementById("cart-close");
    const cartOverlay = document.getElementById("cart-overlay");
    const cartDrawer = document.getElementById("cart-drawer");

    cartToggle.addEventListener("click", () => cartDrawer.classList.add("active"));
    cartClose.addEventListener("click", () => cartDrawer.classList.remove("active"));
    cartOverlay.addEventListener("click", () => cartDrawer.classList.remove("active"));

    // Quick View Modals Triggers
    const qvClose = document.getElementById("quickview-close");
    const qvOverlay = document.getElementById("quickview-overlay");
    const qvModal = document.getElementById("quickview-modal");

    const closeQV = () => qvModal.classList.remove("active");
    qvClose.addEventListener("click", closeQV);
    qvOverlay.addEventListener("click", closeQV);

    // Quick View Quantity Controls
    const qtyMinusBtn = document.getElementById("qv-qty-minus");
    const qtyPlusBtn = document.getElementById("qv-qty-plus");
    const qtyInput = document.getElementById("qv-qty-input");

    qtyMinusBtn.addEventListener("click", () => {
        let val = parseInt(qtyInput.value) || 1;
        if (val > 1) qtyInput.value = val - 1;
    });
    qtyPlusBtn.addEventListener("click", () => {
        let val = parseInt(qtyInput.value) || 1;
        if (val < 10) qtyInput.value = val + 1;
    });

    // Quick View Add To Bag
    const qvAddToCartBtn = document.getElementById("qv-add-to-cart");
    qvAddToCartBtn.addEventListener("click", () => {
        if (!qvActiveProduct) return;
        const qty = parseInt(qtyInput.value) || 1;
        addToCart(qvActiveProduct.id, qvSelectedColor, qvSelectedSize, qty);
        closeQV();
    });

    // Checkout Modal
    const checkoutBtn = document.getElementById("checkout-btn");
    const checkoutClose = document.getElementById("checkout-close");
    const checkoutOverlay = document.getElementById("checkout-overlay");
    const checkoutModal = document.getElementById("checkout-modal");

    const closeCheckout = () => {
        checkoutModal.classList.remove("active");
        // Reset steps
        document.getElementById("checkout-step-form").classList.add("active");
        document.getElementById("checkout-step-success").classList.remove("active");
    };

    // Auth Modal Toggles
    const userToggle = document.getElementById("user-toggle");
    userToggle.addEventListener("click", () => {
        if (currentUser) {
            openAuthModal("profile");
        } else {
            openAuthModal("login");
        }
    });

    const authClose = document.getElementById("auth-close");
    const authOverlay = document.getElementById("auth-overlay");
    authClose.addEventListener("click", closeAuthModal);
    authOverlay.addEventListener("click", closeAuthModal);

    // Auth View Switchers
    document.getElementById("go-to-signup").addEventListener("click", (e) => {
        e.preventDefault();
        switchAuthView("signup");
    });
    document.getElementById("go-to-login").addEventListener("click", (e) => {
        e.preventDefault();
        switchAuthView("login");
    });
    document.getElementById("otp-back-to-login").addEventListener("click", (e) => {
        e.preventDefault();
        switchAuthView("login");
    });

    // Auth Form Submit Listeners
    const loginForm = document.getElementById("auth-login-form");
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;
        
        const submitBtn = document.getElementById("login-submit-btn");
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner" style="width:14px; height:14px; border-width:2px; display:inline-block; margin:0; vertical-align:middle; margin-right:6px;"></span> Sign in...`;
        
        try {
            const res = await fetch(`${AUTHEASY_API_BASE}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'autheasy_7887ad40_e2cbc59b_37452f3b'
                },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (data.success) {
                localStorage.setItem("aura_user_token", data.data.accessToken);
                currentUser = data.data.user;
                localStorage.setItem("aura_user_profile", JSON.stringify(currentUser));
                
                updateUserNavUI();
                closeAuthModal();
                showToast(`Welcome back, ${currentUser.name}! 👋`, "success");
            } else {
                if (res.status === 403 && data.message.toLowerCase().includes("verified")) {
                    showToast("Please verify your email first.", "info");
                    await resendSignupOtp(email);
                    openAuthModal("otp", email);
                } else {
                    showToast(data.message || "Invalid credentials", "error");
                }
            }
        } catch (err) {
            console.error("Login error:", err);
            showToast("Server connection failed", "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    });

    const signupForm = document.getElementById("auth-signup-form");
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("signup-name").value;
        const email = document.getElementById("signup-email").value;
        const password = document.getElementById("signup-password").value;
        
        const submitBtn = document.getElementById("signup-submit-btn");
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner" style="width:14px; height:14px; border-width:2px; display:inline-block; margin:0; vertical-align:middle; margin-right:6px;"></span> Registering...`;
        
        try {
            const res = await fetch(`${AUTHEASY_API_BASE}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'autheasy_7887ad40_e2cbc59b_37452f3b'
                },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            
            if (data.success) {
                showToast("Account created! Verify code sent to email.", "success");
                openAuthModal("otp", email);
            } else {
                showToast(data.message || "Registration failed", "error");
            }
        } catch (err) {
            console.error("Signup error:", err);
            showToast("Server connection failed", "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    });

    const otpForm = document.getElementById("auth-otp-form");
    otpForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const code = document.getElementById("otp-code").value;
        
        const submitBtn = document.getElementById("otp-submit-btn");
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner" style="width:14px; height:14px; border-width:2px; display:inline-block; margin:0; vertical-align:middle; margin-right:6px;"></span> Verifying...`;
        
        try {
            const res = await fetch(`${AUTHEASY_API_BASE}/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'autheasy_7887ad40_e2cbc59b_37452f3b'
                },
                body: JSON.stringify({ email: otpEmail, otp: code })
            });
            const data = await res.json();
            
            if (data.success) {
                localStorage.setItem("aura_user_token", data.data.accessToken);
                currentUser = data.data.user;
                localStorage.setItem("aura_user_profile", JSON.stringify(currentUser));
                
                updateUserNavUI();
                closeAuthModal();
                showToast("Email verified! Welcome to AURA 🚀", "success");
            } else {
                showToast(data.message || "Invalid verification code", "error");
            }
        } catch (err) {
            console.error("OTP verification error:", err);
            showToast("Server connection failed", "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    });

    const resendLink = document.getElementById("otp-resend-link");
    resendLink.addEventListener("click", async (e) => {
        e.preventDefault();
        if (resendLink.classList.contains("disabled")) return;
        
        try {
            await resendSignupOtp(otpEmail);
            startOtpTimer(30);
        } catch (err) {
            console.error("Resend error:", err);
        }
    });

    const logoutBtn = document.getElementById("auth-logout-btn");
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("aura_user_token");
        localStorage.removeItem("aura_user_profile");
        currentUser = null;
        updateUserNavUI();
        closeAuthModal();
        showToast("Logged out successfully", "info");
    });

    checkoutBtn.addEventListener("click", () => {
        // Only open if cart is not empty
        if (cart.length === 0) return;
        
        // Ensure user is logged in
        if (!currentUser) {
            cartDrawer.classList.remove("active");
            showToast("Please sign in to proceed to checkout", "info");
            openAuthModal("login");
            return;
        }
        
        // Hide cart drawer
        cartDrawer.classList.remove("active");
        
        // Set totals in checkout modal
        const subtotal = calculateSubtotal();
        document.getElementById("checkout-amount-due").innerText = `$${subtotal.toFixed(2)}`;
        
        // Pre-fill user details in checkout
        document.getElementById("address-name").value = currentUser.name || "";
        document.getElementById("address-email").value = currentUser.email || "";
        
        checkoutModal.classList.add("active");
    });

    checkoutClose.addEventListener("click", closeCheckout);
    checkoutOverlay.addEventListener("click", closeCheckout);

    // Payment Form Submission Simulator
    const paymentForm = document.getElementById("payment-form");
    paymentForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById("submit-order-btn");
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner" style="width:16px; height:16px; border-width:2px; display:inline-block; margin:0;"></span> Processing Payment...`;

        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
            
            // Switch to success view
            document.getElementById("checkout-step-form").classList.remove("active");
            document.getElementById("checkout-step-success").classList.add("active");
            
            // Populate Receipt
            populateReceipt();
            
            // Clear Cart State
            cart = [];
            localStorage.removeItem('aura_cart');
            updateCartUI();
            
            showToast("Order placed successfully!", "success");
        }, 1800);
    });

    // Success Screen button
    const successCloseBtn = document.getElementById("success-close-btn");
    successCloseBtn.addEventListener("click", closeCheckout);
});

// ==========================================
// 4. Dark/Light Theme Handler
// ==========================================
function initTheme() {
    const themeToggle = document.getElementById("theme-toggle");
    const savedTheme = localStorage.getItem("aura_theme") || "dark";
    
    document.documentElement.setAttribute("data-theme", savedTheme);

    themeToggle.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("aura_theme", newTheme);
        
        showToast(`Switched to ${newTheme === "dark" ? "Dark" : "Light"} Mode`, "info");
    });
}

// ==========================================
// 5. Rendering Product Grid
// ==========================================
function renderProducts() {
    const grid = document.getElementById("product-grid");
    
    // Filter
    let filtered = PRODUCTS.filter(p => {
        const matchesCategory = activeCategory === "all" || p.category === activeCategory;
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              p.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Sort
    if (sortBy === "price-low") {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
        filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
        filtered.sort((a, b) => b.rating - a.rating);
    } // else featured default

    // If empty
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="grid-loader">
                <i data-lucide="package-search" style="width: 48px; height: 48px; color: var(--text-muted);"></i>
                <p>No products match your criteria. Try another search.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    grid.innerHTML = filtered.map(product => {
        return `
            <article class="product-card">
                <div class="card-img-wrapper" onclick="openQuickView(${product.id})">
                    <img src="${product.images[0]}" alt="${product.title}" loading="lazy">
                    ${product.badge ? `<span class="card-badge-overlay">${product.badge}</span>` : ''}
                    <div class="card-btn-overlay" onclick="event.stopPropagation()">
                        <button class="card-action-btn" onclick="openQuickView(${product.id})">
                            <i data-lucide="eye"></i>
                            Quick View
                        </button>
                        <button class="card-action-btn icon-only" onclick="quickAdd(${product.id})" aria-label="Quick Add to Bag">
                            <i data-lucide="shopping-bag"></i>
                        </button>
                    </div>
                </div>
                <div class="card-content" onclick="openQuickView(${product.id})">
                    <span class="card-category">${product.category}</span>
                    <h3 class="card-title">${product.title}</h3>
                    <div class="card-meta-row">
                        <span class="card-price">$${product.price.toFixed(2)}</span>
                        <div class="card-rating">
                            <i data-lucide="star"></i>
                            <span>${product.rating}</span>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    lucide.createIcons();
}

// ==========================================
// 6. Quick Add (directly from card)
// ==========================================
function quickAdd(id) {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return;
    
    // Pick first color and size as default
    const color = product.colors[0] ? product.colors[0].name : "Standard";
    const size = product.sizes[0] || "Standard";
    
    addToCart(id, color, size, 1);
}

// ==========================================
// 7. Shopping Cart State Operations
// ==========================================
function addToCart(productId, color, size, qty) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    // Check if duplicate exists
    const existingIndex = cart.findIndex(item => 
        item.productId === productId && 
        item.color === color && 
        item.size === size
    );

    if (existingIndex > -1) {
        cart[existingIndex].qty += qty;
    } else {
        cart.push({
            productId,
            title: product.title,
            price: product.price,
            image: product.images[0],
            color,
            size,
            qty
        });
    }

    localStorage.setItem('aura_cart', JSON.stringify(cart));
    updateCartUI();
    showToast(`Added ${qty}x ${product.title} to bag`, "success");

    // Animate badge
    const badge = document.querySelector('.cart-badge');
    if (badge) {
        badge.classList.remove('pop');
        void badge.offsetWidth; // Trigger reflow
        badge.classList.add('pop');
    }
}

function updateCartQuantity(index, newQty) {
    if (newQty < 1) {
        removeFromCart(index);
        return;
    }
    cart[index].qty = newQty;
    localStorage.setItem('aura_cart', JSON.stringify(cart));
    updateCartUI();
}

function removeFromCart(index) {
    const itemTitle = cart[index].title;
    cart.splice(index, 1);
    localStorage.setItem('aura_cart', JSON.stringify(cart));
    updateCartUI();
    showToast(`Removed ${itemTitle} from bag`, "info");
}

function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

// ==========================================
// 8. Update Cart Panel UI
// ==========================================
function updateCartUI() {
    const cartBody = document.getElementById("cart-body");
    const badge = document.querySelector(".cart-badge");
    const subtotalLabel = document.getElementById("cart-subtotal");
    const totalLabel = document.getElementById("cart-total");
    const checkoutBtn = document.getElementById("checkout-btn");

    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    badge.innerText = totalItems;
    badge.style.display = totalItems > 0 ? "flex" : "none";

    if (cart.length === 0) {
        cartBody.innerHTML = `
            <div class="cart-empty-state">
                <i data-lucide="shopping-bag"></i>
                <h3>Your Bag is Empty</h3>
                <p>Add some premium workspace essentials to get started.</p>
                <button onclick="document.getElementById('cart-drawer').classList.remove('active')" class="btn btn-secondary mt-4">
                    Continue Browsing
                </button>
            </div>
        `;
        subtotalLabel.innerText = "$0.00";
        totalLabel.innerText = "$0.00";
        checkoutBtn.disabled = true;
        lucide.createIcons();
        return;
    }

    checkoutBtn.disabled = false;

    cartBody.innerHTML = cart.map((item, idx) => {
        return `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.title}" class="cart-item-img">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.title}</h4>
                    <p class="cart-item-variant">${item.color} / ${item.size}</p>
                    <span class="cart-item-price">$${item.price.toFixed(2)}</span>
                </div>
                <div class="cart-item-controls">
                    <button class="item-remove-btn" onclick="removeFromCart(${idx})">
                        <i data-lucide="trash-2"></i>
                        Remove
                    </button>
                    <div class="quantity-controls">
                        <button onclick="updateCartQuantity(${idx}, ${item.qty - 1})"><i data-lucide="minus"></i></button>
                        <span>${item.qty}</span>
                        <button onclick="updateCartQuantity(${idx}, ${item.qty + 1})"><i data-lucide="plus"></i></button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const subtotal = calculateSubtotal();
    subtotalLabel.innerText = `$${subtotal.toFixed(2)}`;
    totalLabel.innerText = `$${subtotal.toFixed(2)}`; // Shipping is free!

    lucide.createIcons();
}

// ==========================================
// 9. Quick View Modal Configuration
// ==========================================
function openQuickView(id) {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return;

    qvActiveProduct = product;
    
    // Set initial configuration selection
    qvSelectedColor = product.colors[0] ? product.colors[0].name : "Standard";
    qvSelectedSize = product.sizes[0] || "Standard";

    // Set DOM elements
    document.getElementById("qv-category").innerText = product.category;
    document.getElementById("qv-title").innerText = product.title;
    document.getElementById("qv-rating").innerText = product.rating;
    document.getElementById("qv-price").innerText = `$${product.price.toFixed(2)}`;
    document.getElementById("qv-description").innerText = product.description;
    
    // Set Main Image
    const mainImg = document.getElementById("qv-main-image");
    mainImg.src = product.images[0];
    mainImg.alt = product.title;

    // Reset Qty input
    document.getElementById("qv-qty-input").value = 1;

    // Render Thumbnails
    const thumbContainer = document.getElementById("qv-thumbnails");
    if (product.images.length > 1) {
        thumbContainer.innerHTML = product.images.map((img, idx) => `
            <button class="thumbnail-btn ${idx === 0 ? 'active' : ''}" onclick="changeQvImage('${img}', this)">
                <img src="${img}" alt="Thumbnail View">
            </button>
        `).join('');
    } else {
        thumbContainer.innerHTML = "";
    }

    // Render Color Options
    const colorContainer = document.getElementById("qv-colors");
    if (product.colors.length > 0 && product.colors[0].value) {
        colorContainer.parentElement.style.display = "block";
        colorContainer.innerHTML = product.colors.map((c, idx) => `
            <button class="color-swatch ${idx === 0 ? 'active' : ''}" title="${c.name}" onclick="selectQvColor('${c.name}', this)">
                <span class="color-inner" style="background-color: ${c.value}"></span>
            </button>
        `).join('');
    } else {
        colorContainer.parentElement.style.display = "none";
    }

    // Render Size Options
    const sizeContainer = document.getElementById("qv-sizes");
    if (product.sizes.length > 0) {
        sizeContainer.parentElement.style.display = "block";
        sizeContainer.innerHTML = product.sizes.map((s, idx) => `
            <button class="size-chip ${idx === 0 ? 'active' : ''}" onclick="selectQvSize('${s}', this)">
                ${s}
            </button>
        `).join('');
    } else {
        sizeContainer.parentElement.style.display = "none";
    }

    // Toggle Modal Class
    document.getElementById("quickview-modal").classList.add("active");
    
    lucide.createIcons();
}

function changeQvImage(src, btn) {
    document.getElementById("qv-main-image").src = src;
    
    // Toggle active border
    const thumbs = document.querySelectorAll(".thumbnail-btn");
    thumbs.forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
}

function selectQvColor(colorName, btn) {
    qvSelectedColor = colorName;
    const swatches = document.querySelectorAll(".color-swatch");
    swatches.forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
}

function selectQvSize(sizeName, btn) {
    qvSelectedSize = sizeName;
    const chips = document.querySelectorAll(".size-chip");
    chips.forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
}

// ==========================================
// 10. Checkout Receipt Simulation
// ==========================================
function populateReceipt() {
    const list = document.getElementById("receipt-items-list");
    const subtotal = calculateSubtotal();
    
    // List Items
    list.innerHTML = cart.map(item => `
        <div class="receipt-item-row">
            <span>${item.qty}x ${item.title} (${item.size})</span>
            <span>$${(item.price * item.qty).toFixed(2)}</span>
        </div>
    `).join('');

    // Totals
    document.getElementById("receipt-total-val").innerText = `$${subtotal.toFixed(2)}`;

    // Set Random Receipt ID
    const randomId = Math.floor(10000 + Math.random() * 90000);
    document.getElementById("receipt-id").innerText = `#AURA-${randomId}`;
}

// ==========================================
// 11. Toast System
// ==========================================
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    const iconName = type === "success" ? "check-circle" : "info";
    
    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();

    // Remove toast after duration
    setTimeout(() => {
        toast.classList.add("removing");
        toast.addEventListener("animationend", () => {
            toast.remove();
        });
    }, 3000);
}

// ==========================================
// 12. AuthEasy Integration Helper Logic
// ==========================================
let currentUser = null;
let otpEmail = "";
let timerInterval = null;

// Dynamically determine the AuthEasy backend URL based on host environment
const AUTHEASY_API_BASE = (window.location.origin && window.location.origin !== 'null' && !window.location.origin.includes('5173') && !window.location.origin.includes('8080'))
    ? `${window.location.origin}/api/v1/auth`
    : 'http://localhost:4000/api/v1/auth';

async function checkAuthStatus() {
    const token = localStorage.getItem("aura_user_token");
    const cachedProfile = localStorage.getItem("aura_user_profile");
    
    if (token) {
        if (cachedProfile) {
            currentUser = JSON.parse(cachedProfile);
            updateUserNavUI();
        }
        
        try {
            const res = await fetch(`${AUTHEASY_API_BASE}/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'autheasy_7887ad40_e2cbc59b_37452f3b',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                currentUser = data.data;
                localStorage.setItem("aura_user_profile", JSON.stringify(currentUser));
                updateUserNavUI();
            } else {
                localStorage.removeItem("aura_user_token");
                localStorage.removeItem("aura_user_profile");
                currentUser = null;
                updateUserNavUI();
            }
        } catch (err) {
            console.warn("Failed to check auth with server (offline/network). Keeping cached user session.");
        }
    }
}

function openAuthModal(view = "login", email = "") {
    const modal = document.getElementById("auth-modal");
    modal.classList.add("active");
    switchAuthView(view, email);
}

function closeAuthModal() {
    document.getElementById("auth-modal").classList.remove("active");
    if (timerInterval) clearInterval(timerInterval);
}

function switchAuthView(view, email = "") {
    const views = document.querySelectorAll(".auth-view");
    views.forEach(v => v.classList.remove("active"));
    
    if (view === "login") {
        document.getElementById("auth-view-login").classList.add("active");
    } else if (view === "signup") {
        document.getElementById("auth-view-signup").classList.add("active");
    } else if (view === "otp") {
        otpEmail = email;
        document.getElementById("otp-subtitle").innerText = `We sent a 6-digit verification code to ${email}`;
        document.getElementById("auth-view-otp").classList.add("active");
        document.getElementById("otp-code").value = "";
        startOtpTimer(30);
    } else if (view === "profile") {
        if (currentUser) {
            document.getElementById("profile-name").innerText = currentUser.name || 'Premium Member';
            document.getElementById("profile-email").innerText = currentUser.email || '';
            document.getElementById("auth-view-profile").classList.add("active");
        }
    }
}

const resendSignupOtp = async (email) => {
    try {
        const res = await fetch(`${AUTHEASY_API_BASE}/resend-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'autheasy_7887ad40_e2cbc59b_37452f3b'
            },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.success) {
            showToast("Verification code resent to email", "success");
        } else {
            showToast(data.message || "Failed to resend code", "error");
        }
    } catch (err) {
        showToast("Connection failed", "error");
    }
};

const startOtpTimer = (seconds) => {
    const timerSpan = document.getElementById("otp-timer");
    const resendBtn = document.getElementById("otp-resend-link");
    
    resendBtn.classList.add("disabled");
    timerSpan.style.display = "inline";
    
    let remaining = seconds;
    timerSpan.innerText = `Resend in ${remaining}s`;
    
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(timerInterval);
            resendBtn.classList.remove("disabled");
            timerSpan.style.display = "none";
        } else {
            timerSpan.innerText = `Resend in ${remaining}s`;
        }
    }, 1000);
};

function updateUserNavUI() {
    const userToggle = document.getElementById("user-toggle");
    if (!userToggle) return;
    
    if (currentUser) {
        userToggle.classList.add("logged-in");
        userToggle.style.borderColor = "var(--success-color)";
        userToggle.style.boxShadow = "0 0 8px var(--success-glow)";
        userToggle.innerHTML = `<i data-lucide="user-check"></i>`;
    } else {
        userToggle.classList.remove("logged-in");
        userToggle.style.borderColor = "";
        userToggle.style.boxShadow = "";
        userToggle.innerHTML = `<i data-lucide="user"></i>`;
    }
    lucide.createIcons();
}
