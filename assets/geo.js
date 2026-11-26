/* PREMIUM v2：背景几何线框（圆 / 菱形 / 星图线）。
   - 三个极淡的金色线框 SVG，放在固定背景层；滚动时位移速度仅为正文的 10%–22%（比正文慢），并随位置淡入淡出循环，不会突然出现/消失。
   - 只改 transform 与 opacity，requestAnimationFrame 合并到每帧一次，滚动时才运行，停下即不再计算。
   - 手机（≤768px）：减弱到 55% 且静止；prefers-reduced-motion：完全不注入。
   - 纯装饰：aria-hidden、pointer-events:none，位于正文与磨砂框之后。 */
(function(){
  try{
    if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var NS='http://www.w3.org/2000/svg';
    function svg(size,inner){
      var s=document.createElementNS(NS,'svg');
      s.setAttribute('viewBox','0 0 200 200'); s.setAttribute('width',size); s.setAttribute('height',size);
      s.setAttribute('aria-hidden','true'); s.innerHTML=inner; return s;
    }
    var defs=[
      { /* 圆：两层同心圆 + 一个交叠的圆 + 四个刻度 */
        size:520, x:.80, y0:.22, k:.10, rot:.010, base:.17,
        inner:'<circle cx="100" cy="100" r="97"/><circle cx="100" cy="100" r="70"/><circle cx="132" cy="100" r="60"/>'+
              '<path d="M100 0V10M100 190V200M0 100H10M190 100H200"/>' },
      { /* 菱形：两层旋转正方形 + 十字细线 */
        size:420, x:.07, y0:.62, k:.16, rot:-.014, base:.15,
        inner:'<path d="M100 3 197 100 100 197 3 100Z"/><path d="M100 42 158 100 100 158 42 100Z"/>'+
              '<path d="M100 3V197M3 100H197" stroke-opacity=".4"/>' },
      { /* 星图线：连线 + 星点 + 小环 */
        size:480, x:.56, y0:1.02, k:.22, rot:.008, base:.24,
        inner:'<path d="M22 152 54 98 98 120 130 60 172 84M98 120 150 152M130 60 112 22"/>'+
              '<circle cx="130" cy="60" r="9"/><path d="M168 30h8M172 26v8M40 40h6M43 37v6" stroke-opacity=".7"/>'+
              '<circle class="dot" cx="22" cy="152" r="2.4"/><circle class="dot" cx="54" cy="98" r="2.4"/><circle class="dot" cx="98" cy="120" r="2.4"/>'+
              '<circle class="dot" cx="130" cy="60" r="2.8"/><circle class="dot" cx="172" cy="84" r="2.4"/><circle class="dot" cx="150" cy="152" r="2.4"/><circle class="dot" cx="112" cy="22" r="2"/>' }
    ];
    var wrap=document.createElement('div'); wrap.className='geo'; wrap.setAttribute('aria-hidden','true');
    var shapes=defs.map(function(d){ var el=svg(d.size,d.inner); wrap.appendChild(el); d.el=el; return d; });
    document.body.insertBefore(wrap,document.body.firstChild);

    var mq=matchMedia('(max-width: 768px)'), vw=0, vh=0, ticking=false, lastS=-1, lastM=null;
    function sm(t){ t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); }
    function layout(){
      vw=window.innerWidth; vh=window.innerHeight;
      var s=window.pageYOffset||document.documentElement.scrollTop||0;
      var mobile=mq.matches, L=vh*1.9;
      shapes.forEach(function(d){
        var sizeNow=mobile?Math.round(d.size*.62):d.size;
        d.el.setAttribute('width',sizeNow); d.el.setAttribute('height',sizeNow);
        var shift=mobile?0:s*d.k;
        var q=(((d.y0*vh-shift)%L)+L)%L;               /* 0..L，循环 */
        var p=q/L, edge=Math.min(p,1-p)/.16;            /* 靠近循环两端时淡出 */
        var op=d.base*sm(edge)*(mobile?.55:1);
        var x=d.x*vw-sizeNow/2, y=q-sizeNow*.4;
        var rot=mobile?0:s*d.rot;
        d.el.style.opacity=op.toFixed(3);
        d.el.style.transform='translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0) rotate('+rot.toFixed(2)+'deg)';
      });
      lastS=s; lastM=mobile; ticking=false;
    }
    function onScroll(){
      if(mq.matches) return;                            /* 手机静止 */
      if(!ticking){ ticking=true; requestAnimationFrame(layout); }
    }
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',function(){ if(!ticking){ ticking=true; requestAnimationFrame(layout); } },{passive:true});
    layout();
  }catch(e){}
})();
