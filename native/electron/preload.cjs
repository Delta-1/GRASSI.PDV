const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('GRASSI_NATIVE_APP', Object.freeze({
  platform: 'desktop',
  container: 'electron'
}));
