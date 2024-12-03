export async function getPopularRankingFromEastmoney(code) {
   // UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36
   // host: emappdata.eastmoney.com
   // origin: https://vipmoney.eastmoney.com
   // referer: https://vipmoney.eastmoney.com/
   // POST https://emappdata.eastmoney.com/stockrank/getAllCurrentList
   // {"appId":"appId01","globalId":"786e4c21-70dc-435a-93bb-38","marketType":"","pageNo":1,"pageSize":100}

   // POST https://emappdata.eastmoney.com/label/getSecurityCodeLabelList
   // {"appId":"appId01","globalId":"786e4c21-70dc-435a-93bb-label","securityCodes":"SH..., SZ..."}
   const r = {};
   const headers = {
      Host: 'emappdata.eastmoney.com',
      Origin: 'https://vipmoney.eastmoney.com',
      Referer: 'https://vipmoney.eastmoney.com',
      'Content-Type': 'application/json',
   };

   if (code) {
      // POST https://emappdata.eastmoney.com/stockrank/getCurrentList
      // {"appId":"appId01","globalId":"786e4c21-70dc-435a-93bb-38","marketType":"","securityCode":"SH.../SZ..."}
      // POST https://emappdata.eastmoney.com/stockrank/getHisList
      // {"appId":"appId01","globalId":"786e4c21-70dc-435a-93bb-38","marketType":"","srcSecurityCode":"SH.../SZ...", "yearType": 2}
      try {
         // const url = `https://emappdata.eastmoney.com/stockrank/getCurrentList`
         const url = `https://emappdata.eastmoney.com/stockrank/getHisList`;
         const r0 = await fetch(url, {
            method: 'POST',
            headers,
            body: `{"appId":"appId01","globalId":"786e4c21-70dc-435a-93bb-38","marketType":"","srcSecurityCode":"${code.toUpperCase()}","yearType":2}`
         });
         const json = await r0.json();
         if (json.code !== 0) throw 'return code is not 0';
         if (!json.data || !json.data.length) throw 'return no data';
         const last = json.data[json.data.length-1];
         r.data = [{ sc: code, rc: 0, hisRc: 0, rk: last.rank, history: json.data }];
      } catch(err) {
         return null;
      }
   }

   try {
      const url = `https://emappdata.eastmoney.com/stockrank/getAllCurrentList`;
      const r0 = await fetch(url, {
         method: 'POST',
         headers,
         body: `{"appId":"appId01","globalId":"786e4c21-70dc-435a-93bb-38","marketType":"","pageNo":1,"pageSize":100}`
      });
      const json = await r0.json();
      if (json.code !== 0) throw 'return code is not 0';
      if (!json.data || !json.data.length) throw 'return no data';
      r.data = json.data;
   } catch(err) {
      return null;
   }
   try {
      const url = `https://emappdata.eastmoney.com/label/getSecurityCodeLabelList`;
      const r0 = await fetch(url, {
         method: 'POST',
         headers,
         body: `{"appId":"appId01","globalId":"786e4c21-70dc-435a-93bb-label","securityCodes":"${r.data.map(z => z.sc).join(',')}"}`
      });
      const json = await r0.json();
      if (json.code !== 0) throw 'return code is not 0';
      if (!json.data || !json.data.length) throw 'return no data';
      const map = {};
      json.data.forEach(z => { map[z.srcSecurityCode] = z.labelItemList; });
      r.data.forEach(z => z.label = map[z.sc]);
   } catch(err) {
      return null;
   }
   return r.data;
}

export function getNearMarkerDate(date) {
   // 4m 1st
   // 7m8m half
   // 10m 3rd
   // 1m2m3m4m whole
   if (!date) date = new Date();
   const m = date.getMonth() + 1;
   if (m >= 4 && m <= 8) return `${date.getFullYear()}-03-31`;
   if (m === 9 || m === 10) return `${date.getFullYear()}-06-30`;
   if (m === 11 || m === 12) return `${date.getFullYear()}-09-30`;
   if (m === 1 || m === 2) return `${date.getFullYear() - 1}-09-30`;
   return `${date.getFullYear() - 1}-12-31`;
}

