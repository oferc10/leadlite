
chrome.runtime.onInstalled.addListener(()=>{
  console.log('[LeadLite] Extension installed');
});

chrome.action.onClicked.addListener(async (tab)=>{
  if (tab.url.includes('linkedin.com')) {
    chrome.tabs.sendMessage(tab.id, {action:'send'});
  }
});
