(() => {
  if (location.hostname !== 'smartestu.cn' || location.pathname !== '/login') return;
  let attempts = 0;
  const timer = setInterval(() => {
    if (++attempts > 60 || location.pathname !== '/login') { clearInterval(timer); return; }
    const buttons = Array.from(document.querySelectorAll('button'));
    if (buttons.some(button => button.innerText.trim() === '中央民族大学')) { clearInterval(timer); return; }
    const trigger = buttons.find(button => button.innerText.trim() === '请选择学校');
    const option = Array.from(document.querySelectorAll('[role="option"], li, div, span')).find(node =>
      node.childElementCount === 0 && node.innerText?.trim() === '中央民族大学' && node.getClientRects().length > 0);
    if (option) option.click();
    else if (trigger && trigger.getAttribute('aria-expanded') !== 'true') trigger.click();
  }, 200);
})()
