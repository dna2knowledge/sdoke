const inmemory = {
};

const api = {
   raw: inmemory,
   getStore: async () => null,
   get: async (key) => inmemory[key],
   getMany: async (keys) => Promise.all(keys.map(get)),
   set: async (key, value) => { inmemory[key] = value; },
   setMany: async (keyvals) => { keyvals.forEach(z => { inmemory[z[0]] = z[1]; }); },
   del: async (key) => { delete inmemory[key]; },
   delMany: async (keys) => { keys.forEach(z => { delete inmemory[z]; }); },
   clr: async () => { Object.keys(inmemory).forEach(z => { delete inmemory[z]; }); },
};

window._debugDB = api;

module.exports = api;
