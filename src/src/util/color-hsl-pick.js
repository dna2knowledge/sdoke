const hslColors = [
   'hsl(360 100% 50%)',
   'hsl(225 100% 50%)',
   'hsl(90 100% 50%)',
   'hsl(315 100% 50%)',
   'hsl(135 100% 50%)',
   'hsl(270 100% 50%)',
   'hsl(0 100% 50%)',
   'hsl(180 100% 50%)',
   'hsl(45 100% 50%)',
];
function randomHsl() {
   const h = Math.round(Math.random() * 360);
   const s = Math.round(Math.random() * 70 + 30);
   const l = Math.round(Math.random() * 40 + 30);
   return `hsl(${h} ${s}% ${l}%)`;
}

export default function pickHSLColor(index) {
   if (index >= hslColors.length) return randomHsl();
   return hslColors[index];
}