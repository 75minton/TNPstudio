(() => {
  const KEY = 'tnp_library_v1', CACHE = 'tnp-studio-downloads-v1';
  let model;
  try { model = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { model = {}; }
  model.queue = Array.isArray(model.queue) ? model.queue : [];
  model.recent = Array.isArray(model.recent) ? model.recent : [];
  model.lists = Array.isArray(model.lists) ? model.lists.filter(x => x && typeof x.name === 'string' && Array.isArray(x.ids)) : [];
  model.gap = [0,1,2,3].includes(model.gap) ? model.gap : 1;
  let selected = '', mood = '', saved = new Set(), busy = new Set(), sleepUntil = 0, queued = false;
  const mount = document.createElement('section');
  mount.className = 'library-tools'; mount.id = 'studioLibrary';
  document.querySelector('#tab-playlist .wrap').prepend(mount);
  const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const notify = message => showStatus(message, {duration:3500});
  const save = () => { try { localStorage.setItem(KEY,JSON.stringify(model)); } catch { notify('저장 공간이 부족하거나 저장이 차단되어 이번 변경은 현재 화면에만 유지됩니다.'); } };
  const songFor = id => songs.find(s=>s.id===id);
  const tags = {
    'we-are-75-rabbits':['운동'], 'we-are-one-teen-days':['운동'], 'The-spring-remaining-for-us':['휴식'],
    'Smashing-My-Night':['운동','드라이브'], 'You-are-always-here-Part1':['휴식'], 'You-are-always-here-Part2':['휴식'],
    'seven-five-rabbits':['운동'], 'Court-Light-Part1':['운동','드라이브'], 'Court-Light-Part2':['운동','드라이브'],
    'Light-Up-My-Day':['드라이브'], 'Between-the-Light':['집중'], 'The-voice-that-believes-in-you':['휴식'],
    'we-go-together':['드라이브'], 'the-tenth-season':['휴식','집중']
  };
  const row = (id,index,kind) => {
    const s=songFor(id); if(!s)return '';
    return `<li><button data-action="play" data-id="${escape(id)}">${escape(s.title)}</button>${kind==='queue'?`<button data-action="up" data-index="${index}" ${index===0?'disabled':''} aria-label="${escape(s.title)} 위로">↑</button><button data-action="down" data-index="${index}" ${index===model.queue.length-1?'disabled':''} aria-label="${escape(s.title)} 아래로">↓</button><button data-action="remove" data-index="${index}" aria-label="${escape(s.title)} 대기열에서 삭제">×</button>`:''}</li>`;
  };
  function render() {
    const previousSong = document.getElementById('librarySong')?.value;
    const openDetails = [...mount.querySelectorAll('details')].map(d => d.open);
    const list=model.lists.find(x=>x.name===selected);
    mount.innerHTML=`<h2>나의 라이브러리</h2><p class="library-hint">이 기기에 저장됩니다. 곡을 선택해 다음 순서와 오프라인 보관함을 관리하세요.</p>
    <div class="library-controls"><label>곡 선택<select id="librarySong">${songs.map(s=>`<option value="${escape(s.id)}">${escape(s.title)}</option>`).join('')}</select></label><button data-action="next">다음에 재생</button><button data-action="enqueue">대기열 추가</button><button data-action="download">오프라인 저장</button></div>
    <div class="library-controls"><label>재생목록<select id="libraryList"><option value="">선택하세요</option>${model.lists.map(l=>`<option ${l.name===selected?'selected':''} value="${escape(l.name)}">${escape(l.name)}</option>`).join('')}</select></label><button data-action="new-list">목록 만들기</button><button data-action="add-list" ${list?'':'disabled'}>선택 곡 담기</button><button data-action="play-list" ${list?.ids.length?'':'disabled'}>목록 재생</button><button data-action="delete-list" ${list?'':'disabled'}>목록 삭제</button></div>
    <details open><summary>재생 대기열 · ${model.queue.length}곡</summary><ol class="library-rows">${model.queue.map((id,i)=>row(id,i,'queue')).join('')||'<li>추가한 곡이 없습니다.</li>'}</ol><button data-action="clear">대기열 비우기</button></details>
    ${list?`<details open><summary>${escape(list.name)} · ${list.ids.length}곡</summary><ol class="library-rows">${list.ids.map((id,i)=>`<li><span>${escape(songFor(id)?.title||'사용할 수 없는 곡')}</span><button data-action="list-up" data-index="${i}" ${i===0?'disabled':''}>↑</button><button data-action="list-remove" data-index="${i}">삭제</button></li>`).join('')}</ol></details>`:''}
    <details><summary>최근 들은 곡</summary><ol class="library-rows">${model.recent.filter(songFor).map((id,i)=>row(id,i,'recent')).join('')||'<li>아직 감상 기록이 없습니다.</li>'}</ol></details>
    <details><summary>분위기로 고르기</summary><label>분위기<select id="libraryMood"><option value="">전체</option>${['집중','휴식','드라이브','운동'].map(t=>`<option ${mood===t?'selected':''}>${t}</option>`).join('')}</select></label><p class="library-hint">스튜디오가 지정한 분위기 태그입니다.</p><ol class="library-rows">${songs.filter(s=>!mood||tags[s.id]?.includes(mood)).map((s,i)=>row(s.id,i,'mood')).join('')}</ol></details>
    <details><summary>오프라인 보관함 · ${saved.size}곡</summary><p id="libraryStorage" class="library-hint"></p><ul class="library-rows">${songs.filter(s=>saved.has(s.id)).map(s=>`<li><span>${escape(s.title)} · 저장 완료</span><button data-action="delete-download" data-id="${escape(s.id)}">저장 삭제</button></li>`).join('')||'<li>저장된 곡이 없습니다.</li>'}</ul></details>
    <div class="library-controls"><label>곡 사이 대기<select id="libraryGap">${[0,1,2,3].map(n=>`<option value="${n}" ${n===model.gap?'selected':''}>${n}초</option>`).join('')}</select></label><label>취침 타이머<select id="librarySleep"><option value="0">사용 안 함</option>${[15,30,60].map(n=>`<option value="${n}">${n}분 후 정지</option>`).join('')}</select></label><span id="sleepState" role="status"></span></div>
    <details><summary>곡 소개 · 나의 감상 메모</summary><p id="trackNote"></p><label>이 기기에만 저장되는 메모<textarea id="libraryNote" maxlength="2000" placeholder="이 곡에 남기고 싶은 이야기를 적어보세요."></textarea></label><button data-action="note">메모 저장</button></details><p id="downloadState" role="status"></p>`;
    if(previousSong && songFor(previousSong)) document.getElementById('librarySong').value=previousSong;
    mount.querySelectorAll('details').forEach((d,i)=>{if(i<openDetails.length)d.open=openDetails[i];});
    updateNote(); updateSleep();
    const info=document.getElementById('libraryStorage');
    navigator.storage?.estimate?.().then(({usage,quota})=>{if(info.isConnected)info.textContent=`이 사이트 저장 공간: ${((usage||0)/1048576).toFixed(1)} MB / ${((quota||0)/1048576).toFixed(0)} MB (브라우저가 관리합니다)`;}).catch(()=>{});
  }
  function refresh(){ if(queued)return;queued=true;queueMicrotask(()=>{queued=false; if(!mount.querySelector('textarea:focus,select:focus')&&!busy.size)render();}); }
  function updateNote(){ const id=document.getElementById('librarySong')?.value;const s=songFor(id);const node=document.getElementById('trackNote');if(!node)return;node.textContent=s?`${s.title} · ${s.artist}${tags[id]?.length?' / '+tags[id].join(' · '):''} — 곡의 소개와 가사는 공유 페이지에서 확인하세요.`:'';const link=document.createElement('a');link.href=`./share/${songs.indexOf(s)+1}.html`;link.textContent='곡 이야기 열기 ↗';node.append(' ',link);document.getElementById('libraryNote').value=model.notes?.[id]||''; }
  async function scan(){try{const c=await caches.open(CACHE);const keys=await c.keys();const urls=new Set(keys.map(r=>r.url));saved=new Set(songs.filter(s=>urls.has(resolveAssetUrl(s.url))).map(s=>s.id));refresh();}catch{notify('이 브라우저에서는 오프라인 저장을 사용할 수 없습니다.');}}
  async function download(s){
    if(!s||busy.has(s.id))return;
    if(!/^https?:/.test(resolveAssetUrl(s.url))){notify('기기에 추가한 로컬 파일은 별도로 저장할 필요가 없습니다.');return;}
    busy.add(s.id);document.getElementById('downloadState').textContent=`${s.title} 저장 중…`;
    try{const cache=await caches.open(CACHE);for(const u of [s.cover,s.lrc,s.url].filter(Boolean)){const url=resolveAssetUrl(u);if(await cache.match(url))continue;const r=await fetch(url);if(!r.ok||r.status===206||r.type==='opaque')throw Error('완전한 파일을 받지 못했습니다');await cache.put(url,r);}
      notify(`${s.title} 오프라인 저장 완료`);
    }catch(e){notify('저장 실패: 네트워크 연결과 저장 공간을 확인해 주세요.');}finally{busy.delete(s.id);await scan();render();}
  }
  mount.addEventListener('change',e=>{if(e.target.id==='libraryList'){selected=e.target.value;render();}if(e.target.id==='libraryMood'){mood=e.target.value;render();}if(e.target.id==='librarySong')updateNote();if(e.target.id==='libraryGap'){model.gap=Number(e.target.value);save();}if(e.target.id==='librarySleep'){sleepUntil=Number(e.target.value)?Date.now()+Number(e.target.value)*60000:0;updateSleep();}});
  mount.addEventListener('click',async e=>{
    const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action;const id=b.dataset.id||document.getElementById('librarySong').value;const i=Number(b.dataset.index);const list=model.lists.find(x=>x.name===selected);
    if(a==='play'){const n=songs.findIndex(s=>s.id===id);if(n>=0)loadTrack(n,true);}
    if(a==='next')model.queue.unshift(id);if(a==='enqueue')model.queue.push(id);
    if(a==='remove')model.queue.splice(i,1);if(a==='clear')model.queue=[];
    if(a==='up'&&i>0)[model.queue[i-1],model.queue[i]]=[model.queue[i],model.queue[i-1]];
    if(a==='down'&&i<model.queue.length-1)[model.queue[i+1],model.queue[i]]=[model.queue[i],model.queue[i+1]];
    if(a==='new-list'){const name=prompt('재생목록 이름')?.trim().slice(0,80);if(name&&!model.lists.some(l=>l.name===name)){model.lists.push({name,ids:[]});selected=name;}}
    if(a==='add-list'&&list&&!list.ids.includes(id))list.ids.push(id);
    if(a==='delete-list'&&list&&confirm('이 재생목록을 삭제할까요?')){model.lists=model.lists.filter(l=>l!==list);selected='';}
    if(a==='list-remove'&&list)list.ids.splice(i,1);
    if(a==='list-up'&&list&&i>0)[list.ids[i-1],list.ids[i]]=[list.ids[i],list.ids[i-1]];
    if(a==='play-list'&&list){const ids=list.ids.filter(songFor);if(ids.length){model.queue=ids.slice(1);loadTrack(songs.findIndex(s=>s.id===ids[0]),true);}}
    if(a==='download'){await download(songFor(id));return;}
    if(a==='delete-download'){try{const c=await caches.open(CACHE);await c.delete(resolveAssetUrl(songFor(id).url));await scan();}catch{notify('저장 파일을 삭제하지 못했습니다.');}}
    if(a==='note'){model.notes=model.notes||{};model.notes[id]=document.getElementById('libraryNote').value;notify('감상 메모를 저장했습니다.');}
    save();render();
  });
  function updateSleep(){const n=document.getElementById('sleepState');if(n)n.textContent=sleepUntil?`${Math.max(0,Math.ceil((sleepUntil-Date.now())/60000))}분 뒤 정지`:'';}
  function checkSleep(){if(sleepUntil&&Date.now()>=sleepUntil){sleepUntil=0;clearAutoAdvanceTimer();audio.pause();notify('취침 타이머로 재생을 멈췄습니다.');}updateSleep();}
  setInterval(checkSleep,1000);document.addEventListener('visibilitychange',checkSleep);
  audio.addEventListener('play',()=>{checkSleep();const s=songs[state.cur];if(s){model.recent=[s.id,...model.recent.filter(id=>id!==s.id)].slice(0,30);save();refresh();}});
  audio.addEventListener('timeupdate',()=>{checkSleep();if(navigator.mediaSession?.setPositionState&&Number.isFinite(audio.duration)&&audio.duration>0){try{navigator.mediaSession.setPositionState({duration:audio.duration,playbackRate:audio.playbackRate,position:Math.min(audio.currentTime,audio.duration)});}catch{}}});
  try{navigator.mediaSession?.setActionHandler('seekto',d=>{if(Number.isFinite(d.seekTime)&&Number.isFinite(audio.duration))audio.currentTime=Math.max(0,Math.min(d.seekTime,audio.duration));});}catch{}
  window.TnpLibrary={refresh,gap:()=>model.gap*1000,takeNext:()=>{while(model.queue.length){const id=model.queue.shift();save();refresh();const i=songs.findIndex(s=>s.id===id);if(i>=0)return i;}return null;}};
  render();scan();window.addEventListener('tnp-songs-ready',scan);
})();
