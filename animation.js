// ====================================================
// DESIGN CONFIG
// ====================================================
const PRODUCTS_PER_CYCLE = 3;
const CYCLE_DURATION = 8; // Seconds to hold products on screen (Increased for better visibility)
const TRANSITION_DURATION = 2.5; // Entrance/Exit speed

let PRODUCTS = [];
let currentBatchIndex = 0;

// ====================================================
// INITIALIZATION
// ====================================================
async function init() {
  console.log("Initializing template...");
  await loadProducts();
  
  // Initialize Background Animations
  initBackgroundAnimation();
  initDecor();

  // Start the first cycle
  if (PRODUCTS.length > 0) {
    console.log("Starting cycle with " + PRODUCTS.length + " products.");
    startCycle(0);
  } else {
    console.error("No products loaded. Cycle aborted.");
    // Show a "No Products" message on UI
    const container = document.getElementById('products-container');
    container.innerHTML = '<div style="color:rgba(255,255,255,0.5); font-size: 30px; text-align:center; margin-top: 400px; font-family: sans-serif;">Waiting for products...</div>';
  }
}

async function loadProducts() {
  try {
    const response = await fetch('./products.json');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    PRODUCTS = data.products || [];
    console.log("Products loaded:", PRODUCTS);
  } catch (error) {
    console.error('Failed to load products.json:', error);
    PRODUCTS = [];
  }
}

// ====================================================
// BACKGROUND & ATMOSPHERE
// ====================================================
function initBackgroundAnimation() {
  // 1. Riverbed Parallax (Very subtle zoom/pan)
  gsap.to('#riverbed', {
    scale: 1.15,
    duration: 30,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1
  });

  // 2. Water Flow (Infinite Scroll)
  // Layer 1: Main flow
  gsap.to('.layer-1', {
    x: -500, // Move texture left
    y: 200,  // Move texture down (diagonal flow)
    duration: 40,
    ease: "none",
    repeat: -1,
    modifiers: {
      x: gsap.utils.unitize(x => parseFloat(x) % 1000), // Seamless loop logic if texture repeats
      y: gsap.utils.unitize(y => parseFloat(y) % 1000)
    }
  });

  // Layer 2: Secondary flow (slower, different angle)
  gsap.to('.layer-2', {
    x: -300,
    y: 100,
    duration: 60,
    ease: "none",
    repeat: -1,
    modifiers: {
      x: gsap.utils.unitize(x => parseFloat(x) % 1000),
      y: gsap.utils.unitize(y => parseFloat(y) % 1000)
    }
  });
}

function initDecor() {
  const container = document.getElementById('decor-container');
  
  // Create drifting lotus flowers
  const lotusUrl = 'https://skoop-general.s3.us-east-1.amazonaws.com/n8n_image_gen%2Ffloating_lotus-1771373947680.png';
  
  for (let i = 0; i < 4; i++) {
    const lotus = document.createElement('img');
    lotus.src = lotusUrl;
    lotus.className = 'floating-lotus';
    container.appendChild(lotus);

    // Initial random placement
    gsap.set(lotus, {
      x: Math.random() * 1920,
      y: Math.random() * 1080,
      scale: Math.random() * 0.3 + 0.2, // Small scale
      rotation: Math.random() * 360,
      opacity: 0
    });

    animateLotus(lotus);
  }
}

function animateLotus(element) {
  // Reset to start (left of screen)
  const startY = Math.random() * 900 + 50;
  const scale = Math.random() * 0.3 + 0.2;
  const duration = 25 + Math.random() * 15; // Slow drift
  
  gsap.set(element, {
    x: -200,
    y: startY,
    scale: scale,
    opacity: 0.8,
    rotation: Math.random() * 360
  });

  // Main drift movement
  gsap.to(element, {
    x: 2100, // Move past right edge
    duration: duration,
    ease: "none",
    rotation: "+=180",
    onComplete: () => animateLotus(element)
  });

  // Gentle bobbing
  gsap.to(element, {
    y: "+=30",
    duration: 3 + Math.random() * 2,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut"
  });
}

