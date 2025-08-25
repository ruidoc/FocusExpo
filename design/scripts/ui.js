// Enhanced UI helpers for interactive previews

export function toast(message, type = 'info') {
  const t = document.createElement('div');
  t.textContent = message;
  t.style.cssText = `
    position: fixed;
    left: 50%;
    bottom: 80px;
    transform: translateX(-50%) translateY(20px);
    background: ${type === 'success' ? 'linear-gradient(135deg, #34C759, #2ECC71)' : 
                 type === 'error' ? 'linear-gradient(135deg, #FF3B30, #E74C3C)' :
                 'rgba(0,0,0,0.9)'};
    color: #fff;
    padding: 12px 20px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 14px;
    z-index: 9999;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2);
    backdrop-filter: blur(20px);
    opacity: 0;
    transition: all 0.3s ease;
  `;
  
  document.body.appendChild(t);
  
  // Animate in
  requestAnimationFrame(() => {
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
  });
  
  // Animate out
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => t.remove(), 300);
  }, 2000);
}

export function bindTabs(rootId, active) {
  const root = document.getElementById(rootId);
  if (!root) return;
  root.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      active(btn.dataset.tab);
    });
  });
}

export function countdown(targetTs, el) {
  const tick = () => {
    const remain = Math.max(0, Math.floor((targetTs - Date.now()) / 1000));
    const mm = String(Math.floor(remain / 60)).padStart(2, '0');
    const ss = String(remain % 60).padStart(2, '0');
    el.textContent = `${mm}:${ss}`;
    if (remain <= 0) return;
    requestAnimationFrame(tick);
  };
  tick();
}


