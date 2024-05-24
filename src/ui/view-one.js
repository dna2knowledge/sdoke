const { o, kp, $p, on, off } = require('./dom');
const eb = require('../ctrl/eventbus');
const NavIconButton = require('./nav-icon-button');
const ViewListItem = require('./view-list-item');
const stat = require('../ctrl/stat-view');

function ViewOne() {
   const dom = o('div');
   const bar = o('div');
   const canvas = o('canvas');
   const back = new NavIconButton('af-arrow-left.svg', 'Back');
   const refresh = new NavIconButton('af-rotate.svg', 'Refresh');
   const day = new NavIconButton('af-calendar-day.svg', 'Day');
   const week = new NavIconButton('af-calendar-week.svg', 'Week');
   const month = new NavIconButton('af-calendar.svg', 'Month');
   const overview = new ViewListItem({ code: '', name: '' });
   kp(bar, 's-flex');
   kp(day.dom, 'active');
   kp(canvas, 's-view-canvas');
   $p(bar, back.dom);
   $p(bar, refresh.dom);
   $p(bar, day.dom);
   $p(bar, week.dom);
   $p(bar, month.dom);
   $p(dom, bar);
   $p(dom, overview.dom);
   $p(dom, canvas);
   this.dom = dom;
   this.ui = {
      bar: {
         back: back,
         refresh: refresh
      },
      overview: overview,
      canvas: canvas
   };
   this.defer = {};
   this.calc = {};
   this.config = {};
   const theme = getComputedStyle(dom);
   this.theme = {
      background: theme.backgroundColor || 'white',
      color: theme.color || 'black'
   };
   this.init();
}

ViewOne.prototype = {
   init: function () {
      this.defer.onBackClick = onBackClick.bind(this);
      this.defer.onUpdate = onUpdate.bind(this);
      this.defer.onRender = onRender.bind(this);
      this.defer.onResize = onResize.bind(this);
      eb.on('update.stock-chart', this.defer.onUpdate);
      eb.on('render.view-one', this.defer.onRender);
      eb.on('resize.view-one', this.defer.onResize);
      on(this.ui.bar.back.dom, 'click', this.defer.onBackClick);
   },
   dispose: function () {
      eb.off('update.stock-chart', this.defer.onUpdate);
      eb.off('render.view-one', this.defer.onRender);
      eb.off('resize.view-one', this.defer.onResize);
      off(this.ui.bar.back.dom, 'click', this.defer.onBackClick);
   },
   updateCalc: function () {
      this.calc = {};
      // TODO read this.config and get data range
      let bi = stat.one.data.length, ai = bi - 250;
      if (ai < 0) ai = 0;
      this.calc.data = stat.one.data.slice(ai, bi);

      // TODO fill real strategy data
      this.calc.strategy = this.calc.data.map(function (_) {
         if (Math.random() > 0.5) return null;
         return Math.random() * 2 - 1;
      });

      let min = Infinity, max = -Infinity;
      let minm = Infinity, maxm = -Infinity;
      this.calc.data.forEach((item) => {
         if (min > item.L) min = item.L;
         if (max < item.H) max = item.H;
         if (minm > item.V) minm = item.V;
         if (maxm < item.V) maxm = item.V;
      });
      this.calc.min = min;
      this.calc.max = max;
      this.calc.Vmin = minm;
      this.calc.Vmax = maxm;
      const n = this.calc.data.length;
      const wchart = this.ui.canvas.offsetWidth - 100;
      let scale = Math.floor(wchart / n);
      if (scale <= 0) scale = 1;
      else if (scale > 10) scale = 10;
      this.calc.wchart = wchart;
      this.calc.s = scale;
      this.calc.shiftw = Math.floor((wchart - n * scale) / 2);
   },
   update: function() {
      const item = stat.list.find(function (z) {
         return z.code === stat.one.code;
      });
      if (!item) return;
      this.ui.overview.data = item;
      // TODO how to update after new fetch
      this.ui.overview.update();
      this.updateCalc();

      this.ui.canvas.style.height = '450px';
      const w = this.ui.canvas.offsetWidth;
      const h = this.ui.canvas.offsetHeight;
      this.ui.canvas.width = w;
      this.ui.canvas.height = h;
      const pen = this.ui.canvas.getContext('2d');
      pen.fillStyle = this.theme.background;
      pen.fillRect(0, 0, w, h);
      pen.save();
      pen.translate(50, 50)
      paintS(pen, w-100, 350, this);
      paintBasic(pen, w-100, 300, this);
      pen.translate(0, 300);
      paintV(pen, w-100, 50, this);
      pen.restore();
   }
};

function paintLine(pen, x, y1, y2) {
   pen.beginPath();
   pen.moveTo(x, y1);
   pen.lineTo(x, y2);
   pen.stroke();
}

function paintCandleLine(pen, x, yst, yed, ymin, ymax, color) {
   pen.strokeStyle = color;
   pen.save();
   pen.lineWidth = 1;
   if (ymin > yed) paintLine(pen, x, ymin, yed);
   if (ymax < yst) paintLine(pen, x, yst, ymax);
   pen.restore();
   paintLine(pen, x, yed+2, yst);
}

