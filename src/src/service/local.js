export function load(key) {
    try {
       const obj = JSON.parse(localStorage.getItem(key));
       return obj;
    } catch(_) { return null; }
 }
 
 export function save(key, obj) {
    try {
       localStorage.setItem(key, JSON.stringify(obj));
    } catch(_) { return null; }
    return obj;
 }
 
 export default {
    load, save,
    data: {},
 };