export async function getF10EhHolder(code, date) {
   if (!code) return null;
   const r = {};
   const headers = {
      Host: 'datacenter.eastmoney.com',
      Origin: 'https://datapc.eastmoney.com',
      Referer: 'https://datapc.eastmoney.com',
   };
   // GET https://datacenter.eastmoney.com/securities/api/data/v1/get
   //     ?reportName=RPT_F10_EH_HOLDERS&columns=ALL&quoteColumns=&filter=(SECUCODE%3D%22601012.SH%22)(END_DATE%3D%272024-09-30%27)
   //     &pageNumber=1&pageSize=&sortTypes=1&sortColumns=HOLDER_RANK&source=HSF10&client=PC&v=04912152106683181
   try {
      const numcode = code.substring(2);
      const at = code.substring(0, 2).toUpperCase();
      const url = `https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_EH_HOLDERS&columns=ALL&quoteColumns=&filter=(SECUCODE%3D%22${
         numcode /* e.g. numcode.at = 600000.SH */
      }.${at}%22)(END_DATE%3D%27${
         date /* e.g. 2024-09-30 */
      }%27)`;
      const r0 = await fetch(url, { method: 'GET', headers, });
      const json = await r0.json();
      if (json.code !== 0) throw 'return code is not 0';
      if (!json.result || !json.result.data || !json.result.data.length) throw 'return no data';
      r.code = code;
      /* e.g. {
         "SECUCODE":"601012.SH","SECURITY_CODE":"601012","ORG_CODE":"10152075","END_DATE":"2024-09-30 00:00:00",
         "HOLDER_NAME":"中央汇金资产管理有限责任公司","HOLD_NUM":90246278,"HOLD_NUM_RATIO":1.19,
         "HOLD_NUM_CHANGE":"不变","CHANGE_RATIO":null,"HOLDER_CODE":"10506881","IS_HOLDORG":"1",
         "SECURITY_TYPE_CODE":"058001001","SECURITY_NAME_ABBR":"隆基绿能","HOLDER_RANK":10,
         "HOLDER_STATE":null,"HOLDER_MARKET_CAP":1584724641.68,
         "HOLDER_NEW":"10506881","HOLD_RATIO_QOQ":"不变","IS_REPORT":"1","HOLDER_STATEE":null,"SHARES_TYPE":"流通A股",
         "HOLDER_CODE_OLD":"80475097","NEW_CHANGE_RATIO":"不变","HOLDER_STATE_NEW":"不变","TOTAL_SHARES_NUM":7578045159} */
      r.data = json.result.data.map(z => ({
         id: z.HOLDER_NEW,
         name: z.HOLDER_NAME,
         rank: z.HOLDER_RANK,
         state: z.HOLDER_STATE_NEW, // 加仓, 减仓, 不变
         vol: z.HOLD_NUM,
         vol_rate: z.HOLD_NUM_RATIO,
         vol_diff: parseFloat(z.HOLD_NUM_CHANGE),
         amount: z.HOLDER_MARKET_CAP,
         org: parseInt(z.IS_HOLDORG) ? z.HOLDER_CODE : null,
      }));
   } catch (err) {
      return null;
   }
}

function randomDigits(n) {
   const r = [];
   for(let i = 0; i < n; i++) r.push(`${~~(Math.random() * 10)}`);
   return r.join('');
}

