# LeadLite CRM
Live: https://leadlite.netlify.app
GitHub: https://github.com/oferc10/leadlite

Windows 11 fluent CRM + Two-way Google Calendar + LinkedIn Sales Navigator Chrome Extension

## Features
- Pipeline drag-drop, Tasks with DATE+TIME, Deal value ₪
- Editable Tasks (click to edit)
- Google Calendar two-way sync (delete/change in Calendar updates app)
- LinkedIn Sales Navigator 1-click import via Chrome Extension
- Client ID: 31603514497-1nq0se6el6bfvc0mvds2co08ul42vd8v.apps.googleusercontent.com

## Google Calendar Setup
In https://console.cloud.google.com/apis/credentials -> OAuth Client 31603514497-... -> Authorized JavaScript origins:
- http://localhost:8000
- https://leadlite.netlify.app

## Chrome Extension Install
1. Unzip, go to chrome://extensions/ -> Developer mode ON -> Load unpacked -> select chrome-extension folder
2. Open LinkedIn Sales Navigator lead -> Click floating "Send to LeadLite" button
3. LeadLite opens with auto-filled lead

## Deploy
This repo auto-deploys to Netlify on push to main.
