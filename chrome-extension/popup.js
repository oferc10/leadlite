
async function getActiveTab(){
  const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
  return tab;
}

document.getElementById('extractBtn').onclick = async ()=>{
  const tab = await getActiveTab();
  if (!tab.url.includes('linkedin.com')) {
    document.getElementById('preview').style.display='block';
    document.getElementById('preview').innerText = 'Open a LinkedIn Sales Navigator lead page first (linkedin.com/sales/lead/... or linkedin.com/in/...)';
    return;
  }
  chrome.tabs.sendMessage(tab.id, {action:'extract'}, (data)=>{
    if (chrome.runtime.lastError) {
      document.getElementById('preview').style.display='block';
      document.getElementById('preview').innerText = 'Refresh the LinkedIn page and try again. Error: ' + chrome.runtime.lastError.message;
      return;
    }
    document.getElementById('preview').style.display='block';
    document.getElementById('preview').innerText = `Found:\nName: ${data.fullName||'-'}\nCompany: ${data.company||'-'}\nTitle: ${data.jobTitle||'-'}\nLocation: ${data.location||'-'}\nURL: ${data.linkedinUrl?.slice(0,60)||''}`;
    chrome.storage.local.set({lastLead:data});
  });
};

document.getElementById('sendBtn').onclick = async ()=>{
  const tab = await getActiveTab();
  if (tab.url.includes('linkedin.com')) {
    chrome.tabs.sendMessage(tab.id, {action:'send'});
  } else {
    // No LinkedIn tab, open LeadLite with last stored lead
    const {lastLead} = await chrome.storage.local.get('lastLead');
    if (lastLead) {
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(lastLead))));
      chrome.tabs.create({url:`https://leadlite.netlify.app/?import=${b64}`});
    } else {
      chrome.tabs.create({url:'https://leadlite.netlify.app'});
    }
  }
};
