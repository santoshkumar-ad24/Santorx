// Smooth anchor scrolling with header offset
(function(){
  function offsetScrollTo(hash, smooth){
    if(!hash) return;
    var id = hash.replace('#','');
    var el = document.getElementById(id) || document.querySelector('[name="'+id+'"]');
    if(!el) return;
    var header = document.querySelector('header');
    var headerHeight = header ? header.offsetHeight : 0;
    var y = el.getBoundingClientRect().top + window.pageYOffset - headerHeight - 12;
    window.scrollTo({top: y, behavior: smooth ? 'smooth' : 'auto'});
  }

  document.addEventListener('click', function(e){
    var a = e.target.closest('a[href^="#"]');
    if(!a) return;
    var href = a.getAttribute('href');
    if(!href || href === '#') return;
    e.preventDefault();
    offsetScrollTo(href, true);
    try{ history.pushState(null,'',href); }catch(e){}
  });

  window.addEventListener('load', function(){
    if(location.hash){ setTimeout(function(){ offsetScrollTo(location.hash, false); }, 60); }
  });

  window.addEventListener('hashchange', function(){ offsetScrollTo(location.hash, false); });
})();
