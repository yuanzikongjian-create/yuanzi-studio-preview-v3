/* P1-6：手机菜单开合。无追踪、无外部请求。 */
(function(){
  document.documentElement.className+=' js';
  var b=document.querySelector('.menu-btn'), n=document.getElementById('site-nav');
  if(b&&n){b.addEventListener('click',function(){var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o?'true':'false');});}
})();
