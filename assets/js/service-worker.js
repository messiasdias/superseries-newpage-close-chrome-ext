(async () => {
  const DOMAIN_LIST = [
    'iqbroker.com',
    'iqoption',
    'stakeaffiliates-br.com',
    'kts.vasstycom.com',
    'suspectplainrevulsion.com',
    'webmasterize.com',
    's.pemsrv.com',
    'clladss.com',
    'tannideoutkill.shop',
    'bl.vowingsirees.top',
    'c.srvpcn.com',
    'bet'
  ];

  //@to-do reset local storage
  //chrome.storage.local.set({ domainList: [], defaultDomainList: []})

  var storage = await chrome.storage.local.get()
  var domainList = [];
  [...DOMAIN_LIST, ...Object.values(storage?.domainList || {})].filter(domain => !domainList.includes(domain) && domainList.push(domain));
  chrome.storage.local.set({ domainList: domainList, defaultDomainList: DOMAIN_LIST })
  storage.domainList = domainList

  var interval = null, exec = 0, isStarted = false;
  const loop = (callback) => {
    interval = setInterval(() => {
      exec++;
      callback(exec)
    }, 1000);
  }

  const getTab = async () => {
    const { domainList } = await chrome.storage.local.get()
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      domainList?.forEach(domain => tab?.url?.includes(domain) && chrome.tabs.remove(tab.id))
    }
  };

  chrome.scripting
    .registerContentScripts([{
      id: "session-script",
      js: ["assets/js/superseries.one.js"],
      persistAcrossSessions: true,
      matches: ["*://*/*"],
      runAt: "document_start",
    }])
    .then(async () => {
      chrome.action.openPopup()
      console.log("Registration completed...")

      isStarted = storage?.isStarted || false;

      clearInterval(interval);
      if (isStarted) {
        loop(getTab);
      }

      chrome.runtime.onMessage.addListener(async (message, extension, callback) => {
        storage = await chrome.storage.local.get()

        if (Object.keys(message)?.includes('isStarted')) {
          isStarted = message.isStarted
          chrome.storage.local.set({ isStarted })
          clearInterval(interval);
          if (isStarted) {
            loop(getTab);
          }
        }

        if (
          Object.keys(message)?.includes('addDomain') &&
          !storage.domainList.includes(message.addDomain)
        ) {
          storage.domainList.push(message.addDomain)
          chrome.storage.local.set({ domainList: storage.domainList })
        }

        if (
          Object.keys(message)?.includes('removeDomain') &&
          storage.domainList.includes(message.removeDomain)
        ) {
          storage.domainList = storage.domainList.filter(d => d != message.removeDomain)
          chrome.storage.local.set({ domainList: storage.domainList })
        }

        if (
          Object.keys(message)?.includes('listDomain') &&
          message.listDomain == true
        ) {
          callback(storage)
        }
      })

    })
    .catch((err) => console.warn(err))
})()