// ====================================================
// PRODUCT CYCLE LOGIC
// ====================================================
function getBatch(batchIndex) {
  if (PRODUCTS.length === 0) return [];
  
  const start = (batchIndex * PRODUCTS_PER_CYCLE) % PRODUCTS.length;
  const batch = [];
  
  // Handle wrapping around if near end of array
  for (let i = 0; i < PRODUCTS_PER_CYCLE; i++) {
    batch.push(PRODUCTS[(start + i) % PRODUCTS.length]);
  }
  return batch;
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  
  // Price formatting
  let priceDisplay = `<span class="product-price">${product.price}</span>`;
  if (product.discounted_price > 0 && product.discounted_price < parseFloat(product.price.replace('$',''))) {
    priceDisplay = `
      <span class="product-old-price">${product.price}</span>
      <span class="product-price">${product.discounted_price}</span>
    `;
  }

  // HTML Structure
  card.innerHTML = `
    <div class="product-image-wrapper">
      <img class="product-image" src="${product.image_url}" alt="${product.name}">
      ${product.strainType ? `<div class="strain-badge">${product.strainType}</div>` : ''}
    </div>
    <div class="product-info">
      <div class="product-vendor">${product.vendor || 'Premium Collection'}</div>
      <h2 class="product-name">${product.name}</h2>
      <div class="product-meta">${product.category} • ${product.unitWeight}g</div>
      <div class="product-price-wrapper">
        ${priceDisplay}
      </div>
    </div>
  `;

  return card;
}

function startCycle(batchIndex) {
  const container = document.getElementById('products-container');
  const batch = getBatch(batchIndex);
  
  if (batch.length === 0) return;

  // Clear previous cycle
  container.innerHTML = ''; 

  const cards = [];
  const cardWidth = 380;
  const gap = 60;
  // Calculate total width of the group to center it
  const totalWidth = (cardWidth * PRODUCTS_PER_CYCLE) + (gap * (PRODUCTS_PER_CYCLE - 1));
  const startX = (1920 - totalWidth) / 2;

  // Create elements and set initial state
  batch.forEach((product, i) => {
    const card = createProductCard(product);
    container.appendChild(card);
    cards.push(card);

    const finalX = startX + (i * (cardWidth + gap));
    const finalY = 280; // Vertically centered

    // Store target strictly on the object
    card._finalX = finalX;

    // Set Initial State (Off-screen Left)
    gsap.set(card, { 
      x: -500 - (i * 200), // Staggered start positions off-screen left
      y: finalY,
      opacity: 0,
      scale: 0.8,
      rotation: -5
    });
    
    // Continuous gentle bobbing (Independent of timeline, killed on exit)
    // We add this immediately so it's active during entrance too
    gsap.to(card, {
        y: "+=20",
        duration: 2 + (i * 0.3),
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: Math.random() // Random phase
    });
  });

  // Master Timeline
  const tl = gsap.timeline({
    onComplete: () => {
      // Clean up ANY remaining tweens on these cards before removing
      gsap.killTweensOf(cards);
      // Recursively call next batch
      startCycle(batchIndex + 1);
    }
  });

  // 1. Entrance: Float in to center
  tl.to(cards, {
    x: (i) => cards[i]._finalX,
    opacity: 1,
    scale: 1,
    rotation: 0,
    duration: 3,
    stagger: 0.2,
    ease: "power3.out" // Strong easing out to ensure they stop
  });

  // 2. Idle Drift: Slowly drift right while waiting
  // This ensures they are "moving down the river" but very slowly
  tl.to(cards, {
    x: "+=60", // Move 60px right over 8 seconds
    duration: CYCLE_DURATION,
    ease: "none"
  }, "-=0.5"); // Start slightly before entrance finishes

  // 3. Exit: Float away to right rapidly
  tl.to(cards, {
    x: (i) => 1920 + 200 + (i * 100), // Definitively off-screen right
    opacity: 0,
    scale: 0.9,
    rotation: 5,
    duration: 2,
    stagger: 0.1,
    ease: "power2.in"
  });
}

// Start
window.addEventListener('DOMContentLoaded', init);
