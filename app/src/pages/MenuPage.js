import { menuData } from '../data/menu.js';
import { TopAppBar } from '../components/TopAppBar.js';
import { BottomNav } from '../components/BottomNav.js';

export function MenuPage({ onItemSelect }) {
  const el = document.createElement('div');
  el.className = 'relative';

  el.appendChild(TopAppBar());

  const main = document.createElement('main');
  main.className = 'pt-24 pb-32 px-6 max-w-screen-md mx-auto';
  main.innerHTML = buildMenuHTML();
  el.appendChild(main);

  el.appendChild(BottomNav('menu'));

  // Attach click handlers to every menu item row
  main.querySelectorAll('[data-item-id]').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.getAttribute('data-item-id');
      if (onItemSelect) onItemSelect(id);
    });
  });

  return el;
}

function buildMenuHTML() {
  let html = '';

  for (const section of menuData) {
    if (section.id === 'beverages') {
      html += buildBeveragesSection(section);
    } else if (section.id === 'desserts') {
      html += buildDessertsSection(section);
    } else if (section.id === 'rice-dishes') {
      html += buildRiceDishesSection(section);
    } else if (section.id === 'sushi-rolls') {
      html += buildSushiSection(section);
    } else {
      html += buildRamenSection(section);
    }
  }

  html += `
    <div class="mt-12 text-center">
      <span class="text-[0.6875rem] label-spacing text-secondary uppercase">Prices exclude HST (13%)</span>
    </div>
  `;

  return html;
}

function buildRamenSection(section) {
  const items = section.items.map(item => `
    <div class="grid grid-cols-[1fr_auto] gap-x-8 items-start cursor-pointer hover:opacity-70 transition-opacity" data-item-id="${item.id}">
      <div>
        <h3 class="text-base font-semibold text-on-surface">${item.name}</h3>
        <p class="text-[0.875rem] text-secondary mt-1 leading-relaxed">${item.description}</p>
      </div>
      <div class="text-[1rem] font-bold text-primary-container tabular-nums">${item.price.toFixed(2)}</div>
    </div>
  `).join('');

  return `
    <section class="mb-16">
      <div class="flex items-baseline justify-between mb-8">
        <h2 class="text-[1.375rem] font-bold editorial-spacing text-on-surface">${section.title}</h2>
        <span class="text-[0.6875rem] font-medium label-spacing text-secondary uppercase">${section.subtitle}</span>
      </div>
      <div class="space-y-12">${items}</div>
    </section>
  `;
}

function buildSushiSection(section) {
  const items = section.items.map(item => `
    <div class="grid grid-cols-[1fr_auto] gap-x-8 items-baseline cursor-pointer hover:opacity-70 transition-opacity" data-item-id="${item.id}">
      <span class="text-base font-semibold">${item.name}</span>
      <span class="text-[1rem] font-bold text-primary-container tabular-nums">${item.price.toFixed(2)}</span>
      <p class="col-span-1 text-[0.875rem] text-secondary mt-1">${item.description}</p>
    </div>
  `).join('');

  return `
    <section class="mb-16">
      <div class="flex items-baseline justify-between mb-8">
        <h2 class="text-[1.375rem] font-bold editorial-spacing text-on-surface">${section.title}</h2>
        <span class="text-[0.6875rem] font-medium label-spacing text-secondary uppercase">${section.subtitle}</span>
      </div>
      <div class="grid grid-cols-1 gap-10">${items}</div>
    </section>
  `;
}

function buildRiceDishesSection(section) {
  const items = section.items.map(item => `
    <div class="grid grid-cols-[1fr_auto] gap-x-8 items-baseline cursor-pointer hover:opacity-70 transition-opacity" data-item-id="${item.id}">
      <div class="flex flex-col">
        <span class="text-base font-medium">${item.name}</span>
        <p class="text-[0.875rem] text-secondary mt-1">${item.description}</p>
      </div>
      <span class="text-[1rem] font-bold text-primary-container tabular-nums">${item.price.toFixed(2)}</span>
    </div>
  `).join('');

  return `
    <section class="mb-16">
      <h2 class="text-[1.375rem] font-bold editorial-spacing text-on-surface mb-8">${section.title}</h2>
      <div class="space-y-6">${items}</div>
    </section>
  `;
}

function buildDessertsSection(section) {
  const items = section.items.map(item => `
    <div class="flex flex-col cursor-pointer hover:opacity-70 transition-opacity" data-item-id="${item.id}">
      <div class="flex justify-between">
        <span class="text-base font-medium">${item.name}</span>
        <span class="text-[1rem] font-bold text-primary-container">${item.price.toFixed(2)}</span>
      </div>
      <p class="text-[0.875rem] text-secondary mt-1">${item.description}</p>
    </div>
  `).join('');

  return `
    <section class="mb-16">
      <h2 class="text-[1.375rem] font-bold editorial-spacing text-on-surface mb-8">${section.title}</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">${items}</div>
    </section>
  `;
}

function buildBeveragesSection(section) {
  const juices = section.subsections[0];
  const softDrinks = section.subsections[1];

  const juiceItems = juices.items.map(item => `
    <div class="flex justify-between border-b border-surface-container py-2 cursor-pointer hover:opacity-70 transition-opacity" data-item-id="${item.id}">
      <span class="text-sm">${item.name}</span>
      <span class="text-sm font-bold text-primary-container">${item.price.toFixed(2)}</span>
    </div>
  `).join('');

  const softDrinkItems = softDrinks.items.map(item => `
    <div class="flex justify-between py-1 cursor-pointer hover:opacity-70 transition-opacity" data-item-id="${item.id}">
      <span class="text-sm">${item.name}</span>
      <span class="text-sm font-bold text-primary-container">${item.price.toFixed(2)}</span>
    </div>
  `).join('');

  return `
    <section class="mb-12">
      <h2 class="text-[1.375rem] font-bold editorial-spacing text-on-surface mb-8">${section.title}</h2>
      <div class="space-y-12">
        <div>
          <h3 class="text-[0.6875rem] font-bold label-spacing text-secondary uppercase mb-6 tracking-widest">${juices.title}</h3>
          <div class="grid grid-cols-2 gap-x-8 gap-y-4">${juiceItems}</div>
        </div>
        <div>
          <h3 class="text-[0.6875rem] font-bold label-spacing text-secondary uppercase mb-6 tracking-widest">${softDrinks.title}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">${softDrinkItems}</div>
        </div>
      </div>
    </section>
  `;
}
