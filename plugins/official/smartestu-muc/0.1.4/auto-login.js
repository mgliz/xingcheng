(() => {
  const result = status => ({status});
  if (location.protocol !== 'https:' || location.hostname !== 'smartestu.cn' ||
      location.pathname !== '/login' || (location.port && location.port !== '443')) return result('unsupported');
  const visible = node => node && node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden';
  const normalize = text => String(text || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  const setValue = (node, value) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(node, value);
    node.dispatchEvent(new Event('input', {bubbles: true}));
    node.dispatchEvent(new Event('change', {bubbles: true}));
  };
  const state = window.__xingchengSmartestuLogin || (window.__xingchengSmartestuLogin = {});
  const inputs = Array.from(document.querySelectorAll('input')).filter(visible);
  if (inputs.some(node => /captcha|verify|验证码/i.test(node.name + ' ' + node.id + ' ' + node.placeholder))) return result('challenge');
  if (Array.from(document.querySelectorAll('[class*="captcha" i] img,[class*="captcha" i] canvas,[id*="captcha" i]')).some(visible)) return result('challenge');
  const school = normalize(context.school);
  if (!school) return result('school-required');
  const schoolButtons = Array.from(document.querySelectorAll('button,[role="combobox"]')).filter(node => visible(node) && node.getAttribute('role') !== 'option' && !node.closest('[role="listbox"]'));
  const schoolSelect = Array.from(document.querySelectorAll('select')).find(visible);
  if (schoolSelect) {
    const option = Array.from(schoolSelect.options).find(node => normalize(node.textContent) === school);
    if (!option) return result('school-not-found');
    if (schoolSelect.value !== option.value) {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(schoolSelect, option.value);
      schoolSelect.dispatchEvent(new Event('change', {bubbles: true}));
      return result('loading');
    }
  } else if (!schoolButtons.some(node => normalize(node.innerText) === school)) {
    const options = Array.from(document.querySelectorAll('[role="option"]')).filter(visible);
    const option = options.find(node => normalize(node.innerText) === school) ||
      Array.from(document.querySelectorAll('[role="listbox"] li,[role="listbox"] div,[role="listbox"] span'))
        .find(node => visible(node) && node.childElementCount === 0 && normalize(node.innerText) === school);
    if (option) { option.click(); return result('loading'); }
    const trigger = schoolButtons.find(node => node.getAttribute('aria-haspopup') === 'listbox' || node.getAttribute('role') === 'combobox') ||
      schoolButtons.find(node => /请选择学校|大学|学院|学校|中学|University|College/i.test(node.innerText));
    if (!trigger) return result('loading');
    if (trigger.getAttribute('aria-expanded') !== 'true') { trigger.click(); return result('loading'); }
    const search = inputs.find(node => /搜索|search/i.test(node.placeholder));
    if (search) {
      if (search.value !== school) {
        setValue(search, school);state.searchSchool = school;state.searchStarted = performance.now();
        return result('loading');
      }
      if (state.searchSchool === school && performance.now() - state.searchStarted > 1000) return result('school-not-found');
      return result('loading');
    }
    if (document.querySelector('[role="option"]')) return result('school-not-found');
    return result('loading');
  }
  const accounts = inputs.filter(node => ['text', 'email', 'tel'].includes(node.type));
  const account = accounts.find(node => /authField|schoolUserLocalId|邮箱|学号|工号|账号|手机|email|account/i.test(node.id + ' ' + node.name + ' ' + node.placeholder + ' ' + node.getAttribute('aria-label'))) || (accounts.length === 1 ? accounts[0] : null);
  const passwords = inputs.filter(node => node.type === 'password');
  const password = passwords.length === 1 ? passwords[0] : null;
  const form = password?.form;
  const buttons = Array.from((form || document).querySelectorAll('button')).filter(node =>
    visible(node) && /^(继续|登录|登 录|立即登录)$/.test(normalize(node.innerText || node.getAttribute('aria-label'))) &&
    (!form || (node.form === form && node.type === 'submit')));
  if (!account || !password || buttons.length !== 1 || account.disabled || password.disabled || account.readOnly || password.readOnly) return result('loading');
  if (state.submitted || (account.value && account.value !== context.username) ||
      (password.value && !(state.filledPassword === password && password.value === context.password))) return result('existing-input');
  if (!account.value) setValue(account, context.username);
  if (!password.value) { setValue(password, context.password); state.filledPassword = password; }
  if (location.protocol !== 'https:' || location.hostname !== 'smartestu.cn' || location.pathname !== '/login' ||
      account.value !== context.username || password.value !== context.password) return result('unsupported');
  if (buttons[0].disabled) return result('loading');
  state.submitted = true;
  buttons[0].click();
  return result('submitted');
})()
