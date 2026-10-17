(() => {
  const url = location.href;
  const body = document.body.innerText;
  const params = new URL(url).searchParams;
  const visible = node => node && node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden';
  const text = node => node?.innerText.trim() || '';
  if (location.protocol !== 'https:' || location.hostname !== 'smartestu.cn' || (location.port && location.port !== '443')) return { mode: 'unknown', url };
  if (location.pathname === '/login' || Array.from(document.querySelectorAll('input[type="password"]')).some(visible)) return { mode: 'login', url };
  if (params.get('view') === 'mine') {
    // Mobile personal view and desktop account menu expose the same identity differently.
    const account = body.match(/学号(?:\s*\/\s*工号)?\s*[:：]?\s*([A-Za-z0-9_.@+-]+)/);
    const school = body.match(/学校\s*[:：]?\s*([\s\S]*?)\s*学号/);
    if (school && school[1].trim() && school[1].trim().length <= 200 && account)
      return { mode: 'identity', url, accountId: school[1].trim().replace(/\s+/g, ' ') + '/' + account[1] };
    const firstEntry = document.getElementById('ability-menu-0');
    const desktopSchool = text(firstEntry?.parentElement?.previousElementSibling).replace(/\s+/g, ' ');
    const accountControl = document.querySelector('[data-testid="nav-user"][aria-label="账户设置"]');
    if (!desktopSchool || desktopSchool.length > 200 || !visible(accountControl))
      return { mode: 'unknown', url, message: '当前账户页尚未识别到学校和账号，未读取作业。' };
    const menu = document.getElementById(accountControl.getAttribute('aria-controls'));
    if (!visible(menu)) {
      if (accountControl.getAttribute('aria-expanded') !== 'true') accountControl.click();
      return { mode: 'loading', url, message: '正在确认当前账户。' };
    }
    const identifiers = Array.from(menu.querySelectorAll('[role="note"]')).filter(visible).map(text)
      .filter(value => /^[\p{L}\p{N}_.@+-]{1,200}$/u.test(value));
    if (identifiers.length !== 1) return { mode: 'unknown', url, message: '账户菜单未返回唯一账号，未读取作业。' };
    return { mode: 'identity', url, accountId: desktopSchool + '/' + identifiers[0] };
  }
  if (params.get('tab') !== 'assignments') return { mode: 'unknown', url, message: '请打开全部班级、全部状态的作业列表。' };
  if (!context.accountId) return { mode: 'unknown', url, message: '尚未确认当前账户，未读取作业。' };
  const filters = Array.from(document.querySelectorAll('select')).map(select => select.selectedOptions[0]?.textContent.trim());
  if (filters.length !== 2 || !filters.includes('全部班级') || !filters.includes('全部状态')) return { mode: 'unknown', url, message: '读取需要选择全部班级和全部状态，避免遗漏。' };
  const all = body.match(/已加载全部[（(]共\s*(\d+)\s*条[）)]/);
  const buttons = Array.from(document.querySelectorAll('button')).filter(button => visible(button) && button.innerText.trim() === '查看作业');
  if (!all) {
    if (/加载|更多/.test(body)) window.scrollTo(0, document.documentElement.scrollHeight);
    return { mode: 'loading', url, message: '作业列表尚未全部加载，未同步。' };
  }
  if (buttons.length !== Number(all[1])) return { mode: 'unknown', url, message: '已加载数量与可识别作业数量不一致，未同步。' };
  const field = (card, label) => text(Array.from(card.querySelectorAll('span')).find(span => text(span) === label)?.nextElementSibling);
  const items = buttons.map(button => {
    const row = button.closest('tr');
    let course, title, statusText, start, end;
    if (row) {
      const table = row.closest('table');
      const headers = Array.from(table.querySelectorAll('thead th')).map(text);
      const cell = label => row.cells[headers.indexOf(label)];
      if (['课程', '作业名称', '提交时段', '状态', '操作'].some(label => headers.filter(h => h === label).length !== 1))
        throw new Error('作业表格列未完整识别');
      course = text(cell('课程'));title = text(cell('作业名称'));statusText = text(cell('状态'));
      const period = text(cell('提交时段'));
      start = period.match(/开始时间\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/)?.[1].replace(/\s+/g, ' ') || '';
      end = period.match(/结束时间\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/)?.[1] || '';
    } else {
      const card = button.parentElement.parentElement;
      course = card.children[0]?.getAttribute('title') || text(card.children[0]);
      title = text(card.children[1]?.querySelector('.truncate'));
      statusText = text(card.children[1]);start = field(card, '开始时间');end = field(card, '结束时间');
    }
    const deadline = end.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
    if (!course || !title || !/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(start) || !deadline) throw new Error('作业字段未完整识别');
    return {
      id: JSON.stringify([course, title, start]),
      accountId: context.accountId,
      courseId: course,
      classId: course,
      title,
      course,
      status: /未完成/.test(statusText) ? 'unsubmitted' : /已完成/.test(statusText) ? 'completed' : 'unknown',
      deadline: deadline[1] + 'T' + deadline[2],
      url
    };
  });
  if (new Set(items.map(item => item.id)).size !== items.length) return { mode: 'unknown', url, message: '存在相同班级、名称和发布时间的作业，无法可靠区分，未同步。' };
  return { mode: 'tasks', url, observedAt: new Date().toISOString(), items, empty: items.length === 0, nextUrl: '' };
})()
