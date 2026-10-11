# 🛡️ Valheim Wiki & Oráculo IA

Guia tático de combate com inteligência artificial e compêndio gastronômico para o jogo **Valheim**, desenvolvido 100% em **Português Brasileiro (PT-BR)** e otimizado para hospedagem estática gratuita no **GitHub Pages**.

---

## 🚀 Funcionalidades Principais

### 1. ⚔️ Oráculo IA de Combate (`index.html`)
- **Consulta em Linguagem Natural**: Pesquise como em uma IA:
  - *"Como derrotar um troll ?"*
  - *"Qual a fraqueza da Abominação ?"*
  - *"Melhor arma contra o Golem de Pedra ?"*
  - *"Que armadura usar contra o Lobo ?"*
  - *"Estratégia contra Seeker Soldier"*
  - *"Como caçar a Serpente Marinha ?"*
- **Retorno Tático Completo**:
  - 🎯 **Tipos de Dano Eficazes & Fraquezas**: Vulnerabilidades (ex: Perfurante/Pierce 1.5x, Fogo), resistências (0.5x) e imunidades.
  - 🗡️ **Armas Recomendadas**: Armas ideais para a luta, categorias, munição sugerida e motivos táticos.
  - 🛡️ **Armadura de Preferência**: Conjuntos ideais com análise de mobilidade leve vs armadura pesada.
  - 📜 **Estratégia de Combate Passo a Passo**: Padrões de ataque, janelas de esquiva com rolamento (I-frames), aparas (parry), perigo de curandeiros e truques de terreno.
  - 📦 **Saques & Drops Valiosos**.
- **Bestiário Interativo dos 8 Biomas**: Navegue visualmente pelas 50 criaturas organizadas por Prados, Floresta Negra, Pântano, Montanhas, Planícies, Terras Nebulosas, Terras Cinzentas e Oceano.

---

### 2. 🍖 Guia Gastronômico & Calculadora de Dieta (`comidas.html`)
- **88 Comidas Mapeadas**:
  - **Como são feitas / Receitas**: Ingredientes exatos e quantidades.
  - **Bancadas de Produção**: Fogueira, Grelha de Cozinha, Caldeirão, Forno de Pedra, Mesa de Preparação de Alimentos.
  - **Atributos Exatos**: Bônus de **Vida (HP)**, **Vigor / Estamina** e **Eitr (Magia)**.
  - **Duração e Taxa de Cura**: Tempo em minutos e regeneração por segundo.
- **Calculadora de Combo de 3 Comidas**:
  - Simula o estômago do viking com 3 slots ativos.
  - Soma e calcula em tempo real a Vida Total, Estamina Total e Eitr Total.
  - Classifica automaticamente a sua build (*Tanque Berserker*, *Explorador Ágil*, *Mago de Eitr*, *Andarilho Equilibrado*).
- **Filtros e Busca Instantânea**:
  - Busca por nome da comida ou ingrediente (ex: *mel*, *nabo*, *cebola*, *serpente*).
  - Filtro por foco de garfo (Vida ❤️, Vigor ⚡, Eitr 🔮, Balanceada ⚖️).
  - Filtro por bioma e ordenação por maior vida, maior vigor, maior eitr ou duração.

---

## 📁 Estrutura do Projeto

```text
├── index.html                   # Página do Oráculo IA e Bestiário de Combate
├── comidas.html                 # Página do Guia de Comidas e Calculadora de Dieta
├── assets/
│   ├── css/
│   │   └── style.css            # Tema nórdico, glassmorphism e design responsivo
│   ├── js/
│   │   ├── ai-assistant.js      # Mecanismo NLP do Oráculo IA e renderização
│   │   └── food-guide.js        # Lógica do catálogo de comidas e calculadora
│   ├── data/
│   │   ├── creatures.json       # Base de conhecimento de 50 criaturas e estratégias
│   │   ├── foods.json           # Base de dados de 88 comidas e receitas
│   │   ├── weapons.json         # Catálogo de armas e danos
│   │   └── armors.json          # Catálogo de armaduras e conjuntos
│   └── images/
│       ├── creatures/           # Imagens e artes das criaturas
│       ├── food/                # Ícones das comidas
│       ├── weapons/             # Ícones de armas
│       └── armor/               # Ícones de armaduras
```

---

## 🌐 Como Hospedar no GitHub Pages

1. Faça o commit e push de todos os arquivos para o seu repositório no GitHub:
   ```bash
   git add .
   git commit -m "Adiciona Valheim Wiki com Oráculo IA e Guia de Comidas"
   git push origin main
   ```
2. No seu repositório no GitHub, acesse **Settings** > **Pages**.
3. Em **Branch**, selecione `main` (ou `master`) e a pasta `/ (root)`.
4. Clique em **Save**.
5. Seu site estará disponível em alguns instantes no endereço:
   `https://<seu-usuario>.github.io/<nome-do-repositorio>/`
