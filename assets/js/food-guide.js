/**
 * VALHEIM WIKI - GUIA GASTRONÔMICO & CALCULADORA DE DIETA VIKING
 * Interactive Food Database, Filtering, Sorting and 3-Meal Diet Synergy Calculator
 */

(function () {
  'use strict';

  // State
  let foodsData = [];
  let currentFoods = [];
  let selectedDiet = []; // Up to 3 foods
  let activeForkFilter = 'all';
  let activeBiomeFilter = 'all';
  let currentSort = 'total-desc';
  let searchQuery = '';

  // DOM Elements
  const foodsGrid = document.getElementById('foods-grid');
  const foodSearchInput = document.getElementById('food-search-input');
  const biomeSelect = document.getElementById('biome-select');
  const sortSelect = document.getElementById('sort-select');
  const forkFilterChips = document.getElementById('fork-filter-chips');
  const dietSlotsContainer = document.getElementById('diet-slots-container');
  const dietTotalHealth = document.getElementById('diet-total-health');
  const dietTotalStamina = document.getElementById('diet-total-stamina');
  const dietTotalEitr = document.getElementById('diet-total-eitr');
  const dietArchetypeBadge = document.getElementById('diet-archetype-badge');
  const clearDietBtn = document.getElementById('clear-diet-btn');
  const foodCountLabel = document.getElementById('food-count-label');

  // Load Saved Diet from LocalStorage
  function loadSavedDiet() {
    try {
      const saved = localStorage.getItem('valheim_viking_diet');
      if (saved) {
        selectedDiet = JSON.parse(saved);
      }
    } catch (e) {
      selectedDiet = [];
    }
  }

  function saveDiet() {
    try {
      localStorage.setItem('valheim_viking_diet', JSON.stringify(selectedDiet));
    } catch (e) {}
  }

  // Load Foods Data
  async function loadFoods() {
    try {
      const res = await fetch('assets/data/foods.json');
      foodsData = await res.json();
      currentFoods = [...foodsData];
      console.log(`Carregadas ${foodsData.length} comidas de Valheim.`);

      loadSavedDiet();
      updateDietCalculatorUI();
      applyFiltersAndSort();
    } catch (err) {
      console.error('Erro ao carregar comidas:', err);
      if (foodsGrid) {
        foodsGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; color: #ef4444; padding: 3rem;">
            Erro ao carregar o cardápio de comidas. Certifique-se de executar via servidor local ou GitHub Pages.
          </div>
        `;
      }
    }
  }

  // Fallback SVG for food icons
  function getFoodFallbackSvg(food) {
    let icon = '🥩';
    let color = '#ef4444';

    if (food.fork_type === 'Yellow') {
      icon = '⚡';
      color = '#eab308';
    } else if (food.fork_type === 'Blue') {
      icon = '🔮';
      color = '#8b5cf6';
    } else if (food.fork_type === 'White') {
      icon = '⚖️';
      color = '#94a3b8';
    }

    if (food.name_en.toLowerCase().includes('fish')) icon = '🐟';
    if (food.name_en.toLowerCase().includes('soup') || food.name_en.toLowerCase().includes('stew')) icon = '🍲';
    if (food.name_en.toLowerCase().includes('mushroom')) icon = '🍄';
    if (food.name_en.toLowerCase().includes('bread') || food.name_en.toLowerCase().includes('pie')) icon = '🍞';
    if (food.name_en.toLowerCase().includes('jam') || food.name_en.toLowerCase().includes('berry')) icon = '🫐';
    if (food.name_en.toLowerCase().includes('honey')) icon = '🍯';

    return `
      <svg width="100%" height="100%" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style="background:#0c101a;">
        <circle cx="40" cy="40" r="32" fill="rgba(255,255,255,0.03)" stroke="${color}" stroke-width="2" stroke-dasharray="3,2"/>
        <text x="40" y="47" font-size="28" text-anchor="middle" dominant-baseline="middle">${icon}</text>
      </svg>
    `;
  }

  // Diet Calculator Logic
  function addFoodToDiet(foodId) {
    const food = foodsData.find(f => f.id === foodId);
    if (!food) return;

    // Check if food already in diet (in Valheim you can only eat 1 of each type!)
    if (selectedDiet.some(f => f.id === food.id)) {
      alert(`O viking já está saciado com ${food.name_pt}! Em Valheim, cada uma das 3 comidas deve ser diferente.`);
      return;
    }

    if (selectedDiet.length >= 3) {
      // Replace oldest or alert
      selectedDiet.shift(); // remove first, add new
    }

    selectedDiet.push(food);
    saveDiet();
    updateDietCalculatorUI();

    // Visual feedback scroll to calculator if needed
    const panel = document.getElementById('diet-calc-target');
    if (panel) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function removeFoodFromDiet(index) {
    selectedDiet.splice(index, 1);
    saveDiet();
    updateDietCalculatorUI();
  }

  function clearDiet() {
    selectedDiet = [];
    saveDiet();
    updateDietCalculatorUI();
  }

  function updateDietCalculatorUI() {
    let totalHealth = 0;
    let totalStamina = 0;
    let totalEitr = 0;

    // Render Slots
    let slotsHtml = '';
    for (let i = 0; i < 3; i++) {
      const food = selectedDiet[i];
      if (food) {
        totalHealth += food.health;
        totalStamina += food.stamina;
        totalEitr += food.eitr;

        const imgHtml = food.image 
          ? `<img src="${food.image}" alt="${escapeHtml(food.name_pt)}" onerror="this.outerHTML=getFoodFallbackSvg(${JSON.stringify(food)})">`
          : getFoodFallbackSvg(food);

        slotsHtml += `
          <div class="diet-slot-item filled">
            <button class="slot-remove-btn" title="Remover comida" onclick="window.removeDietMeal(${i})">✕</button>
            <div class="slot-filled-content">
              <div class="slot-img-wrap">
                ${imgHtml}
              </div>
              <div class="slot-food-details">
                <div class="slot-food-name">${escapeHtml(food.name_pt)}</div>
                <div class="slot-stat-mini">
                  <span style="color:#ef4444; font-weight:700;">+${food.health} HP</span>
                  <span style="color:#eab308; font-weight:700;">+${food.stamina} ST</span>
                  ${food.eitr > 0 ? `<span style="color:#8b5cf6; font-weight:700;">+${food.eitr} EI</span>` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        slotsHtml += `
          <div class="diet-slot-item">
            <div class="slot-empty-placeholder">
              <span style="font-size:1.8rem; display:block; margin-bottom:0.3rem; opacity:0.4;">🍖</span>
              Slot de Comida ${i + 1} Vazio
              <div style="font-size:0.75rem; color:#64748b; margin-top:0.2rem;">Clique em "+ Adicionar" abaixo</div>
            </div>
          </div>
        `;
      }
    }

    if (dietSlotsContainer) {
      dietSlotsContainer.innerHTML = slotsHtml;
    }

    // Base Viking character stats: 25 base health, 50 base stamina
    const finalHealth = 25 + totalHealth;
    const finalStamina = 50 + totalStamina;
    const finalEitr = totalEitr;

    if (dietTotalHealth) dietTotalHealth.textContent = `${finalHealth} HP`;
    if (dietTotalStamina) dietTotalStamina.textContent = `${finalStamina} ST`;
    if (dietTotalEitr) dietTotalEitr.textContent = `${finalEitr} EITR`;

    // Calculate Archetype
    let archetype = '🍗 Dieta Inicial / Incompleta';
    if (selectedDiet.length === 3) {
      if (totalEitr >= 100) {
        archetype = '🔮 Mago de Eitr / Conjurador Elemental';
      } else if (totalHealth >= 130 && totalHealth > totalStamina * 1.3) {
        archetype = '🛡️ Tanque Berserker / Brutamontes Nórdico';
      } else if (totalStamina >= 150 && totalStamina > totalHealth * 1.3) {
        archetype = '⚡ Explorador Ágil / Mestre Arqueiro';
      } else {
        archetype = '⚔️ Andarilho Equilibrado de Valheim';
      }
    } else if (selectedDiet.length > 0) {
      archetype = `Dieta em Montagem (${selectedDiet.length}/3 comidas)`;
    }

    if (dietArchetypeBadge) {
      dietArchetypeBadge.textContent = archetype;
    }
  }

  // Filter & Sort Logic
  function applyFiltersAndSort() {
    let result = [...foodsData];

    // Search query (matches Portuguese, English, or Ingredients)
    if (searchQuery.trim()) {
      const q = normalize(searchQuery);
      result = result.filter(f => 
        normalize(f.name_pt).includes(q) ||
        normalize(f.name_en).includes(q) ||
        normalize(f.recipe_pt).includes(q) ||
        normalize(f.recipe_en).includes(q) ||
        normalize(f.craft_station_pt).includes(q)
      );
    }

    // Fork Focus filter
    if (activeForkFilter !== 'all') {
      result = result.filter(f => f.fork_type.toLowerCase() === activeForkFilter.toLowerCase());
    }

    // Biome filter
    if (activeBiomeFilter !== 'all') {
      result = result.filter(f => f.biome_pt === activeBiomeFilter || f.biome_en === activeBiomeFilter);
    }

    // Sorting
    result.sort((a, b) => {
      switch (currentSort) {
        case 'health-desc':
          return b.health - a.health;
        case 'stamina-desc':
          return b.stamina - a.stamina;
        case 'eitr-desc':
          return b.eitr - a.eitr;
        case 'total-desc':
          return b.total - a.total;
        case 'duration-desc':
          return parseInt(b.duration) - parseInt(a.duration);
        case 'name-asc':
          return a.name_pt.localeCompare(b.name_pt, 'pt-BR');
        default:
          return b.total - a.total;
      }
    });

    currentFoods = result;
    renderFoodCards(currentFoods);

    if (foodCountLabel) {
      foodCountLabel.textContent = `Exibindo ${currentFoods.length} de ${foodsData.length} comidas`;
    }
  }

  // Render Food Cards
  function renderFoodCards(foods) {
    if (!foodsGrid) return;

    if (foods.length === 0) {
      foodsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 4rem;">
          <span style="font-size:3rem; display:block; margin-bottom:1rem;">🍲</span>
          <h3>Nenhuma comida encontrada com os filtros selecionados</h3>
          <p style="margin-top:0.5rem; color:#64748b;">Tente buscar por outro ingrediente como "carne", "nabo", "mel" ou "cebola".</p>
        </div>
      `;
      return;
    }

    const maxHp = 85;
    const maxSt = 85;
    const maxEitr = 85;

    foodsGrid.innerHTML = foods.map(f => {
      const imgHtml = f.image 
        ? `<img src="${f.image}" alt="${escapeHtml(f.name_pt)}" onerror="this.outerHTML=getFoodFallbackSvg(${JSON.stringify(f)})">`
        : getFoodFallbackSvg(f);

      const hpPercent = Math.min(100, Math.round((f.health / maxHp) * 100));
      const stPercent = Math.min(100, Math.round((f.stamina / maxSt) * 100));
      const eitrPercent = f.eitr > 0 ? Math.min(100, Math.round((f.eitr / maxEitr) * 100)) : 0;

      // Check if already in diet
      const isSelected = selectedDiet.some(item => item.id === f.id);

      return `
        <div class="food-card" id="food-${f.id}">
          <div class="food-card-top">
            <div class="food-avatar-box">
              ${imgHtml}
            </div>
            <div class="food-title-group">
              <h3 class="food-name-pt">${escapeHtml(f.name_pt)}</h3>
              <div class="food-name-en">${escapeHtml(f.name_en)}</div>
              <span class="food-biome-pill" style="background:${f.fork_color}25; color:${f.fork_color}; border:1px solid ${f.fork_color};">
                ${escapeHtml(f.fork_pt)} • ${escapeHtml(f.biome_pt || 'Geral')}
              </span>
            </div>
          </div>

          <!-- Dynamic Stat Bars -->
          <div class="food-stats-bars">
            <div class="stat-bar-row">
              <span class="stat-name-label health">❤️ Vida</span>
              <div class="stat-progress-track">
                <div class="stat-fill-bar health" style="width: ${hpPercent}%;"></div>
              </div>
              <span class="stat-val-text">+${f.health}</span>
            </div>

            <div class="stat-bar-row">
              <span class="stat-name-label stamina">⚡ Vigor</span>
              <div class="stat-progress-track">
                <div class="stat-fill-bar stamina" style="width: ${stPercent}%;"></div>
              </div>
              <span class="stat-val-text">+${f.stamina}</span>
            </div>

            ${f.eitr > 0 ? `
              <div class="stat-bar-row">
                <span class="stat-name-label eitr">🔮 Eitr</span>
                <div class="stat-progress-track">
                  <div class="stat-fill-bar eitr" style="width: ${eitrPercent}%;"></div>
                </div>
                <span class="stat-val-text">+${f.eitr}</span>
              </div>
            ` : ''}
          </div>

          <!-- Recipe & Crafting Station -->
          <div class="food-recipe-box">
            <div class="recipe-header">🛠️ Como é feita / Receita:</div>
            <div class="recipe-text-pt">${escapeHtml(f.recipe_pt)}</div>
            <div class="station-text-pt">🪵 <strong>Bancada:</strong> ${escapeHtml(f.craft_station_pt)}</div>
          </div>

          <!-- Duration & Healing Rate -->
          <div class="food-duration-row">
            <span>⏱️ <strong>Duração:</strong> ${escapeHtml(f.duration)}</span>
            <span>💚 <strong>Regen:</strong> ${escapeHtml(f.heal_rate)} hp/s</span>
          </div>

          <!-- Add to Diet Button -->
          <button class="add-diet-btn" onclick="window.addDietMeal('${f.id}')" ${isSelected ? 'style="background:#10b981; color:#000;"' : ''}>
            ${isSelected ? '✓ Adicionada ao Combo' : '+ Adicionar ao Combo (Dieta)'}
          </button>
        </div>
      `;
    }).join('');
  }

  // Global window functions
  window.addDietMeal = function (foodId) {
    addFoodToDiet(foodId);
  };

  window.removeDietMeal = function (index) {
    removeFoodFromDiet(index);
  };

  function normalize(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Event Listeners
  if (foodSearchInput) {
    foodSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      applyFiltersAndSort();
    });
  }

  if (biomeSelect) {
    biomeSelect.addEventListener('change', (e) => {
      activeBiomeFilter = e.target.value;
      applyFiltersAndSort();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      applyFiltersAndSort();
    });
  }

  if (forkFilterChips) {
    forkFilterChips.addEventListener('click', (e) => {
      const btn = e.target.closest('.fork-chip-btn');
      if (!btn) return;

      forkFilterChips.querySelectorAll('.fork-chip-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      activeForkFilter = btn.getAttribute('data-fork');
      applyFiltersAndSort();
    });
  }

  if (clearDietBtn) {
    clearDietBtn.addEventListener('click', () => {
      clearDiet();
    });
  }

  // Init
  loadFoods();

})();
