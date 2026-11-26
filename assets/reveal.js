/* PREMIUM v1 预览：滚动淡入。
   - 只用 opacity + 16px 上移，0.75s 缓进缓出，无回弹；同一批进入视口的元素按 DOM 顺序错峰 0.14s（最多 0.56s），一次只动一样。
   - 每个元素只触发一次；动画结束后移除 .rv/.in，不留下任何内联状态（不干扰按钮自带的 hover 过渡）。
   - prefers-reduced-motion、无 IntersectionObserver、或脚本出错：不加 .rv-on，内容直接显示。 */
(function(){
  try{
    if(!('IntersectionObserver' in window)) return;
    if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var sel='main .block > *, main .work-list > li';
    var els=[].slice.call(document.querySelectorAll(sel)).filter(function(e){
      return !e.closest('.hero') && e.tagName!=='SCRIPT';
    });
    if(!els.length) return;
    document.documentElement.classList.add('rv-on');
    els.forEach(function(e){e.classList.add('rv');});
    var io=new IntersectionObserver(function(entries){
      var hit=entries.filter(function(en){return en.isIntersecting;});
      hit.sort(function(a,b){
        return (a.target.compareDocumentPosition(b.target)&Node.DOCUMENT_POSITION_FOLLOWING)?-1:1;
      });
      hit.forEach(function(en,i){
        var t=en.target, d=Math.min(i*0.14,0.56);
        io.unobserve(t);
        t.style.setProperty('--rv-d',d+'s');
        requestAnimationFrame(function(){t.classList.add('in');});
        setTimeout(function(){
          t.classList.remove('rv','in');
          t.style.removeProperty('--rv-d');
        },(d+0.75)*1000+200);
      });
    },{threshold:0.12,rootMargin:'0px 0px -6% 0px'});
    els.forEach(function(e){io.observe(e);});
  }catch(err){
    document.documentElement.classList.remove('rv-on');
  }
})();
