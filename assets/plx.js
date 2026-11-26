/* P1-6 首页视差 v3。原生 JS，无库、无外部请求；file:// 与 http(s) 下都可用。
   - reduced-motion 或缺少 matchMedia / requestAnimationFrame：直接退出，页面保持静态合成图，文字无淡入。
   - 滚动进度不读 window.scrollY：用「首屏在文档中的位置（offsetTop 链）− 首屏当前 getBoundingClientRect().top」÷ 首屏高度，
     无论真正滚动的是 window、body 还是别的容器都成立；也不依赖 scroll 事件一定送到 window。
   - 首屏在视口内时持续跑一个轻量 rAF 循环（每帧读一次 rect，数值变了才写 transform），
     所以平滑滚动、合成器线程滚动、滚轮、触控板、键盘、拖滚动条都能跟上；首屏离开视口后停下，
     再由 scroll（window + document capture）、wheel、touchmove、keydown、resize、pointermove 任一事件唤醒。全部 passive。
   - 滚动和鼠标分别写在嵌套的两个元素上：外层 .plx-layer = 滚动，内层 picture = 鼠标，互不覆盖。
   - 鼠标：仅 (hover:hover) and (pointer:fine)；只记录指针的屏幕坐标，每帧按首屏当前位置换算，滚动时不会把滚动项清零。
   - 断口硬限制：桌面前臂从顶边伸出 → 手层滚动项与鼠标项的 Y 都 ≤ 0；手机前臂从底边伸出 → 手层 Y ≥ 0（手机无鼠标项）。
   - 文字安全：桌面手层鼠标 X 只向右（≥ 0）。 */
(function(){
  var root=document.documentElement, hero=document.querySelector('.hero');
  if(!hero||!window.matchMedia||!window.requestAnimationFrame) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var plx=hero.querySelector('.plx'); if(!plx) return;
  var bgO=plx.querySelector('.plx-bg'), handO=plx.querySelector('.plx-hand');
  var bgI=plx.querySelector('.plx-bg-m'), handI=plx.querySelector('.plx-hand-m');
  if(!bgO||!handO||!bgI||!handI) return;
  var mob=matchMedia('(max-width: 768px), (orientation: portrait)');
  var fine=matchMedia('(hover: hover) and (pointer: fine)');
  /* 单位：屏幕 px。首屏滚过一个自身高度时达到下列值 */
  var SCROLL={desktop:{bg:70,hand:-50},mobile:{bg:36,hand:24}};
  /* 鼠标（仅桌面）：指针在首屏内的位置映射到 [-1,1] */
  var MOUSE={bgX:8,bgUp:6,handX:12,handUp:12};
  var EASE=0.08;
  var imgs=plx.querySelectorAll('img'), live=false, raf=0;
  var px=null,py=null,over=false, mx=0,my=0, last={};
  root.classList.add('js-plx');

  function ok(img){return img.complete&&img.naturalWidth>0;}
  function check(){
    for(var i=0;i<imgs.length;i++){if(!ok(imgs[i])) return;}
    if(!live){live=true;root.classList.add('plx-live');kick();}
  }
  function stop(){live=false;root.classList.remove('plx-live');last={};
    bgO.style.transform=handO.style.transform=bgI.style.transform=handI.style.transform='';}
  for(var i=0;i<imgs.length;i++){imgs[i].addEventListener('load',check);imgs[i].addEventListener('error',stop);}

  function docTop(el){var t=0;while(el){t+=el.offsetTop;el=el.offsetParent;}return t;}
  function put(el,key,x,y){
    var v='translate3d('+x.toFixed(2)+'px,'+y.toFixed(2)+'px,0)';
    if(last[key]!==v){el.style.transform=v;last[key]=v;}
  }
  function frame(){
    raf=0; if(!live) return;
    var r=hero.getBoundingClientRect(), h=r.height||hero.offsetHeight||1;
    var p=Math.min(1,Math.max(0,(docTop(hero)-r.top)/h));
    var m=mob.matches, a=m?SCROLL.mobile:SCROLL.desktop;
    /* 滚动项（外层） */
    var sh=a.hand*p; sh=m?Math.max(0,sh):Math.min(0,sh);
    put(bgO,'bo',0,a.bg*p); put(handO,'ho',0,sh);
    /* 鼠标项（内层） */
    var tx=0,ty=0;
    if(!m&&fine.matches&&over&&px!==null&&px>=r.left&&px<=r.right&&py>=r.top&&py<=r.bottom){
      tx=((px-r.left)/r.width)*2-1; ty=((py-r.top)/r.height)*2-1;
    }
    mx+=(tx-mx)*EASE; my+=(ty-my)*EASE;
    if(Math.abs(tx-mx)<0.001) mx=tx; if(Math.abs(ty-my)<0.001) my=ty;
    var up=Math.max(0,-my);
    put(bgI,'bi',-mx*MOUSE.bgX,-up*MOUSE.bgUp);
    put(handI,'hi',Math.max(0,mx)*MOUSE.handX,-up*MOUSE.handUp);   /* X 只向右；Y 只向上 */
    /* 首屏在视口内或鼠标仍在缓动：继续下一帧 */
    var vh=window.innerHeight||root.clientHeight;
    if((r.bottom>0&&r.top<vh)||mx!==tx||my!==ty) kick();
  }
  function kick(){if(!raf&&live) raf=requestAnimationFrame(frame);}
  var pas={passive:true}, cap={passive:true,capture:true};
  window.addEventListener('scroll',kick,pas);
  document.addEventListener('scroll',kick,cap);
  window.addEventListener('wheel',kick,pas);
  window.addEventListener('touchmove',kick,pas);
  window.addEventListener('keydown',kick,pas);
  window.addEventListener('resize',kick,pas);
  window.addEventListener('pointermove',function(e){
    if(e.pointerType&&e.pointerType!=='mouse') return;
    px=e.clientX; py=e.clientY; over=hero.contains(e.target); kick();   /* 指针在吸顶导航等首屏以外的元素上时不算 */
  },pas);
  document.addEventListener('mouseleave',function(){px=py=null;over=false;kick();},pas);
  /* 换断点（旋转屏幕）时图源会切换：先停用，等新图加载完再启用 */
  var onMq=function(){stop();setTimeout(check,50);};
  if(mob.addEventListener) mob.addEventListener('change',onMq); else if(mob.addListener) mob.addListener(onMq);
  check();
})();
