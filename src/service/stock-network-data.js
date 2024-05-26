const { wait } = require('../util/wait');

const stat = {
   progress: {
      list: {
      },
   },
};

async function getShList() {
   const ts = new Date().getTime();
   try {
      // need a proxy to visit stock list
      const url = `https://someproxy/stock.json`;
      const r = await fetch(url, { method: 'GET' });
      const json = await r.json();
      return json;
   } catch(_) {
      stat.progress.list.sh = { ts, err: _ };
      return null;
   }
   return;

   stat.progress.list.sh = { p: 0, ts: new Date().getTime() };
   const r0 = await getN(0, 0);
   if (stat.progress.list.sh.err) return [];
   if (!r0 || !r0.total) {
      stat.progress.list.sh = { err: 'SH list downloader broken - step 1', ts: new Date().getTime() };
      return [];
   }
   stat.progress.list.sh.p = 0.5;
   const r = await getN(0, r0.total);
   if (stat.progress.list.sh.err) return [];
   if (!r || !r.total || !r.list || !r.list.map) {
      stat.progress.list.sh = { err: 'SH list downloader broken - step 2', ts: new Date().getTime() };
      return [];
   }
   stat.progress.list.sh.p = 1;
   return r.list.map(function (z) { return {
      code: z[0],
      name: z[1]
   }; });

   async function getN(a, b) {
      const ts = new Date().getTime();
      try {
         const prefix = `jsonpCallback${ts}`;
         const url = `https://yunhq.sse.com.cn:32042/v1/sh1/list/exchange/equity?callback=${prefix}&select=code%2Cname%2Copen%2Chigh%2Clow%2Clast%2Cprev_close%2Cchg_rate%2Cvolume%2Camount%2Ctradephase%2Cchange%2Camp_rate%2Ccpxxsubtype%2Ccpxxprodusta&order=&begin=${a}&end=${b}&_=${ts}`;
         const r = await fetch(url, { method: 'GET' });
         const raw = await r.text();
         const json = JSON.parse(raw.substring(prefix.length+1, raw.length-1));
         return json;
      } catch(_) {
         stat.progress.list.sh = { ts, err: _ };
         return null;
      }
   }
}

async function getSzList() {
   return [];

   stat.progress.list.sz = { p: 0, ts: new Date().getTime() };
   const all = [];
   let todon = 1;
   for (let i = 0; i < todon; i++) {
      const r0 = await getN(i);
      if (stat.progress.list.sz.err) return [];
      if (!r0 || !r0[0] || !r0[0].metadata || !r0[0].metadata.pagecount || !r0[0].data) {
         stat.progress.list.sz = { err: `SZ list downloader broken - ${i}/${todon}`, ts: new Date().getTime() };
         return [];
      }
      if (i === 0) todon = r0[0].metadata.pagecount;
      r0[0].data.forEach(z => {
         all.push({ code: z.zqdm, name: z.zqjc.replace(/&nbsp;/g, '') });
      });
      stat.progress.list.bj.p = (i+1)/(todon+1);
      await wait(500);
   }
   stat.progress.list.bj.p = 1;
   return all;

   async function getN(b) {
      const ts = new Date().getTime();
      try {
         const datets = new Date(ts - 1000 * 3600 * 24).toISOString().split('T')[0];
         const prefix = `jsonpCallback${ts}`;
         const url = `https://www.szse.cn/api/report/ShowReport/data?SHOWTYPE=JSON&CATALOGID=1815_stock_snapshot&TABKEY=tab1&PAGENO=${b}&tab1PAGESIZE=10&txtBeginDate=${datets}&txtEndDate=${datets}&random=${Math.random()}`;
         const r = await fetch(url, { method: 'GET' });
         const json = await r.json();
         return json;
      } catch(_) {
         stat.progress.list.sz = { ts, err: _ };
         return null;
      }
   }
}

