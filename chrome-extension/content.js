
console.log('[LeadLite] Extension loaded on', window.location.href);

function extractLeadData() {
  try {
    const url = window.location.href;
    const isSalesNav = url.includes('/sales/');
    
    // NAME - multiple selectors for Sales Nav new UI
    let fullName = '';
    const nameSelectors = [
      'h1[data-anonymize="person-name"]',
      '.artdeco-entity-lockup__title',
      'h1.text-heading-xlarge',
      'h1',
      '.ph5 h1',
      '.lead-name',
      '[data-test-lead-name]'
    ];
    for (const sel of nameSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length > 1 && el.innerText.trim().length < 60 && !el.innerText.toLowerCase().includes('linkedin')) {
        let txt = el.innerText.trim().split('\n')[0];
        // Remove degree like "2nd" if attached
        txt = txt.replace(/\s+2nd|\s+3rd|\s+1st/gi, '').trim();
        if (txt.split(' ').length >=2) { fullName = txt; break; }
      }
    }

    // HEADLINE / TITLE + COMPANY
    let headline = '';
    let jobTitle = '';
    let company = '';
    let location = '';
    
    const headlineSelectors = [
      '[data-anonymize="headline"]',
      '.artdeco-entity-lockup__subtitle',
      '.ph5 .text-body-medium',
      '.artdeco-entity-lockup__metadata',
      '.t-14.t-black--light'
    ];
    for (const sel of headlineSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.length > 5 && el.innerText.length < 200) {
        const t = el.innerText.trim();
        if (t.includes(' at ') || t.toLowerCase().includes('ceo') || t.toLowerCase().includes('founder') || t.toLowerCase().includes('manager') || t.toLowerCase().includes('director')) {
          headline = t.split('\n')[0];
          break;
        }
      }
    }
    // Fallback: second text block
    if (!headline) {
      const all = Array.from(document.querySelectorAll('.artdeco-entity-lockup__subtitle, .t-14')).map(e=>e.innerText.trim()).filter(Boolean);
      if (all.length) headline = all[0];
    }

    if (headline) {
      // Clean: "CEO at Atlas Systems · San Francisco"
      let clean = headline.split('·')[0].split('|')[0].trim();
      if (clean.toLowerCase().includes(' at ')) {
        const parts = clean.split(/\s+at\s+/i);
        jobTitle = parts[0].trim();
        company = parts.slice(1).join(' at ').trim();
      } else if (clean.includes(' @ ')) {
        const parts = clean.split(' @ ');
        jobTitle = parts[0].trim();
        company = parts.slice(1).join(' @ ').trim();
      } else {
        jobTitle = clean;
      }
    }

    // COMPANY fallback from experience section
    if (!company) {
      const expSelectors = [
        'a[data-field="experience_company_logo"] span',
        '.pv-entity__company-summary-info h3',
        'a[href*="/company/"]',
        '[data-anonymize="company-name"]'
      ];
      for (const sel of expSelectors) {
        const el = document.querySelector(sel);
        if (el && el.innerText && el.innerText.length < 80) {
          company = el.innerText.trim().split('\n')[0];
          if (company) break;
        }
      }
    }

    // LOCATION
    const locSelectors = [
      '[data-anonymize="location"]',
      '.artdeco-entity-lockup__caption',
      '.t-14.t-black--light.break-words'
    ];
    for (const sel of locSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.includes(',') && el.innerText.length < 80) {
        location = el.innerText.trim().split('\n')[0].split('·')[0].trim();
        if (location) break;
      }
    }

    // Try to find email from page (if visible)
    const bodyText = document.body.innerText;
    const emailMatch = bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : '';

    // Clean company
    if (company) {
      company = company.replace(/\s*·.*$/, '').replace(/\|.*$/, '').trim();
    }

    return {
      fullName: fullName || '',
      company: company || '',
      jobTitle: jobTitle || headline || '',
      location: location || '',
      linkedinUrl: url,
      email: email || '',
      source: 'leadlite-extension',
      extractedAt: new Date().toISOString()
    };
  } catch (e) {
    console.error('[LeadLite] extract error', e);
    return { error: e.message, linkedinUrl: window.location.href };
  }
}

function showFloatingButton() {
  if (document.getElementById('leadlite-float-btn')) return;
  const btn = document.createElement('div');
  btn.id = 'leadlite-float-btn';
  btn.innerHTML = `
    <div style="position:fixed;bottom:24px;right:24px;z-index:9999999;background:#0F172A;color:white;padding:12px 18px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,0.24);font-family:Inter,sans-serif;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;cursor:pointer;transition:all 0.2s">
      <span style="background:#2563EB;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:11px">L</span>
      Send to LeadLite
      <span style="background:rgba(255,255,255,0.15);padding:2px 6px;border-radius:999px;font-size:10px">↗</span>
    </div>
  `;
  btn.onclick = () => sendToLeadLite();
  document.body.appendChild(btn);
}

async function sendToLeadLite() {
  const data = extractLeadData();
  console.log('[LeadLite] Extracted', data);
  
  // Save to storage
  await chrome.storage.local.set({ lastLead: data, lastLeadAt: Date.now() });
  
  // Try to send to LeadLite tab if open
  const leadB64 = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  const leadliteUrl = `https://leadlite.netlify.app/?import=${leadB64}`;
  
  // Show feedback
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:80px;right:24px;z-index:9999999;background:#10B981;color:white;padding:10px 16px;border-radius:12px;font-family:Inter;font-size:12px;box-shadow:0 8px 24px rgba(0,0,0,0.2)';
  toast.innerText = `✓ Found: ${data.fullName || 'Lead'} @ ${data.company || '...'} - Opening LeadLite`;
  document.body.appendChild(toast);
  setTimeout(()=>toast.remove(), 4000);
  
  window.open(leadliteUrl, '_blank');
}

// Message listener from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'extract') {
    const data = extractLeadData();
    sendResponse(data);
  }
  if (msg.action === 'send') {
    sendToLeadLite();
    sendResponse({ok:true});
  }
  return true;
});

// Auto show button on Sales Nav
if (window.location.href.includes('linkedin.com')) {
  setTimeout(showFloatingButton, 2000);
  // Re-check on navigation (SPA)
  let lastUrl = location.href;
  new MutationObserver(()=>{
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(showFloatingButton, 1500);
    }
  }).observe(document.body, {subtree:true, childList:true});
}
