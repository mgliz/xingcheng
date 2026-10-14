(() => {
  const url = location.href;
  const body = document.body.innerText;
  const params = new URL(url).searchParams;
  if (location.hostname !== 'smartestu.cn') return { mode: 'unknown', url };
  if (location.pathname === '/login' || document.querySelector('input[type="password"]')) return { mode: 'login', url };
  if (params.get('view') === 'mine') {
    const account = body.match(/学号\s*([^\s]+)/);
    if (!body.includes('中央民族大学') || !account) return { mode: 'unknown', url, message: '请确认已登录中央民族大学的学生账户。' };
    return { mode: 'identity', url, accountId: '中央民族大学/' + account[1] };
  }
  if (params.get('tab') !== 'assignments') return { mode: 'unknown', url, message: '请打开全部班级、全部状态的作业列表。' };
  if (!context.accountId) return { mode: 'unknown', url, message: '尚未确认当前账户，未读取作业。' };
  const filters = Array.from(document.querySelectorAll('select')).map(select => select.selectedOptions[0]?.textContent.trim());
  if (filters.length !== 2 || !filters.includes('全部班级') || !filters.includes('全部状态')) return { mode: 'unknown', url, message: '读取需要选择全部班级和全部状态，避免遗漏。' };
  const all = body.match(/已加载全部[（(]共\s*(\d+)\s*条[）)]/);
  const buttons = Array.from(document.querySelectorAll('button')).filter(button => button.innerText.trim() === '查看作业');
  if (!all) {
    if (/加载|更多/.test(body)) window.scrollTo(0, document.documentElement.scrollHeight);
    return { mode: 'loading', url, message: '作业列表尚未全部加载，未同步。' };
  }
  if (buttons.length !== Number(all[1])) return { mode: 'unknown', url, message: '已加载数量与可识别作业数量不一致，未同步。' };
  const text = node => node?.innerText.trim() || '';
  const field = (card, label) => text(Array.from(card.querySelectorAll('span')).find(span => text(span) === label)?.nextElementSibling);
  const items = buttons.map(button => {
    const card = button.parentElement.parentElement;
    const course = card.children[0]?.getAttribute('title') || text(card.children[0]);
    const title = text(card.children[1]?.querySelector('.truncate'));
    const statusText = text(card.children[1]);
    const start = field(card, '开始时间');
    const deadline = field(card, '结束时间').match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
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
