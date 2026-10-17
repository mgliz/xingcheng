(() => {
  'use strict';
  const result = status => ({status});
  try {
    const loc = new URL(window.location.href);
    if (loc.protocol !== 'https:' || loc.hostname.toLowerCase() !== 'passport2.chaoxing.com' ||
        loc.username !== '' || loc.password !== '' ||
        (loc.port !== '' && loc.port !== '443') || loc.pathname !== '/login') return result('unsupported');

    const phone = document.getElementById('phone');
    const password = document.getElementById('pwd');
    const button = document.getElementById('loginBtn');
    const visible = element => !!element && !element.hidden &&
      element.getClientRects().length > 0 && window.getComputedStyle(element).visibility !== 'hidden' &&
      window.getComputedStyle(element).display !== 'none';
    const challengeInput = Array.from(document.querySelectorAll(
      "input[id*='captcha' i],input[name*='captcha' i],input[id*='vcode' i],input[name*='vcode' i]," +
      "input[id*='verify' i],input[name*='verify' i]"
    )).some(visible);
    const challengeMedia = Array.from(document.querySelectorAll(
      "#captcha input,#captcha img,#captcha canvas,[class*='captcha' i] input,[class*='captcha' i] img,[class*='captcha' i] canvas"
    )).some(visible);
    const needVcode = document.getElementById('needVcode');
    const challengeFlag = !!needVcode && !['', '0', 'false'].includes(String(needVcode.value).toLowerCase());
    const qrOnly = !visible(phone) && visible(document.getElementById('quickCode'));
    if (challengeInput || challengeMedia || challengeFlag || qrOnly) return result('challenge');

    if (!(phone instanceof HTMLInputElement) || phone.type !== 'text' ||
        !(password instanceof HTMLInputElement) || password.type !== 'password' ||
        !(button instanceof HTMLButtonElement) || button.type !== 'button' ||
        !phone.form || phone.form !== password.form || phone.form !== button.form ||
        !visible(phone) || !visible(password) || !visible(button) ||
        phone.disabled || phone.readOnly || password.disabled || password.readOnly || button.disabled)
      return result('unsupported');
    const credential = context;
    const username = credential.username;
    const secret = credential.password;
    if (password.value.length !== 0 || (phone.value.length !== 0 && phone.value !== username))
      return result('existing-input');
    const setValue = (element, value) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (!setter) throw new Error('input setter unavailable');
      setter.call(element, value);
      element.dispatchEvent(new Event('input', {bubbles: true}));
      element.dispatchEvent(new Event('change', {bubbles: true}));
    };
    if (phone.value.length === 0) setValue(phone, username);
    setValue(password, secret);
    const current = new URL(window.location.href);
    if (current.protocol !== 'https:' || current.hostname.toLowerCase() !== 'passport2.chaoxing.com' ||
        current.username !== '' || current.password !== '' ||
        (current.port !== '' && current.port !== '443') ||
        current.pathname !== '/login' || phone.value !== username || password.value !== secret)
      return result('unsupported');
    button.click();
    return result('submitted');
  } catch (_) {
    return result('unsupported');
  }
})()