export async function getNorthOrgHolder(code, date) {
   if (!code) return null;
   const r = {};
   const headers = {
      Host: 'datacenter.eastmoney.com',
      Origin: 'https://datapc.eastmoney.com',
      Referer: 'https://datapc.eastmoney.com',
   };
   // GET https://datacenter.eastmoney.com/securities/api/data/v1/get
   //     ?reportName=RPT_NORTH_ORG_HOLDDETAIL
   //     &columns=TRADE_DATE%2CHOLD_ORG_NAME%2CHOLD_MARKET_CAP%2CADD_MARKET_CAP%2CFREE_SHARES_RATIO%2CTOTAL_SHARES_RATIO%2CADD_SHARES_AMP%2CHOLD_SHARES%2CADD_SHARES_REPAIR&quoteColumns=
   //     &filter=(SECUCODE%3D%22601012.SH%22)(TRADE_DATE%3D%272024-08-16%27)
   //     &pageNumber=1&pageSize=10&sortTypes=-1&sortColumns=HOLD_SHARES&source=HSF10
   //     &client=PC&v=001234567890123456
   try {
      const numcode = code.substring(2);
      const at = code.substring(0, 2).toUpperCase();
      const url = `https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_NORTH_ORG_HOLDDETAIL&columns=TRADE_DATE%2CHOLD_ORG_NAME%2CHOLD_MARKET_CAP%2CADD_MARKET_CAP%2CFREE_SHARES_RATIO%2CTOTAL_SHARES_RATIO%2CADD_SHARES_AMP%2CHOLD_SHARES%2CADD_SHARES_REPAIR&quoteColumns=&filter=(SECUCODE%3D%22${
         numcode /* e.g. numcode.at = 600000.SH */
      }.${at}%22)(TRADE_DATE%3D%27${
         date /* e.g. 2024-09-30 */
      }%27)&pageNumber=1&pageSize=10&sortTypes=-1&sortColumns=HOLD_SHARES&source=HSF10&client=PC&v=00${randomDigits(16)}`;
      const r0 = await fetch(url, { method: 'GET', headers, });
      const json = await r0.json();
      if (json.code !== 0) throw 'return code is not 0';
      if (!json.result || !json.result.data || !json.result.data.length) throw 'return no data';
      r.code = code;
      /* e.g. {
         "TRADE_DATE":"2024-08-16 00:00:00","HOLD_ORG_NAME":"美林远东有限公司","HOLD_MARKET_CAP":59810789.64,
         "ADD_MARKET_CAP":-23187368.0976,"FREE_SHARES_RATIO":0.057527,"TOTAL_SHARES_RATIO":0.057527,
         "ADD_SHARES_AMP":-27.3063199,"HOLD_SHARES":4359387,"ADD_SHARES_REPAIR":-1675848} */
      r.data = json.result.data.map(z => ({
         name: z.HOLDER_ORG_NAME,
         vol: z.HOLD_SHARES,
         vol_rate: z.TOTAL_SHARES_RATIO,
         vol_diff: z.ADD_SHARES_REPAIR,
         amount: z.HOLD_MARKET_CAP,
      }));
   } catch (err) {
      return null;
   }
}

