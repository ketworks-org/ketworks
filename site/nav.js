// Mobile toggle for the site navigation; shared by the homepage and the article pages.
const toggle = document.getElementById('nav-toggle'), nav = document.getElementById('site-nav');
if (toggle && nav) toggle.addEventListener('click', () => { const open = nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); });
