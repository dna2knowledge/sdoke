function triS(x1, y1, x2, y2, x3, y3) {
   const L1 = Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
   const L2 = Math.sqrt((x2-x3)*(x2-x3)+(y2-y3)*(y2-y3));
   const L3 = Math.sqrt((x1-x3)*(x1-x3)+(y1-y3)*(y1-y3));
   const p = (L1 + L2 + L3) / 2;
   return Math.sqrt(p * (p-L1) * (p-L2) * (p-L3));
}

function getKeypoints(data, srate) {
   srate = srate || 0.1;
   const n = data?.length || 0;
   if (!n) return [];
   const dx = data.map((x, i) => {
      if (i === 0) return null;
      return data[i] - data[i-1];
   });
   dx.shift();
   const r = [];
   dx.forEach((x, i) => {
      if (i === 0) return;
      if (dx[i-1] <= 0 && dx[i] > 0) r.push(i+1);
      else if (dx[i-1] >= 0 && dx[i] < 0) r.push(-i-1);
   });

   if (r.length <= 1) return r;
   // reduce the number of key points
   const fx = data[0];
   const lx = data[n-1];
   let x1 = 0, y1 = fx, x2, y2, x3, y3;
   let maxs = 0;
   const s = r.map((ii, i) => {
      x2 = ii < 0 ? -ii : ii;
      y2 = data[x2];
      if (i === r.length-1) {
         x3 = n-1;
         y3 = lx;
      } else {
         x3 = r[i+1];
         y3 = data[x3];
      }
      const sval = triS(x1, y1, x2, y2, x3, y3);
      if (maxs < sval) maxs = sval;
      return sval;
   }).map(x => x/maxs);
   s.forEach((val, i) => {
      if (val < srate) r[i] = null;
   });

   return r.filter(x => x !== null);
}

export function lineSmooth(data, r) {
   const n = data.length;
   return data.map((x, i) => {
      let a = i - r;
      let b = i + r + 1;
      if (b > n) {
         a += b - n;
         b = n;
      }
      if (a < 0) {
         b += a;
         a = 0;
      }
      const s = data.slice(a, b);
      return s.reduce((a,b)=>a+b, 0)/s.length;
   });
}

export function polylineize(data, win) {
   if (!data || !data.length) return [];
   if (data.length === 1) return data.slice();
   const lineps = lineSmooth(data, Math.floor(win/2));
   const kps = getKeypoints(lineps);
   const lastkp = kps[kps.length-1];
   if (lastkp !== lineps.length-1) kps.push(lineps.length-1);
   let x1 = 0;
   let y1 = lineps[x1];
   const r = [y1];
   for (let i = 0, n = kps.length; i < n; i++) {
      const x2 = kps[i] < 0 ? -kps[i] : kps[i];
      const y2 = lineps[x2];
      const k = (y2 - y1)/(x2 - x1);
      let o = y1;
      for (let j = x1+1; j <= x2; j++) {
         o += k;
         r.push(o);
      }
      x1 = x2;
      y1 = y2;
   }
   return r;
}