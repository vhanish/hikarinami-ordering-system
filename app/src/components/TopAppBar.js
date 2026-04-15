export function TopAppBar() {
  const el = document.createElement('header');
  el.className = 'bg-[#f9f9f9] backdrop-blur-md fixed top-0 w-full z-50';
  el.innerHTML = `
    <div class="flex justify-center items-center w-full px-6 py-4">
      <h1 class="text-lg font-bold tracking-widest text-[#1a1c1c] font-['Plus_Jakarta_Sans'] uppercase">HIKARINAMI</h1>
    </div>
  `;
  return el;
}