async function getBjList() {
   // temporarily disable bj list
   return [];

   stat.progress.list.bj = { p: 0, ts: new Date().getTime() };
   const all = [];
   let todon = 1;
   for (let i = 0; i < todon; i++) {
      const r0 = await getN(i);
      if (stat.progress.list.bj.err) return [];
      if (!r0 || !r0[0] || !r0[0].totalPages || !r0[0].content) {
         stat.progress.list.bj = { err: `BJ list downloader broken - ${i}/${todon}`, ts: new Date().getTime() };
         return [];
      }
      if (i === 0) todon = r0[0].totalPages;
      r0[0].content.forEach(z => {
         all.push({ code: z.hqzqdm, name: z.hqzqjc });
      });
      stat.progress.list.bj.p = (i+1)/(todon+1);
      await wait(500);
   }
   stat.progress.list.bj.p = 1;
   return all;

   async function getN(b) {
      const ts = new Date().getTime();
      try {
         const prefix = `jQuery331_${ts}`;
         const url = `https://www.bse.cn/nqhqController/nqhq_en.do?callback=${prefix}`;
         const body = `page=${b}&type_en=%5B%22B%22%5D&sortfield=hqcjsl&sorttype=desc&xxfcbj_en=%5B2%5D&zqdm=`;
         const r = await fetch(url, { method: 'POST', body: postbody, headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
         } });
         const raw = await r.text();
         const json = JSON.parse(raw.substring(prefix.length+1, raw.length-1));
         return json;
      } catch(_) {
         stat.progress.list.bj = { ts, err: _ };
         return null;
      }
   }
}

const vk0 = 'trend_qfq';
const vk1 = 'kline_dayqfq';
async function getHistoryFromTencent(code, startDate) {
   try {
      const env = {};
      env.end = new Date();
      if (startDate) {
         env.start = startDate;
      } else {
         const h0 = await getFullHistory(code);
         if (!h0) throw `${code}: data broken`;
         env.start = new Date(h0[0][0]);
      }
      if (dateSame(env.start, env.end)) {
         return [];
      }
      env.start = new Date(env.start.getTime() - (startDate ? (-1) : (24 * 3600 * 1000)));
      const ret = [];
      const ranges = buildRanges(env.start, env.end);
      for (let i = 0; i < ranges.length; i++) {
         const range = ranges[i];
         console.log(`${code}: fetch data between (${range[0]}, ${range[1]}]`);
         const r0 = transform(await getRange(code, range[0], range[1])).filter(x => x.T >= env.start.getTime());
         env.start = new Date(range[1]);
         r0.forEach(function (z) { ret.push(z); });
         await wait(200);
      }
      return ret;
   } catch (err) {
      return [];
   }

   async function getFullHistory(code) {
      const ts = new Date().getTime();
      const url = `https://web.ifzq.gtimg.cn/other/klineweb/klineWeb/weekTrends?code=${code}&type=qfq&_var=${vk0}&r=${Math.random()}`;
      const r = await fetch(url, { method: 'GET' });
      const raw = await r.text();
      const json = JSON.parse(raw.substring(vk0.length+1));
      return json.data;
   }

   async function getRange(code, a, b) {
      const url = `https://proxy.finance.qq.com/ifzqgtimg/appstock/app/newfqkline/get?_var=${vk1}&param=${code},day,${a},${b},640,qfq&r=${Math.random()}`;
      const r = await fetch(url, { method: 'GET' });
      const raw = await r.text();
      const json = JSON.parse(raw.substring(vk1.length+1));
      return json.data[code].qfqday || json.data[code].day || [];
   }

   function transform(list) {
      return list.map(x => ({
         T: new Date(x[0]).getTime(),
         O: parseFloat(x[1]),
         C: parseFloat(x[2]),
         H: parseFloat(x[3]),
         L: parseFloat(x[4]),
         V: parseInt(x[5]),
         m: parseFloat(x[8]),
      }));
   }

   function dateSame(a, b) {
      return a.toISOString().split('T')[0] === b.toISOString().split('T')[0];
   }

   function findStartDate(b) {
      const bY = b.getFullYear();
      if (bY % 2 === 1) return new Date(`${bY-1}-01-01`);
      return new Date(`${bY}-01-01`);
   }

   function buildRanges(a, b) {
      const r = [];
      let cur = b;
      while (cur.getTime() > a.getTime()) {
         let cura = findStartDate(cur);
         if (cura.getTime() < a.getTime()) cura = a;
         r.unshift([cura.toISOString().split('T')[0], cur.toISOString().split('T')[0]]);
         cur = new Date(cura.getTime() - 24 * 3600 * 1000);
      }
      return r;
   }
}

