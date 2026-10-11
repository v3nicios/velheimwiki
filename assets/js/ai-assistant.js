/**
 * VALHEIM WIKI & ORÁCULO IA - AI ASSISTANT & BESTIARY ENGINE
 * Handles Natural Language Queries, Weakness Analysis, Recommended Gear & Strategies
 */

(function () {
  'use strict';

  // Global State
  let creaturesData = [];
  let weaponsData = [];
  let armorsData = [];
  let activeBiomeFilter = 'all';

  // DOM Elements
  const aiInput = document.getElementById('ai-prompt-input');
  const aiSubmitBtn = document.getElementById('ai-submit-btn');
  const aiResponseArea = document.getElementById('ai-response-area');
  const bestiaryGrid = document.getElementById('bestiary-grid');
  const biomeFilterTabs = document.getElementById('biome-filter-tabs');
  const promptChips = document.querySelectorAll('.prompt-chip');

  // Biome Colors and Translations
  const BIOME_META = {
    'Prados': { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e', en: 'Meadows' },
    'Floresta Negra': { color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.15)', border: '#14b8a6', en: 'Black Forest' },
    'Pântano': { color: '#84cc16', bg: 'rgba(132, 204, 22, 0.15)', border: '#84cc16', en: 'Swamp' },
    'Montanhas': { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: '#38bdf8', en: 'Mountain' },
    'Planícies': { color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', border: '#eab308', en: 'Plains' },
    'Terras Nebulosas': { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', en: 'Mistlands' },
    'Terras Cinzentas': { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316', en: 'Ashlands' },
    'Oceano': { color: '#0284c7', bg: 'rgba(2, 132, 199, 0.15)', border: '#0284c7', en: 'Ocean' }
  };

  // Helper: Normalize text for flexible search (lowercased, without accents)
  function normalize(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[?.,!;:]/g, ' ')
      .trim();
  }

  // Load Initial Data
  async function loadData() {
    try {
      const [creaturesRes, weaponsRes, armorsRes] = await Promise.all([
        fetch('assets/data/creatures.json'),
        fetch('assets/data/weapons.json'),
        fetch('assets/data/armors.json')
      ]);

      creaturesData = await creaturesRes.json();
      weaponsData = await weaponsRes.json();
      armorsData = await armorsRes.json();

      console.log(`Carregadas ${creaturesData.length} criaturas, ${weaponsData.length} armas, ${armorsData.length} armaduras.`);
      renderBestiaryGrid(creaturesData);
      initBiomeTabs();

      // Check if URL has a search parameter, e.g. ?q=troll
      const urlParams = new URLSearchParams(window.location.search);
      const queryParam = urlParams.get('q');
      if (queryParam) {
        aiInput.value = queryParam;
        handleAiSearch(queryParam);
      } else {
        // Pre-render Troll query by default so the user sees immediate results on load!
        handleAiSearch("como derrotar um troll ?");
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      aiResponseArea.innerHTML = `
        <div class="ai-speech-bubble" style="border-left-color: #ef4444;">
          <strong>Erro ao carregar base de conhecimento:</strong> Certifique-se de executar em um servidor HTTP local ou GitHub Pages.
        </div>
      `;
    }
  }

  // Generate SVG Avatar when creature image is missing
  function getCreatureAvatarSvg(name, biome) {
    const meta = BIOME_META[biome] || { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' };
    const initial = name ? name.charAt(0).toUpperCase() : 'V';
    return `
      <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="background:#0c101a;">
        <circle cx="50" cy="50" r="42" fill="${meta.bg}" stroke="${meta.color}" stroke-width="2" stroke-dasharray="4,2"/>
        <path d="M 50 15 L 85 50 L 50 85 L 15 50 Z" fill="none" stroke="${meta.color}" stroke-width="1.5" opacity="0.6"/>
        <text x="50" y="58" font-family="'Cinzel', serif" font-size="34" font-weight="bold" fill="#fff" text-anchor="middle" dominant-baseline="middle">${initial}</text>
      </svg>
    `;
  }

  // NLP Creature Query Resolver
  function resolveCreatureFromQuery(rawQuery) {
    const q = normalize(rawQuery);

    // Direct creature aliases & mappings
    const ALIASES = [
      { keys: ['troll', 'trolls', 'gigante azul', 'trol'], target: 'Troll' },
      { keys: ['abominacao', 'abomination', 'raiz gigante', 'monstro de madeira', 'abominacoes'], target: 'Abomination' },
      { keys: ['golem', 'golem de pedra', 'stone golem', 'pedra gigante'], target: 'Stone golem' },
      { keys: ['lobo', 'lobos', 'wolf', 'wolves'], target: 'Wolf' },
      { keys: ['mosquito', 'mosquito da morte', 'deathsquito', 'mosquitos'], target: 'Deathsquito' },
      { keys: ['seeker soldier', 'soldado seeker', 'seeker soldado'], target: 'Seeker soldier' },
      { keys: ['seeker', 'perseguidor', 'inseto das névoas', 'inseto'], target: 'Seeker' },
      { keys: ['cria de seeker', 'seeker brood', 'brood', 'larva'], target: 'Seeker brood' },
      { keys: ['gjall', 'balão de fogo', 'gjal'], target: 'Gjall' },
      { keys: ['serpente', 'serpente marinha', 'serpent', 'monstro marinho', 'cobra marinha'], target: 'Serpent' },
      { keys: ['draugr de elite', 'draugr elite'], target: 'Draugr elite' },
      { keys: ['draugr', 'draugrs', 'morto vivo'], target: 'Draugr' },
      { keys: ['esqueleto', 'esqueletos', 'skeleton', 'skeletons'], target: 'Skeleton' },
      { keys: ['restos rancosos', 'rancid remains', 'esqueleto verde'], target: 'Rancid remains' },
      { keys: ['javali', 'javalis', 'boar', 'porco'], target: 'Boar' },
      { keys: ['neck', 'necks', 'lagarto'], target: 'Neck' },
      { keys: ['cinzentinho', 'greyling', 'greylings'], target: 'Greyling' },
      { keys: ['anao cinzento', 'anao-cinzento', 'greydwarf', 'greydwarfs'], target: 'Greydwarf' },
      { keys: ['bruto', 'greydwarf brute', 'bruto anao'], target: 'Greydwarf brute' },
      { keys: ['xama', 'greydwarf shaman', 'xama anao', 'shaman'], target: 'Greydwarf shaman' },
      { keys: ['fantasma', 'ghost'], target: 'Ghost' },
      { keys: ['raiz', 'root'], target: 'Root' },
      { keys: ['gosma', 'blob', 'blobs', 'gosma venenosa'], target: 'Blob' },
      { keys: ['limo', 'oozer', 'limo gigante'], target: 'Oozer' },
      { keys: ['sanguessuga', 'sanguessugas', 'leech', 'leeches'], target: 'Leech' },
      { keys: ['surtling', 'surtlings', 'criatura de fogo', 'fogo'], target: 'Surtling' },
      { keys: ['espectro', 'wraith', 'fantasma da noite'], target: 'Wraith' },
      { keys: ['drake', 'drakes', 'dragao de gelo', 'dragao'], target: 'Drake' },
      { keys: ['fenring', 'lobisomem'], target: 'Fenring' },
      { keys: ['morcego', 'bat', 'bats'], target: 'Bat' },
      { keys: ['ulv'], target: 'Ulv' },
      { keys: ['cultista', 'cultist'], target: 'Cultist' },
      { keys: ['lox', 'loxes', 'touro gigante'], target: 'Lox' },
      { keys: ['fuling berserker', 'berserker'], target: 'Fuling berserker' },
      { keys: ['fuling xama', 'fuling shaman'], target: 'Fuling shaman' },
      { keys: ['fuling', 'fulings', 'goblin', 'goblins'], target: 'Fuling' },
      { keys: ['growth', 'massa de alcatrao', 'alcatrao', 'piche'], target: 'Growth' },
      { keys: ['dvergr', 'anao das brumas'], target: 'Dvergr' },
      { keys: ['tick', 'carrapato'], target: 'Tick' },
      { keys: ['valquiria', 'valquiria caida', 'fallen valkyrie', 'valkyrie'], target: 'Fallen Valkyrie' },
      { keys: ['morgen'], target: 'Morgen' },
      { keys: ['bonemaw', 'bonemaw serpent', 'serpente de ashlands'], target: 'Bonemaw Serpent' },
      { keys: ['asksvin', 'asksvins'], target: 'Asksvin' },
      { keys: ['volture', 'abutre'], target: 'Volture' },
      { keys: ['skugg'], target: 'Skugg' },
      { keys: ['lava blob', 'gosma de lava'], target: 'Lava Blob' },
      { keys: ['charred warrior', 'guerreiro carbonizado'], target: 'Charred Warrior' },
      { keys: ['charred marksman', 'arqueiro carbonizado'], target: 'Charred Marksman' },
      { keys: ['charred warlock', 'bruxo carbonizado'], target: 'Charred Warlock' },
      { keys: ['charred twitcher', 'tremulo carbonizado'], target: 'Charred Twitcher' }
    ];

    // Priority 1: Match explicit aliases
    for (const a of ALIASES) {
      for (const k of a.keys) {
        // match word boundary
        const regex = new RegExp(`\\b${k}\\b`, 'i');
        if (regex.test(q)) {
          const match = creaturesData.find(c => c.name_en.toLowerCase() === a.target.toLowerCase());
          if (match) return match;
        }
      }
    }

    // Priority 2: Fuzzy match with creature Portuguese or English name
    for (const c of creaturesData) {
      const namePtNorm = normalize(c.name_pt);
      const nameEnNorm = normalize(c.name_en);
      if (q.includes(namePtNorm) || q.includes(nameEnNorm)) {
        return c;
      }
    }

    // Priority 3: Biome search query (e.g. "pantano", "floresta negra", "ashlands")
    const biomes = ['pantano', 'floresta negra', 'montanha', 'planicie', 'nebulosa', 'cinzenta', 'ashlands', 'prados', 'oceano'];
    for (const b of biomes) {
      if (q.includes(b)) {
        // Return a representative creature or null to trigger biome recommendation
        return { isBiomeQuery: true, biomeTerm: b };
      }
    }

    // Default fallback: Troll
    return null;
  }

  // Handle AI Search Execution
  function handleAiSearch(query) {
    if (!query || !query.trim()) return;

    // Show simulated thinking animation
    aiResponseArea.innerHTML = `
      <div class="ai-thinking-card">
        <div class="runic-spinner"></div>
        <div class="thinking-text">O Oráculo de Valheim está decifrando as runas de combate para "${escapeHtml(query)}"...</div>
      </div>
    `;

    setTimeout(() => {
      const creature = resolveCreatureFromQuery(query);

      if (!creature) {
        renderNotFoundResponse(query);
        return;
      }

      if (creature.isBiomeQuery) {
        renderBiomeResponse(creature.biomeTerm);
        return;
      }

      renderCreatureCombatDossier(creature, query);
    }, 380);
  }

  // Render Complete AI Dossier Card
  function renderCreatureCombatDossier(c, originalQuery) {
    const biomeMeta = BIOME_META[c.biome_pt] || { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b' };

    // Primary effective damage string
    const topWeakness = c.damage_types_effective && c.damage_types_effective.length > 0 
      ? c.damage_types_effective[0].type 
      : 'Danos Físicos';

    // Build Weakness & Damage Items HTML
    let damageItemsHtml = '';
    if (c.damage_types_effective && c.damage_types_effective.length > 0) {
      c.damage_types_effective.forEach(d => {
        damageItemsHtml += `
          <div class="damage-item ${d.badge || 'weakness'}">
            <span class="damage-badge badge-${d.badge || 'weakness'}">${d.multiplier || 'Eficaz'}</span>
            <div class="damage-details">
              <div class="damage-type-name">${escapeHtml(d.type)}</div>
              <div class="damage-desc">${escapeHtml(d.desc || 'Tipo de dano altamente eficaz.')}</div>
            </div>
          </div>
        `;
      });
    }

    if (c.damage_types_resisted && c.damage_types_resisted.length > 0) {
      c.damage_types_resisted.forEach(d => {
        damageItemsHtml += `
          <div class="damage-item resisted">
            <span class="damage-badge badge-resisted">${d.multiplier || 'Resistente (0.5x)'}</span>
            <div class="damage-details">
              <div class="damage-type-name">${escapeHtml(d.type)}</div>
              <div class="damage-desc">${escapeHtml(d.desc || 'A criatura reduz este dano pela metade.')}</div>
            </div>
          </div>
        `;
      });
    }

    if (c.damage_types_immune && c.damage_types_immune.length > 0) {
      c.damage_types_immune.forEach(d => {
        damageItemsHtml += `
          <div class="damage-item immune">
            <span class="damage-badge badge-immune">${d.multiplier || 'Imune (0x)'}</span>
            <div class="damage-details">
              <div class="damage-type-name">${escapeHtml(d.type)}</div>
              <div class="damage-desc">${escapeHtml(d.desc || 'Não causa efeito.')}</div>
            </div>
          </div>
        `;
      });
    }

    // Build Recommended Weapons HTML
    let weaponsHtml = '';
    if (c.recommended_weapons && c.recommended_weapons.length > 0) {
      c.recommended_weapons.forEach(w => {
        // Try finding matching image from weaponsData
        const weaponMatch = weaponsData.find(wd => 
          normalize(wd.name_en) === normalize(w.name) || 
          normalize(w.name).includes(normalize(wd.name_en))
        );
        const wImg = weaponMatch && weaponMatch.image 
          ? `<img src="${weaponMatch.image}" alt="${escapeHtml(w.name)}" onerror="this.src='assets/images/Site-logo.webp'">`
          : `<span style="font-size:1.5rem;">🗡️</span>`;

        weaponsHtml += `
          <div class="weapon-rec-card">
            <div class="weapon-thumb">${wImg}</div>
            <div class="weapon-info">
              <div class="weapon-name">
                ${escapeHtml(w.name)}
                <span class="weapon-tag">${escapeHtml(w.type || 'Recomendada')}</span>
              </div>
              <div class="weapon-desc">${escapeHtml(w.desc || 'Excelente custo-benefício e eficácia tática.')}</div>
              ${w.ammo ? `<div class="weapon-ammo-note">🏹 <strong>Munição:</strong> ${escapeHtml(w.ammo)}</div>` : ''}
            </div>
          </div>
        `;
      });
    } else {
      weaponsHtml = `<p style="color:#94a3b8;">Armas padrão do bioma ${escapeHtml(c.biome_pt)}.</p>`;
    }

    // Recommended Armor HTML
    const recArmor = c.recommended_armor || {
      set: `Armadura do ${c.biome_pt}`,
      type: 'Balanceada',
      reason: 'Equipamento padrão de sobrevivência da era.'
    };

    // Find armor image if available
    const armorMatch = armorsData.find(ad => 
      normalize(recArmor.set).includes(normalize(ad.set_name)) ||
      normalize(ad.set_name).includes(normalize(recArmor.set))
    );
    const armorImg = armorMatch && armorMatch.image
      ? `<img src="${armorMatch.image}" alt="${escapeHtml(recArmor.set)}" onerror="this.src='assets/images/Site-logo.webp'">`
      : `<span style="font-size:1.7rem;">🛡️</span>`;

    // Process Strategy paragraphs into clean markdown-like paragraphs
    const stratParagraphs = (c.strategy_pt || '')
      .split('\n\n')
      .map(p => `<p>${formatMarkdownText(p)}</p>`)
      .join('');

    // Avatar image or SVG
    const avatarHtml = c.image 
      ? `<img src="${c.image}" alt="${escapeHtml(c.name_pt)}" class="creature-avatar-img" onerror="this.outerHTML=getCreatureAvatarSvg('${escapeHtml(c.name_pt)}', '${escapeHtml(c.biome_pt)}')">`
      : getCreatureAvatarSvg(c.name_pt, c.biome_pt);

    // AI Speech Synthesis summary
    const aiSummaryText = `
      Para derrotar o <strong>${escapeHtml(c.name_pt)}</strong>, a fraqueza primordial a explorar é <strong>${escapeHtml(topWeakness)}</strong>. 
      Utilize <strong>${escapeHtml(c.recommended_weapons ? c.recommended_weapons[0].name : 'as armas recomendadas')}</strong> mantendo o foco em 
      <strong>${escapeHtml(recArmor.set)}</strong> para equilibrar ${recArmor.type.toLowerCase().includes('leve') ? 'mobilidade e consumo de estamina ao rolar' : 'absorção de dano pesado e defesa com escudo'}. 
      Confira abaixo a análise tática completa.
    `;

    // Construct Final AI Response Card HTML
    const html = `
      <div class="ai-answer-card" id="ai-answer-target">
        <!-- AI Header Bar -->
        <div class="ai-header-bar">
          <div style="display:flex; align-items:center; gap:0.8rem;">
            <span style="font-size:1.4rem;">🔮</span>
            <div>
              <div style="font-family:var(--font-title); font-weight:700; color:#fbbf24; font-size:1.1rem;">
                Oráculo Tático de Valheim
              </div>
              <div style="font-size:0.8rem; color:#94a3b8;">
                Consulta respondida: "${escapeHtml(originalQuery)}"
              </div>
            </div>
          </div>
          <div class="ai-status-tag">
            <span class="ai-status-dot"></span>
            Combate Mapeado
          </div>
        </div>

        <!-- Creature Hero Banner -->
        <div class="creature-hero">
          <div class="creature-avatar-box">
            ${avatarHtml}
          </div>
          <div class="creature-meta-info">
            <div class="creature-biome-badge" style="background:${biomeMeta.bg}; color:${biomeMeta.color}; border:1px solid ${biomeMeta.border};">
              📍 Bioma: ${escapeHtml(c.biome_pt)} (${escapeHtml(c.biome_en || '')})
            </div>
            <h2 class="creature-name-title">${escapeHtml(c.name_pt)}</h2>
            <div class="creature-en-sub">Nome original em inglês: <em>${escapeHtml(c.name_en)}</em></div>
            <div class="creature-quick-stats">
              <div class="quick-stat-item">
                ❤️ <span>Vida: <strong>${escapeHtml(c.health || 'Base')}</strong></span>
              </div>
              <div class="quick-stat-item">
                ⚡ <span>Fraqueza-Chave: <strong style="color:#38bdf8;">${escapeHtml(topWeakness)}</strong></span>
              </div>
              <div class="quick-stat-item">
                🛡️ <span>Armadura: <strong>${escapeHtml(recArmor.type)}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Executive Speech Bubble -->
        <div class="ai-speech-bubble">
          ${aiSummaryText}
        </div>

        <!-- 4 Core Columns / Combat Grid -->
        <div class="combat-sections-grid">
          
          <!-- SEÇÃO 1: TIPOS DE DANO QUE FUNCIONAM & FRAQUEZAS -->
          <div class="combat-intel-card">
            <div class="card-title-bar">
              <span class="icon">🎯</span>
              <span>1. Tipo de Dano Eficaz & Fraquezas</span>
            </div>
            <div class="damage-types-list">
              ${damageItemsHtml}
            </div>
          </div>

          <!-- SEÇÃO 2: EXEMPLOS DE ARMAS RECOMENDADAS -->
          <div class="combat-intel-card">
            <div class="card-title-bar">
              <span class="icon">🗡️</span>
              <span>2. Armas Recomendadas para Matar</span>
            </div>
            <div class="weapons-list-group">
              ${weaponsHtml}
            </div>
          </div>

          <!-- SEÇÃO 3: ARMADURA DE PREFERÊNCIA PARA COMBATE -->
          <div class="combat-intel-card">
            <div class="card-title-bar">
              <span class="icon">🛡️</span>
              <span>3. Armadura de Preferência</span>
            </div>
            <div class="armor-rec-box">
              <div class="armor-set-header">
                <div class="armor-thumb">${armorImg}</div>
                <div class="armor-title-group">
                  <h4>${escapeHtml(recArmor.set)}</h4>
                  <span class="armor-type-badge">${escapeHtml(recArmor.type)}</span>
                </div>
              </div>
              <div class="armor-reason-text">
                <strong>Por que usar:</strong> ${escapeHtml(recArmor.reason)}
              </div>
              ${recArmor.alternative ? `
                <div class="armor-alt-text">
                  🔄 <strong>Alternativa Tática:</strong> ${escapeHtml(recArmor.alternative)}
                </div>
              ` : ''}
            </div>
          </div>

          <!-- SEÇÃO 4: SAQUES & DROPS VALIOSOS -->
          <div class="combat-intel-card">
            <div class="card-title-bar">
              <span class="icon">📦</span>
              <span>4. Saques & Drops Valiosos</span>
            </div>
            <p style="font-size:0.95rem; color:#cbd5e1; margin-bottom:0.5rem;">
              Itens obtidos ao derrotar esta criatura:
            </p>
            <div class="drops-pill-box">
              ${(c.drops || 'Recursos do jogo').split(',').map(d => `
                <span class="drop-item-tag">🎁 ${escapeHtml(d.trim())}</span>
              `).join('')}
            </div>
            <div style="margin-top:1.2rem; padding:0.8rem; background:rgba(255,255,255,0.02); border-radius:8px; font-size:0.88rem; color:#94a3b8;">
              🍖 <em>Dica de Dieta:</em> Para sobreviver a lutas intensas, combine 2 comidas de alta Vida + 1 de alta Estamina. <a href="comidas.html" style="color:#fbbf24; font-weight:700;">Ver Guia de Comidas →</a>
            </div>
          </div>

          <!-- SEÇÃO 5: ESTRATÉGIA COMPLETA DE COMBATE (LARGURA TOTAL) -->
          <div class="strategy-full-card">
            <div class="card-title-bar">
              <span class="icon">📜</span>
              <span>5. Estratégia Tática & Como Derrotar Passo a Passo</span>
            </div>
            <div class="strategy-content-pt">
              ${stratParagraphs}
            </div>
          </div>

        </div>

        <!-- Footer Bar with Quick Follow-ups -->
        <div style="padding:1.5rem 2rem; background:rgba(10,14,24,0.9); border-top:1px solid var(--border-subtle); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
          <div style="font-size:0.9rem; color:#94a3b8;">
            💡 <strong>Outras consultas rápidas:</strong>
          </div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <button class="prompt-chip" onclick="window.askOracle('Como derrotar uma Abominação?')">⚔️ Como vencer Abominação?</button>
            <button class="prompt-chip" onclick="window.askOracle('Fraqueza do Golem de Pedra')">🏔️ Fraqueza do Golem</button>
            <button class="prompt-chip" onclick="window.askOracle('Como derrotar o Seeker Soldier?')">🌫️ Seeker Soldier</button>
            <button class="prompt-chip" onclick="window.askOracle('Como matar a Serpente Marinha?')">🌊 Serpente Marinha</button>
          </div>
        </div>

      </div>
    `;

    aiResponseArea.innerHTML = html;

    // Smooth scroll into response
    const answerEl = document.getElementById('ai-answer-target');
    if (answerEl) {
      answerEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // Not Found Fallback with suggestions
  function renderNotFoundResponse(q) {
    aiResponseArea.innerHTML = `
      <div class="ai-answer-card" style="padding: 2.5rem; text-align: center;">
        <span style="font-size:3rem; margin-bottom:1rem; display:block;">🔍</span>
        <h3 style="color:#fbbf24; font-size:1.8rem; margin-bottom:0.8rem;">Criatura Não Identificada</h3>
        <p style="color:#cbd5e1; max-width:600px; margin:0 auto 1.5rem; font-size:1.05rem;">
          O Oráculo não localizou registros para "<strong>${escapeHtml(q)}</strong>". 
          Experimente pesquisar pelo nome de uma criatura ou clique em uma das sugestões abaixo:
        </p>
        <div class="prompt-chips-wrapper">
          <button class="prompt-chip" onclick="window.askOracle('Como derrotar um Troll?')">Troll</button>
          <button class="prompt-chip" onclick="window.askOracle('Como derrotar uma Abominação?')">Abominação</button>
          <button class="prompt-chip" onclick="window.askOracle('Como matar o Lobo?')">Lobo</button>
          <button class="prompt-chip" onclick="window.askOracle('Fraqueza do Golem de Pedra')">Golem de Pedra</button>
          <button class="prompt-chip" onclick="window.askOracle('Como matar o Mosquito da Morte?')">Mosquito da Morte</button>
          <button class="prompt-chip" onclick="window.askOracle('Estratégia contra Seeker Soldier')">Seeker Soldier</button>
          <button class="prompt-chip" onclick="window.askOracle('Como caçar a Serpente Marinha?')">Serpente Marinha</button>
        </div>
      </div>
    `;
  }

  // Biome Query Response
  function renderBiomeResponse(biomeTerm) {
    // Find matching creatures from this biome
    const filtered = creaturesData.filter(c => 
      normalize(c.biome_pt).includes(biomeTerm) || 
      normalize(c.biome_en).includes(biomeTerm)
    );

    const cardsHtml = filtered.map(c => `
      <div class="creature-card-item" onclick="window.askOracle('Como derrotar ${escapeHtml(c.name_pt)}?')">
        <div class="creature-card-thumb-wrap">
          ${c.image 
            ? `<img src="${c.image}" alt="${escapeHtml(c.name_pt)}" class="creature-card-thumb" onerror="this.outerHTML=getCreatureAvatarSvg('${escapeHtml(c.name_pt)}', '${escapeHtml(c.biome_pt)}')">`
            : getCreatureAvatarSvg(c.name_pt, c.biome_pt)
          }
        </div>
        <div class="creature-card-body">
          <h4 class="creature-card-name">${escapeHtml(c.name_pt)}</h4>
          <div class="creature-card-en">${escapeHtml(c.name_en)}</div>
          <div class="ask-ai-button-card">Consultar Estratégia IA ⚡</div>
        </div>
      </div>
    `).join('');

    aiResponseArea.innerHTML = `
      <div class="ai-answer-card" style="padding: 2rem;">
        <h3 style="color:#fbbf24; font-size:1.6rem; margin-bottom:0.5rem;">
          🗺️ Criaturas do Bioma: ${escapeHtml(biomeTerm.toUpperCase())}
        </h3>
        <p style="color:#94a3b8; margin-bottom:1.5rem;">
          Encontramos <strong>${filtered.length}</strong> criaturas mapeadas. Clique em qualquer criatura para ver fraquezas, armas e armaduras:
        </p>
        <div class="creatures-grid">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  // Format simple markdown bold and lists
  function formatMarkdownText(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  // Render Bestiary Grid
  function renderBestiaryGrid(list) {
    if (!bestiaryGrid) return;

    if (list.length === 0) {
      bestiaryGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 3rem;">
          Nenhuma criatura encontrada para o filtro selecionado.
        </div>
      `;
      return;
    }

    bestiaryGrid.innerHTML = list.map(c => {
      const bMeta = BIOME_META[c.biome_pt] || { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
      const avatar = c.image
        ? `<img src="${c.image}" alt="${escapeHtml(c.name_pt)}" class="creature-card-thumb" onerror="this.outerHTML=getCreatureAvatarSvg('${escapeHtml(c.name_pt)}', '${escapeHtml(c.biome_pt)}')">`
        : getCreatureAvatarSvg(c.name_pt, c.biome_pt);

      const weaknesses = (c.damage_types_effective || []).slice(0, 2).map(d => `
        <span class="damage-badge badge-${d.badge || 'weakness'}" style="font-size:0.75rem;">
          ${escapeHtml(d.type.split('(')[0].trim())}
        </span>
      `).join('');

      return `
        <div class="creature-card-item" onclick="window.askOracle('Como derrotar ${escapeHtml(c.name_pt)}?')">
          <div class="creature-card-thumb-wrap">
            ${avatar}
            <span class="card-biome-tag" style="color:${bMeta.color}; border-color:${bMeta.color};">
              ${escapeHtml(c.biome_pt)}
            </span>
          </div>
          <div class="creature-card-body">
            <h3 class="creature-card-name">${escapeHtml(c.name_pt)}</h3>
            <div class="creature-card-en">${escapeHtml(c.name_en)}</div>
            <div class="creature-card-weaknesses">
              ${weaknesses || '<span style="font-size:0.75rem; color:#94a3b8;">Dano Físico</span>'}
            </div>
            <div class="ask-ai-button-card">
              Consultar IA ⚡
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Biome Tabs Filter
  function initBiomeTabs() {
    if (!biomeFilterTabs) return;

    const biomes = [
      { id: 'all', label: 'Todos os Biomas (50)' },
      { id: 'Prados', label: 'Prados' },
      { id: 'Floresta Negra', label: 'Floresta Negra' },
      { id: 'Pântano', label: 'Pântano' },
      { id: 'Montanhas', label: 'Montanhas' },
      { id: 'Planícies', label: 'Planícies' },
      { id: 'Terras Nebulosas', label: 'Terras Nebulosas' },
      { id: 'Terras Cinzentas', label: 'Terras Cinzentas' },
      { id: 'Oceano', label: 'Oceano' }
    ];

    biomeFilterTabs.innerHTML = biomes.map(b => `
      <button class="biome-tab-btn ${b.id === 'all' ? 'active' : ''}" data-biome="${b.id}">
        ${b.label}
      </button>
    `).join('');

    biomeFilterTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.biome-tab-btn');
      if (!btn) return;

      biomeFilterTabs.querySelectorAll('.biome-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const biome = btn.getAttribute('data-biome');
      activeBiomeFilter = biome;

      if (biome === 'all') {
        renderBestiaryGrid(creaturesData);
      } else {
        const filtered = creaturesData.filter(c => c.biome_pt === biome);
        renderBestiaryGrid(filtered);
      }
    });
  }

  // Global helper accessible from window for prompt chips
  window.askOracle = function (queryText) {
    if (aiInput) {
      aiInput.value = queryText;
    }
    handleAiSearch(queryText);
    // Smooth scroll to search box
    const heroEl = document.querySelector('.hero-section');
    if (heroEl) {
      heroEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper: Escape HTML
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
  if (aiSubmitBtn) {
    aiSubmitBtn.addEventListener('click', () => {
      const q = aiInput.value.trim();
      if (q) handleAiSearch(q);
    });
  }

  if (aiInput) {
    aiInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = aiInput.value.trim();
        if (q) handleAiSearch(q);
      }
    });
  }

  promptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.textContent.replace(/^[^\w\s]+/, '').trim();
      window.askOracle(text);
    });
  });

  // Start initialization
  loadData();

})();