function paintBasic(pen, w, h, comp) {
   const calc = comp.calc;
   const data = calc.data;
   const scale = calc.s;
   const shiftw = calc.shiftw;
   const w0 = data.length * scale;
   const h0 = h;
   const lx = scale;
   const min = calc.min;
   const max = calc.max;
   pen.lineWidth = lx;

   pen.fillStyle = comp.theme.color;
   const maxt = `${calc.max.toFixed(2)}`;
   const mint = `${calc.min.toFixed(2)}`;
   let box;
   box = pen.measureText(maxt);
   pen.fillText(maxt, -box.width, 12);
   box = pen.measureText(mint);
   pen.fillText(mint, -box.width, 300);

   const hx = max - min;
   if (hx === 0) {
      pen.fillStyle = 'gray';
      pen.fillRect(0, 10, w0, h0-10);
   } else {
      for (let i = 1; i < 12; i++) {
         const vx = data.length * lx / 12 * i + shiftw;
         pen.save();
         pen.strokeStyle = '#4ff'; paintLine(pen, vx, 0, 4);
         pen.restore();
      }
      let lastitem = null;
      data.forEach((item, i) => {
         const ymin = Math.round(h0 * (1 - (item.L - min)/hx));
         const yst = Math.round(h0 * (1 - (item.O - min)/hx));
         const yed = Math.round(h0 * (1 - (item.C - min)/hx));
         const ymax = Math.round(h0 * (1 - (item.H - min)/hx));
         const x = i * lx + shiftw;
         if (item.O === item.C && item.O === item.L && item.O === item.H) {
            const cr = lastitem ? ((item.C - lastitem.C) / lastitem.C) : 0;
            if (cr < -0.099) {
               const yex =  Math.round(h0 * (1 - (lastitem.C - min)/hx));
               pen.strokeStyle = '#6f6'; paintLine(pen, x, yst, yex);
            } else if (cr > 0.099) {
               const yex =  Math.round(h0 * (1 - (lastitem.C - min)/hx));
               pen.strokeStyle = '#f66'; paintLine(pen, x, yst, yex);
            } else {
               pen.strokeStyle = 'gray'; paintLine(pen, x, yst, yst+2);
            }
         } else if (yst > yed) {
            paintCandleLine(pen, x, yed, yst, ymin, ymax, '#f66');
         } else if (yst < yed) {
            paintCandleLine(pen, x, yst, yed, ymin, ymax, '#6f6');
         } else {
            paintCandleLine(pen, x, yst, yed, ymin, ymax, 'gray');
         }
         lastitem = item;
      });
   }
}

function paintS(pen, w, h, comp) {
   const calc = comp.calc;
   const strategy = calc.strategy;
   if (!strategy) return;
   const scale = calc.s;
   const shiftw = calc.shiftw;
   const w0 = strategy.length * scale;
   const h0 = h;
   const lx = scale;
   const min = calc.min;
   const max = calc.max;

   pen.lineWidth = lx;
   for (let i = strategy.length-1; i >= 0; i--) {
      const sg = strategy[i];
      if (sg === null) continue;
      const vx = i * lx + shiftw;
      const color = calcSignal(sg);
      if (sg) { pen.strokeStyle = color; paintLine(pen, vx, 0, h0); }
   }

   function calcSignal(val) {
      if (val === 0) return '';
      if (val > 0) return `rgb(255,255,0,${val})`;
      return `rgb(173,216,230,${-val})`;
   }
}

function paintV(pen, w, h, comp) {
   const calc = comp.calc;
   const data = calc.data;
   const scale = calc.s;
   const shiftw = calc.shiftw;
   const w0 = data.length * scale;
   const h0 = h;
   const lx = scale;
   const minm = calc.Vmin;
   const maxm = calc.Vmax;

   pen.fillStyle = comp.theme.color;
   const maxt = `${calc.Vmax.toFixed(0)}`;
   const mint = `${calc.Vmin.toFixed(0)}`;
   let box;
   box = pen.measureText(maxt);
   pen.fillText(maxt, -box.width, 12);
   box = pen.measureText(mint);
   pen.fillText(mint, -box.width, 50);

   pen.lineWidth = lx;
   const hm = maxm - minm;
   if (hm === 0) {
      pen.fillStyle = '#ddd';
      pen.fillRect(0, 0, w0, h0);
   } else {
      pen.strokeStyle = '#ddd';
      data.forEach((item, i) => {
         const x = i * lx + shiftw;
         const y = Math.round(h0 * (1 - (item.V - minm)/hm));
         pen.beginPath(); pen.moveTo(x, h0); pen.lineTo(x, y); pen.stroke();
      });
   }
}

function onBackClick() {
   if (stat.prevTab) {
      const targetTab = stat.prevTab;
      stat.prevTab = null;
      eb.emit(`tab.show.${targetTab}`);
   } else {
      stat.uri = '';
      eb.emit('tab.show.view');
   }
}

async function onUpdate(item) {
   // { code, name, data }
   if (item.code !== stat.one.code) return;
   stat.one.data = item.data;
   if (!item.data) return;
   this.update();
}

async function onRender(item) {
   // { code, name, latest }
   if (item.code === stat.one.code) return;
   stat.one.code = item.code;
   const historyItem = {
      code: item.code,
      name: item.name,
      data: stat.one.data
   };
   // TODO: clear canvas display
   // TODO: read from db
   // if has data, eb.emit('update.stock-chart', historyItem);
   if (!stat.network[item.code]) {
      eb.emit('network.fetch.stock-one', item);
      return;
   }
   await stat.network[item.code];
   onUpdate.bind(this)(historyItem);
}

function onResize() {
}

module.exports = ViewOne;