export async function getHolderBasicInfo(holderId, date) {
   if (!code) return null;
   const r = {};
   const headers = {
      Host: 'datacenter.eastmoney.com',
      Origin: 'https://datapc.eastmoney.com',
      Referer: 'https://datapc.eastmoney.com',
   };
   // GET https://datacenter.eastmoney.com/securities/api/data/v1/get
   //     ?reportName=RPT_F10_EH_FREEHOLDERS
   //     &columns=HOLDER_NEW%2CSECUCODE%2CSECURITY_CODE%2CSECURITY_NAME_ABBR%2CEND_DATE%2CHOLDER_NAME%2CFREE_HOLDNUM_RATIO%2CHOLDER_MARKET_CAP%2CHOLDER_RANK%2CHOLDER_STATE_NEW%2CCHANGE_RATIO&quoteColumns=
   //     &filter=(HOLDER_NEW%3D%22%E9%99%88%E5%8F%91%E6%A0%91%22)(END_DATE%3D%272024-09-30%27)(HOLDER_STATE_NEW%20in%20(%22%E6%96%B0%E8%BF%9B%22%2C%22%E5%8A%A0%E4%BB%93%22%2C%22%E4%B8%8D%E5%8F%98%22%2C%22%E5%87%8F%E4%BB%93%22))
   //     &pageNumber=1&pageSize=10&sortTypes=-1&sortColumns=FREE_HOLDNUM_RATIO&source=Datacenter&client=PC&v=01234567890123456
   try {
      const url = `https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_EH_FREEHOLDERS&columns=HOLDER_NEW%2CSECUCODE%2CSECURITY_CODE%2CSECURITY_NAME_ABBR%2CEND_DATE%2CHOLDER_NAME%2CFREE_HOLDNUM_RATIO%2CHOLDER_MARKET_CAP%2CHOLDER_RANK%2CHOLDER_STATE_NEW%2CCHANGE_RATIO&quoteColumns=&filter=(HOLDER_NEW%3D%22${
         encodeURIComponent(holderId)
      }%22)(END_DATE%3D%27${
         date /* e.g. 2024-09-30 */
      }%27)(HOLDER_STATE_NEW%20in%20(%22%E6%96%B0%E8%BF%9B%22%2C%22%E5%8A%A0%E4%BB%93%22%2C%22%E4%B8%8D%E5%8F%98%22%2C%22%E5%87%8F%E4%BB%93%22))&pageNumber=1&pageSize=10&sortTypes=-1&sortColumns=FREE_HOLDNUM_RATIO&source=Datacenter&client=PC&v=00${
         randomDigits(16)
      }`;
      const r0 = await fetch(url, { method: 'GET', headers, });
      const json = await r0.json();
      if (json.code !== 0) throw 'return code is not 0';
      if (!json.result || !json.result.data || !json.result.data.length) throw 'return no data';
      const last = json.result.data[json.result.data.length - 1];
      r.name = last.HOLDER_NAME;
      r.id = holderId;
      /* {
         "HOLDER_NEW":"陈发树","SECUCODE":"603098.SH","SECURITY_CODE":"603098","SECURITY_NAME_ABBR":"森特股份",
         "END_DATE":"2024-09-30 00:00:00",
         "HOLDER_NAME":"陈发树",
         "FREE_HOLDNUM_RATIO":1.159900195839,"HOLDER_MARKET_CAP":58683199.38,"HOLDER_RANK":7,
         "HOLDER_STATE_NEW":"不变","CHANGE_RATIO":null
         } */
      r.data = json.result.data.map(z => ({
         code: `${z.SECUCODE.substring(7).toLowerCase()}${z.SECUCODE.substring(0, 6)}`,
         name: z.SECURITY_NAME_ABBR,
         rank: z.HOLDER_RANK,
         rate: z.HOLD_NUM_RATIO,
         state: z.HOLDER_STATE_NEW,
         money: z.HOLDER_MARKET_CAP,
         ts: new Date(z.END_DATE),
      }));
   } catch (err) {
      return null;
   }
}


