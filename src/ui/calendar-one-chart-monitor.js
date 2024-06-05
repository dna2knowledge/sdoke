const { o, $p, kp, km } = require('./dom');
const eb = require('../ctrl/eventbus');
const db = require('../service/db');

const config = {
   w0: 100,
   h0: 80,
   w1: 10
};

function CalendarOneChartMonitor(trade) {
   // trade = { st, ed, code, name, m, b, s }
   this.data = {
      trade: trade,
      history: [],
      today: {}
   };
   this.theme = {};
   this.dom = o('div');
   const canvas = o('canvas');
   canvas.width = config.w0;
   canvas.style.width = `${config.w0}px`;
   canvas.height = config.h0;
   canvas.style.height = `${config.h0}px`;
   $p(this.dom, canvas);
   this.ui = {
      canvas: canvas
   };
   this.init();
}
CalendarOneChartMonitor.prototype = {
   init: async function () {
      const d = this.data;
      this.update();
      try {
         const st = d.trade.st;
         const ed = d.trade.ed || (new Date().getTime());
         const ed0 = getTime4Date(new Date());
         const h0 = (await db.get(`stock.data.${d.trade.code}`));
         const h = h0.filter(function (z) {
            return z.T >= st && z.T <= ed;
         });
         const last = h0[h0.indexOf(h[0]) - 1] || h0[h0.length-1];
         const lasth = h[h.length-1];
         if (!lasth || lasth.T < ed0) {
            h.push({ T: ed0, O: null, C: null, H: null, L: null, V: null });
         }
         this.data.last = last;
         this.data.history = h;
         const w = h.length < Math.ceil(100/config.w1) ? 100 : (h.length * config.w1);
         this.ui.canvas.width = w;
         this.ui.canvas.style.width = `${w}px`;
         this.update();
      } catch (_) { /* read error */ }
   },
   dispose: function () {
   },
   update: function () {
      this.paint();
   },
   paint: function () {
      const pen = this.ui.canvas.getContext('2d');
      const w = parseInt(this.ui.canvas.width);
      const h = parseInt(this.ui.canvas.height);
      const d = this.data;
      pen.fillStyle = this.theme.background || 'white';
      pen.fillRect(0, 0, w, h);
      let box;
      if (d.history.length) {
         const w1 = config.w1-1;
         const q = { max: 0, min: Infinity, amax: 0, amin: Infinity };
         if (!isNaN(d.trade.s)) {
            if (q.max < d.trade.s) q.max = d.trade.s;
            if (q.min > d.trade.s) q.min = d.trade.s;
         }
         if (!isNaN(d.trade.b)) {
            if (q.max < d.trade.b) q.max = d.trade.b;
            if (q.min > d.trade.b) q.min = d.trade.b;
         }
         if (d.last) {
            if (q.max < d.last.H) q.max = d.last.H;
            if (q.min > d.last.L) q.min = d.last.L;
         }
         d.history.forEach(function (z) {
            if (!z || z.C === null || z.C === undefined) return;
            if (q.amax < z.V) q.amax = z.V;
            if (q.amin > z.V) q.amin = z.V;
            if (q.max < z.H) q.max = z.H;
            if (q.min > z.L) q.min = z.L;
         });

         q.ar = q.amax - q.amin;
         q.pr = q.max - q.min;
         let last = d.last;
         d.history.forEach(function (z, i) {
            if (isNaN(z.O)) return;
            pen.fillStyle = '#ccc';
            const x = i*config.w1;
            if (q.ar === 0) {
               pen.fillRect(x, config.h0/2, w1, config.h0);
            } else {
               const yh = (z.V - q.amin) / q.ar * config.h0 / 2 + (z.V > 0 ? 2 : 0);
               pen.fillRect(x, config.h0 - yh, w1, yh);
            }

            if (q.pr === 0) {
               pen.fillStyle = 'rgba(200, 200, 200, 0.5)';
               pen.fillRect(x, 20, w1, config.h0);
            } else if (last && last.C !== z.C && z.O === z.C && z.H - z.L < 0.02) {
               const yhC = (z.C - q.min) / q.pr * config.h0;
               if (last.C < z.O) {
                  const yhO = (z.C / 1.1 - q.min) / q.pr * config.h0;
                  pen.fillStyle = 'rgba(255, 0, 0, 0.75)';
                  pen.fillRect(x, config.h0 - yhC, w1, yhC - yhO);
               } else {
                  const yhO = (z.C / 0.9 - q.min) / q.pr * config.h0;
                  pen.fillStyle = 'rgba(0, 255, 0, 0.75)';
                  pen.fillRect(x, config.h0 - yhO, w1, yhO - yhC);
               }
            } else {
               const yhL = (z.L - q.min) / q.pr * config.h0;
               const yhH = (z.H - q.min) / q.pr * config.h0;
               const yhO = (z.O - q.min) / q.pr * config.h0;
               const yhC = (z.C - q.min) / q.pr * config.h0;
               if (z.O < z.C) {
                  pen.fillStyle = 'rgba(255, 0, 0, 0.5)';
               } else if (z.O > z.C) {
                  pen.fillStyle = 'rgba(0, 255, 0, 0.5)';
               } else {
                  pen.fillStyle = 'rgba(128, 128, 128, 0.5)';
               }
               pen.fillRect(x, config.h0 - yhH, w1, yhH - yhL);
               pen.fillRect(x, config.h0 - (z.O < z.C ? yhC : yhO), w1, Math.abs(yhC - yhO) + 2);
            }
            last = z;
         });
         pen.lineWidth = 1;
         pen.fillStyle = 'black';
         if (d.trade.st) { // trace
            if (d.trade.b) {
               pen.strokeStyle = 'black';
            } else {
               pen.strokeStyle = 'blue';
            }
            pen.strokeRect(0, 0, w1, config.h0);
            if (d.trade.b) {
               const x = w1/2;
               const yh = (d.trade.b - q.min) / q.pr * config.h0;
               pen.beginPath();
               pen.arc(x, config.h0 - yh, 2, 0, Math.PI*2);
               pen.fill();
            }

            if (d.trade.ed) {
               pen.strokeStyle = 'black';
               pen.strokeRect((d.history.length-1) * config.w1, 0, w1, config.h0);
               if (d.trade.s) {
                  const x2 = (d.history.length-1) * config.w1 + w1/2;
                  const yh2 = (d.trade.s - q.min) / q.pr * config.h0;
                  pen.beginPath();
                  pen.arc(x2, config.h0 - yh2, 2, 0, Math.PI*2);
                  pen.fill();
                  const yh = (d.trade.b - q.min) / q.pr * config.h0;
                  pen.strokeStyle = 'black';
                  pen.lineWidth = 1;
                  pen.beginPath();
                  pen.moveTo(w1/2, config.h0 - yh);
                  pen.lineTo(x2, config.h0 - yh2);
                  pen.stroke();
               }
            }
         }
      } else {
      }

      pen.fillStyle = '#ccc';
      box = pen.measureText(d.trade.code);
      pen.fillText(d.trade.code, w-box.width-5, 12);
      box = pen.measureText(d.trade.name);
      pen.fillText(d.trade.name, w-box.width-5, 24);
window._debugPaint = (this.paint).bind(this);
   },
   config: config
};

function getTime4Date(date) {
   let ts = date.getTime();
   ts = ts - ts % (1000 * 3600 * 24);
   return ts;
}

function onTooltip() {
}
function onUpdateCalendarOneToday(today) {
   this.data.today = today;
   this.update();
}

module.exports = CalendarOneChartMonitor;
