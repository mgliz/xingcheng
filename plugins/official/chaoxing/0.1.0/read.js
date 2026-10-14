(() => {
      const url=location.href, host=location.hostname;
      if(!(host==='chaoxing.com'||host.endsWith('.chaoxing.com')))return {mode:'unknown',url};
      if(host.startsWith('passport')||document.querySelector('input[type=password]'))return {mode:'login',url};
      const text=e=>(e?.innerText||'').trim();
      if(location.pathname.endsWith('/mooc2/work/all-task')&&text(document.querySelector('h2'))==='我的作业'){
        const list=document.querySelector('.bottomList'), empty=text(document.querySelector('.null-data'))==='暂无作业';
        if(!list&&!empty)return {mode:'unknown',url};
        const items=Array.from(list?.querySelectorAll('ul > li[data]')||[]).map(row=>{
          let target;try{target=new URL(row.getAttribute('data'),url);}catch{return null;}
          if(!(target.hostname==='chaoxing.com'||target.hostname.endsWith('.chaoxing.com')))return null;
          const query=target.searchParams,raw=text(row.querySelector('.stuStatus'));
          const status=/打回|重做|重交/.test(raw)?'returned':/未提交|未交/.test(raw)?'unsubmitted':/已完成|已互评|已提交|待批阅|已批阅/.test(raw)?'submitted':'unknown';
          return {id:query.get('workId')||'',courseId:query.get('courseId')||'',classId:query.get('classId')||'',accountId:query.get('cpi')||'',
            title:text(row.querySelector('.right-content > p')),course:text(row.querySelector('.courseName')).replace(/^《|》$/g,''),
            status,deadline:text(row.querySelector('.time')),url:location.origin+location.pathname};
        }).filter(Boolean);
        if(items.length===0&&!empty)return {mode:'unknown',url};
        const active=document.querySelector('li.xl-active'),next=document.querySelector('li.xl-nextPage');
        const page=Number(text(active)||new URL(url).searchParams.get('pageNum')||1);
        return {mode:'homework-summary',url,items,empty,observedAt:new Date().toISOString(),page,
          nextUrl:(next&&!next.classList.contains('xl-disabled'))?(()=>{const target=new URL(url);target.searchParams.set('pageNum',String(page+1));return target.href;})():''};
      }
      if(document.querySelector('a[href*="stucoursemiddle"]'))return {mode:'courses',url};
      return {mode:'unknown',url};
    })()
