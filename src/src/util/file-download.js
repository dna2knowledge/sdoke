export default function downloadAsFile(filename, content) {
   if (!filename || !content) return;
   const elem = document.createElement('a');
   elem.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
   elem.setAttribute('download', filename);
   document.body.appendChild(elem);
   elem.click();
   document.body.removeChild(elem);
}