async function getRtFromTencent(codes) {
   try {
      if (!codes || !codes.length) return [];
      const ret = [];
      const url = `http://qt.gtimg.cn/q=${codes.join(',')}`;
      const r = await fetch(url, { method: 'GET' });
      const raw = await r.text();
      raw.split(';').forEach(function (line) {
         const ctp = line.split('"')[1].split('~');
         const item = {
            code: `${ctp[0] === '1' ? 'sh' : 'sz'}${ctp[2]}`,
            name: ctp[1],
            cur: parseFloat(ctp[3]),
            edm1: parseFloat(ctp[4]),
            st: parseFloat(ctp[5]),
            amount: parseInt(ctp[6]),
            outer_amount: parseInt(ctp[7]),
            inner_amount: parseInt(ctp[8]),
            buy: [
               [parseFloat(ctp[9]), parseInt(ctp[10])],
               [parseFloat(ctp[11]), parseInt(ctp[12])],
               [parseFloat(ctp[13]), parseInt(ctp[14])],
               [parseFloat(ctp[15]), parseInt(ctp[16])],
               [parseFloat(ctp[17]), parseInt(ctp[18])]
            ],
            sell: [
               [parseFloat(ctp[19]), parseInt(ctp[20])],
               [parseFloat(ctp[21]), parseInt(ctp[22])],
               [parseFloat(ctp[23]), parseInt(ctp[24])],
               [parseFloat(ctp[25]), parseInt(ctp[26])],
               [parseFloat(ctp[27]), parseInt(ctp[28])],
            ],
            // each buy-sell, ctp[29].split('|') 14:59:52/14.64/3/B/4392/24876
            //                                   <time><price><amount><type B/S><?><?>
            ts: ctp[30], // 20230520150000
            diff: parseFloat(ctp[31]),
            diff_rate: parseFloat(ctp[32]),
            max: parseFloat(ctp[33]),
            min: parseFloat(ctp[34]),
            // ctp[35].split('/') 14.64/55812/81726910
            //                    <price><amount><money>
            amount: parseInt(ctp[36]),
            money: parseFloat(ctp[37]),
            swap_rate: parseFloat(ctp[38]),
            // ctp[39] 涨速
            // ctp[40] ?
            // ctp[41] 最高
            // ctp[42] 最低
            // ctp[43] 振幅
            // ctp[44] 流通市值
            // ctp[45] 总市值
            // ctp[46] 市净率
            // ctp[47] 涨停价
            // ctp[48] 跌停价
            // ctp[49] ?
            // ...
            // ctp[86] ?
         };
         ret.push(item);
      });
   } catch(_) {
      return [];
   }
}

