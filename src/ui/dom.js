const api = {
   $: function (selector) { return document.querySelector(selector); },
   $$: function (selector) { return document.querySelectorAll(selector); },
   o: function (tag) { return document.createElement(tag); },
   _o_: function () { return document.createDocumentFragment(); },
   t: function (text) { return document.createTextNode(text); },
   $p: function (elem, child) { elem.appendChild(child); },
   $m: function (elem, child) { elem.removeChild(child); },
   $c: function (elem) { while (elem.children.length) api.$m(elem, elem.children[0]); elem.textContent = ''; },
   k_: function (elem, k) { return elem.classList.contains(k); },
   kp: function (elem, k) { elem.classList.add(k); },
   km: function (elem, k) { elem.classList.remove(k); },
   on: function (elem, name, fn) { elem.addEventListener(name, fn) },
   off: function (elem, name, fn) { elem.removeEventListener(name, fn) },
   a: function (elem, key) { return elem.getAttribute(key); },
   ap: function (elem, key, val) { elem.setAttribute(key, val); },
   am: function (elem, key) { elem.removeAttribute(key); }
};

module.exports = api;
