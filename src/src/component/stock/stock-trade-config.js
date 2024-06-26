function getTodayTs() {
   const ts = new Date().getTime();
   return ts - ts % (24 * 3600 * 1000);
}

function getDateStr(ts) {
   return new Date(ts).toISOString().split('T')[0];
}

const config = {
   th1: 40,
   tw1: 105,
   dh: 24,
   dayms: 24 * 3600 * 1000,
   util: {
      getTodayTs,
      getDateStr,
   },
};
export default config;