const api = {
   $: function (selector) { return document.querySelector(selector); },
   $$: function (selector) { return document.querySelectorAll(selector); },
   o: function (tag) { return document.createElement(tag); },
   _o_: function () { return document.createDocumentFragment(); },
   t: function (text) { return document.createTextNode(text); },
   $p: function (elem, child) { elem.appendChild(child); },
   $m: function (elem, child) { elem.removeChild(child); },
   $c: function (elem) { while (elem.children.length) api.$m(elem, elem.children[0]); elem.textContent = ''; },
   kp: function (elem, k) { elem.classList.add(k); },
   km: function (elem, k) { elem.classList.remove(k); },
};

module.exports = api;