/*
 * ref: https://blog.csdn.net/qq_33269520/article/details/80881568
 * 
 * 600开头的股票是上证A股，属于大盘股，其中6006开头的股票是最早上市的股票，6016开头的股票为大盘蓝筹股;
 * 900开头的股票是上证B股;
 * 000开头的股票是深证A股，001、002开头的股票也都属于深证A股，其中002开头的股票是深证A股中小企业股票;
 * 200开头的股票是深证B股;
 * 300开头的股票是创业板股票;
 * 400开头的股票是三板市场股票。
 * 另外，
 * 沪市权证以580开头，深市权证以031开头;
 * 申购代码：沪市以730开头，深市新股申购的代码与深市股票买卖代码一样;
 * 配股代码：沪市以700开头，深市以080开头。
 * 股票代码用数字表示股票的不同含义。股票代码除了区分各种股票，也有其潜在的意义，一个公司的股票代码跟车牌号差不多，能够显示出这个公司的实力以及知名度。
 * 上交编码
 * 在上海证券交易所上市的证券，根据上交所“证券编码实施方案”，采用6位数编制方法，前3位数为区别证券品种，具体见下表所列：001×××国债现货;110×××120×××企业债券;129×××100×××可转换债券;201×××国债回购;310×××国债期货;500×××550×××基金;600×××A股;700×××配股;710×××转配股;701×××转配股再配股;711×××转配股再转配股;720×××红利;730×××新股申购;735×××新基金申购;737×××新股配售;900×××B股。
 * 沪市A股票买卖的代码是以600、601或603打头，如：运盛实业：股票代码是600767。中国国航：股票代码是601111。应流股份：股票代码是603308。B股买卖的代码是以900打头，如：仪电B股：代码是900901。
 * 沪市新股申购的代码是以730打头。如：中信证券：申购的代码是730030。深市新股申购的代码与深市股票买卖代码一样，如：中信证券在深市市值配售代码是003030。
 * 配股代码，沪市以700打头，深市以080打头。如：运盛实业配股代码是700767。深市草原兴发配股代码是080780。
 * 深交编码
 * 以前深交所的证券代码是四位，前不久已经升为六位具体变化如下：深圳证券市场的证券代码由原来的4位长度统一升为6位长度。1、新证券代码编码规则升位后的证券代码采用6位数字编码，编码规则定义如下：顺序编码区：6位代码中的第3位到第6位，取值范围为0001-9999。证券种类标识区：6位代码中的最左两位，其中第1位标识证券大类，第2位标识该大类下的衍生证券。第1位 第2位 第3-6位 定义0 0 xxxx A股证券3 xxxx A股A2权证7 xxxx A股增发8 xxxx A股A1权证9 xxxx A股转配1 0 xxxx 国债现货1 xxxx 债券2 xxxx 可转换债券3 xxxx 国债回购1 7 xxxx 原有投资基金8 xxxx 证券投资基金2 0 xxxx B股证券7 xxxx B股增发8 xxxx B股权证3 0 xxxx 创业板证券7 xxxx 创业板增发8 xxxx 创业板权证3 9 xxxx 综合指数/成份指数2、新旧证券代码转换此次A股证券代码升位方法为原代码前加“00”，但有两个A股股票升位方法特殊，分别是“0696 ST联益”和“0896 豫能控股”，升位后股票代码分别为“001696”和“001896”。股票代码中的临时代码和特殊符号临时代码新股：新股发行申购代码为730***，新股申购款代码为740***，新股配号代码为741***;新股配售代码为737***，新股配售的配号(又称“新股值号”)为747***;可转换债券发行申购代码为733***;
 * 深市A股票买卖的代码是以000打头，如：顺鑫农业：股票代码是000860。B股买卖的代码是以200打头，如：深中冠B股，代码是200018。
 * 中小板股票代码以002打头，如：东华合创股票代码是002065。
 * 创业板股票代码以300打头，如：探路者股票代码是：300005
 * 小知识普及
 * 股票名字前的字母含义：
 * 指数名字前的“G”是指“贡”字，也就是“贡献”的意思。你点一下可以看见所有股票对该指数的涨跌贡献度。
 * 股票名字前面“L”是指“联”，也就是指关联品种，是指该股可能有B股、H股，或者是债券、权证什么的。
 * 股票名称中的英文含义：
 * 分红类：
 * XR,表示该股已除权，购买这样的股票后将不再享有分红的权利;
 * DR，表示除权除息，购买这样的股票不再享有送股派息的权利;
 * XD，表示股票除息，购买这样的股票后将不再享有派息的权利。
 * 其他类：
 * ST，这是对连续两个会计年度都出现亏损的公司施行的特别处理。ST即为亏损股。
 * *ST，是连续三年亏损，有退市风险的意思，购买这样的股票要有比较好的基本面分析能力。
 * N，新股上市首日的名称前都会加一个字母N，即英文NEW的意思。
 * S*ST，指公司经营连续三年亏损，进行退市预警和还没有完成股改。
 * SST，指公司经营连续二年亏损进行的特别处理和还没有完成股改。
 * S，还没有进行或完成股改的股票。
 * NST，经过重组或股改重新恢复上市的ST股
 */
function utilIsShKc(code) {
   return code.startsWith('sh688');
}
function utilIsSzCy(code) {
   return code.startsWith('sz3');
}
function utilIsB(code) {
   if (code.startsWith('sz')) return code.startsWith('sz2');
   if (code.startsWith('sh')) return code.startsWith('sh9');
   return false;
}
function utilIsST(code, name) {
   return name.indexOf('ST') >= 0;
}
function utilIsD(code, name) {
   return name.indexOf('XD') >= 0 || name.indexOf('DR') >= 0;
}
function utilIsR(code, name) {
   return name.indexOf('XR') >= 0 || name.indexOf('DR') >= 0;
}

const api = {
   getShList,
   getSzList,
   getBjList,
   tencent: {
      getRt: getRtFromTencent,
      getHistory: getHistoryFromTencent,
   },
   util: {
      isKc: utilIsShKc,
      isCy: utilIsSzCy,
      isB: utilIsB,
      isST: utilIsST,
      isD: utilIsD,
      isR: utilIsR,
   }
};

if (window.DEBUG) {
console.log('[DEBUG mode] for stock network data - faked');
module.exports = require('../debug/faked-stock-network-data');
} else {
module.exports = api;
}