/*
TODO:
https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_PCF10_FINANCEMAINFINADATA&columns=SECUCODE%2CSECURITY_CODE%2CSECURITY_NAME_ABBR%2CREPORT_DATE%2CREPORT_TYPE%2CEPSJB%2CEPSKCJB%2CEPSXS%2CBPS%2CMGZBGJ%2CMGWFPLR%2CMGJYXJJE%2CTOTAL_OPERATEINCOME%2CTOTAL_OPERATEINCOME_LAST%2CPARENT_NETPROFIT%2CPARENT_NETPROFIT_LAST%2CKCFJCXSYJLR%2CKCFJCXSYJLR_LAST%2CROEJQ%2CROEJQ_LAST%2CXSMLL%2CXSMLL_LAST%2CZCFZL%2CZCFZL_LAST%2CYYZSRGDHBZC_LAST%2CYYZSRGDHBZC%2CNETPROFITRPHBZC%2CNETPROFITRPHBZC_LAST%2CKFJLRGDHBZC%2CKFJLRGDHBZC_LAST%2CTOTALOPERATEREVETZ%2CTOTALOPERATEREVETZ_LAST%2CPARENTNETPROFITTZ%2CPARENTNETPROFITTZ_LAST%2CKCFJCXSYJLRTZ%2CKCFJCXSYJLRTZ_LAST%2CTOTAL_SHARE%2CFREE_SHARE%2CEPSJB_PL%2CBPS_PL%2CFORMERNAME&quoteColumns=&filter=(SECUCODE%3D%22601012.SH%22)&sortTypes=-1&sortColumns=REPORT_DATE&pageNumber=1&pageSize=1&source=HSF10&client=PC&v=01234567890123456
{"version":"6dfdcd74199b987fa5056610eb36e349","result":{"pages":1,"data":[{
   "SECUCODE":"601012.SH","SECURITY_CODE":"601012","SECURITY_NAME_ABBR":"隆基绿能", "FORMERNAME":"隆基股份",
   "REPORT_DATE":"2024-09-30 00:00:00","REPORT_TYPE":"2024三季报",
   "EPSJB":-0.858348240325,                   基本每股收益
   "EPSJB_PL":-0.86,
   "EPSKCJB":null,                            扣非每股收益
   "EPSXS":-0.86,                             稀释每股收益
   "BPS":8.217010855242,                      每股净资产
   "BPS_PL":8.216991482526,
   "MGZBGJ":1.710510973111,                   每股公积金
   "MGWFPLR":5.036462356698,                  每股未分配利润
   "MGJYXJJE":-1.104121375638,                每股经营现金流(元)
   "TOTAL_OPERATEINCOME":58592695599.44,      营业总收入(元)
   "TOTAL_OPERATEINCOME_LAST":94100142094.42, 营业总收入 | 上年同期
   "PARENT_NETPROFIT":-6504601727.33,         归属净利润(元)
   "PARENT_NETPROFIT_LAST":11693716357.94,    归属净利润 | 上年同期
   "KCFJCXSYJLR":-6488130560.52,              扣非净利润(元)
   "KCFJCXSYJLR_LAST":11514297936.76,         扣非净利润 | 上年同期
   "ROEJQ":-9.72,
   "ROEJQ_LAST":17.37,
   "XSMLL":7.9783504194,                      毛利率(%)
   "XSMLL_LAST":20.2565157012,                毛利率 | 上年同期
   "ZCFZL":59.1955928532,                     资产负债率(%)
   "ZCFZL_LAST":56.3533850544,                资产负债率 | 上年同期
   "YYZSRGDHBZC_LAST":-4.797404610333,        营业总收入滚动环比增长 | 上年同期
   "YYZSRGDHBZC":-9.077492224831,             营业总收入滚动环比增长(%)
   "NETPROFITRPHBZC":-102.896198308514,       归属净利润滚动环比增长(%)
   "NETPROFITRPHBZC_LAST":-11.309022005437,   归属净利润滚动环比增长 | 上年同期
   "KFJLRGDHBZC":-104.64225688136,            扣非净利润滚动环比增长(%)
   "KFJLRGDHBZC_LAST":-10.516406285156,       扣非净利润滚动环比增长 | 上年同期
   "TOTALOPERATEREVETZ":-37.7336799974,       营业总收入同比增长(%)
   "TOTALOPERATEREVETZ_LAST":8.5468230711,    营业总收入同比增长 | 上年同期
   "PARENTNETPROFITTZ":-155.62476058275,      归属净利润同比增长(%)
   "PARENTNETPROFITTZ_LAST":6.538262704364,   归属净利润同比增长 | 上年同期
   "KCFJCXSYJLRTZ":-156.348468627048,         扣非净利润同比增长(%)
   "KCFJCXSYJLRTZ_LAST":8.074159827714,       扣非净利润同比增长 | 上年同期
   "TOTAL_SHARE":7578045159,                  总股本(万股)
   "FREE_SHARE":7578037613,
}],"count":1},"success":true,"message":"ok","code":0}

*/