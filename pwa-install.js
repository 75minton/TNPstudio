(() => {
  let pending=null, installing=false;
  const button=document.getElementById('installBtn');
  const isGuide=/\/(app|install)\.html$/.test(location.pathname);
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const inApp=/kakao|instagram|fb_iab|naver|\bline\//i.test(navigator.userAgent);
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const note=document.createElement('p');note.id='installStatus';note.setAttribute('role','status');
  if(isGuide){note.style.cssText='line-height:1.7;color:#f4c7a1';button?.after(note);}
  function render(){if(!button)return;button.hidden=standalone()||inApp||(!pending&&!isGuide&&!ios);button.disabled=installing;button.textContent=pending?'TNP Studio 설치':ios?'iPhone/iPad 설치 안내':'설치 방법 보기';
    if(isGuide)note.textContent=standalone()?'설치된 앱에서 실행 중입니다.':ios?'Safari 공유 → 홈 화면에 추가 → 웹 앱으로 열기 → 추가를 선택하세요.':inApp?'이 링크를 Chrome 또는 Safari에서 열어 설치하세요.':'설치 버튼이 준비되지 않으면 브라우저 메뉴의 앱 설치 또는 홈 화면에 추가를 확인하세요.';
  }
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();pending=e;render();});
  addEventListener('appinstalled',()=>{pending=null;installing=false;render();if(isGuide)note.textContent='설치가 완료되었습니다. 홈 화면의 TNP Studio 아이콘으로 실행하세요.';});
  button?.addEventListener('click',async()=>{if(!pending){if(!isGuide)location.href='./app.html';else note.textContent=ios?'Safari 공유 → 홈 화면에 추가 → 웹 앱으로 열기 → 추가':'Chrome/Edge 메뉴에서 앱 설치를 선택하세요. 설치 항목이 없다면 HTTPS 연결과 브라우저 지원 여부를 확인하세요.';return;}
    const event=pending;pending=null;installing=true;render();try{await event.prompt();const {outcome}=await event.userChoice;if(isGuide)note.textContent=outcome==='accepted'?'설치 요청을 확인했습니다. 브라우저에서 설치를 마무리하세요.':'설치를 취소했습니다. 브라우저 메뉴에서 다시 설치할 수 있습니다.';}catch{if(isGuide)note.textContent='설치 창을 열지 못했습니다. 브라우저 메뉴에서 설치해 주세요.';}finally{installing=false;button.disabled=false;button.hidden=true;}
  });
  if(isGuide){document.getElementById('inAppNotice')?.style.setProperty('display',inApp?'block':'none');document.getElementById('safariGuide')?.style.setProperty('display',ios?'block':'none');const status=document.getElementById('page-status');if(status)status.textContent='Music 앱 설치';}
  if('serviceWorker' in navigator&&isSecureContext)navigator.serviceWorker.register('./sw.js?v=20260924-tnp-v2',{scope:'./'}).catch(()=>{if(isGuide)note.textContent='오프라인 준비에 실패했습니다. 연결을 확인하고 새로고침하세요.';});
  render();
})();
