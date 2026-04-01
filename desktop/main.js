const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

// ─── Auto-updater (only in packaged builds) ────────────────────────────
let autoUpdater = null;
try {
  if (app.isPackaged) {
    const { autoUpdater: au } = require('electron-updater');
    autoUpdater = au;
    autoUpdater.autoDownload = false; // Let user decide
    autoUpdater.autoInstallOnAppQuit = true;
  }
} catch (e) {
  console.log('electron-updater not available:', e.message);
}

function setupAutoUpdater() {
  if (!autoUpdater || !mainWindow) return;

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseDate: info.releaseDate,
    });
  });

  autoUpdater.on('update-not-available', () => {
    // Silently ignore — no update needed
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('download-progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('update-downloaded', {
      version: info.version,
    });
  });

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('update-error', err.message);
  });

  // Check for updates after a short delay
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 5000);
}

// ─── IPC Handlers ──────────────────────────────────────────────────────

// Backup: save all localStorage data to a JSON file
ipcMain.handle('export-backup', async (_event, data) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Assessment Data Backup',
    defaultPath: `DAS-Backup-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [
      { name: 'JSON Backup Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (canceled || !filePath) return { success: false, reason: 'cancelled' };

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, filePath };
  } catch (err) {
    return { success: false, reason: err.message };
  }
});

// Restore: load a JSON backup file and return the data
ipcMain.handle('import-backup', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Import Assessment Data Backup',
    filters: [
      { name: 'JSON Backup Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (canceled || filePaths.length === 0) return { success: false, reason: 'cancelled' };

  try {
    const raw = fs.readFileSync(filePaths[0], 'utf-8');
    const data = JSON.parse(raw);
    return { success: true, data, filePath: filePaths[0] };
  } catch (err) {
    return { success: false, reason: err.message };
  }
});

// Auto-update IPC
ipcMain.handle('check-for-updates', async () => {
  if (!autoUpdater) return { available: false, reason: 'updater-not-available' };
  try {
    const result = await autoUpdater.checkForUpdates();
    return { available: !!result?.updateInfo, info: result?.updateInfo };
  } catch (err) {
    return { available: false, reason: err.message };
  }
});

ipcMain.handle('install-update', async () => {
  if (!autoUpdater) return;
  autoUpdater.quitAndInstall();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// ─── Window Creation ───────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Developmental Assessment Suite',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    show: false,
    backgroundColor: '#faf8f5',
  });

  // Load the built React app
  mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    setupAutoUpdater();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // ─── Application Menu ──────────────────────────────────────────────
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Assessment',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            dialog
              .showMessageBox(mainWindow, {
                type: 'warning',
                buttons: ['Cancel', 'New Assessment'],
                defaultId: 0,
                title: 'New Assessment',
                message: 'Start a new assessment?',
                detail:
                  'Unsaved data will be lost. Make sure you have saved or exported your current assessment first.',
              })
              .then(({ response }) => {
                if (response === 1) {
                  mainWindow.webContents.executeJavaScript(
                    'localStorage.clear(); location.reload();'
                  );
                }
              });
          },
        },
        { type: 'separator' },
        {
          label: 'Export Backup…',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              (async () => {
                const keys = Object.keys(localStorage);
                const data = {};
                keys.forEach(k => { data[k] = localStorage.getItem(k); });
                data.__backup_meta = {
                  version: '1.0.0',
                  exportedAt: new Date().toISOString(),
                  keyCount: keys.length
                };
                const result = await window.electronAPI.exportBackup(data);
                if (result.success) {
                  // Show a brief toast-like notification via the app
                  document.dispatchEvent(new CustomEvent('backup-success', { detail: result.filePath }));
                }
              })();
            `);
          },
        },
        {
          label: 'Import Backup…',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              (async () => {
                const result = await window.electronAPI.importBackup();
                if (result.success && result.data) {
                  const meta = result.data.__backup_meta;
                  const keyCount = meta ? meta.keyCount : Object.keys(result.data).length;
                  if (confirm('Restore backup' + (meta ? ' from ' + meta.exportedAt.slice(0,10) : '') + ' with ' + keyCount + ' data entries?\\n\\nThis will replace all current data.')) {
                    localStorage.clear();
                    Object.entries(result.data).forEach(([k, v]) => {
                      if (k !== '__backup_meta') localStorage.setItem(k, v);
                    });
                    location.reload();
                  }
                }
              })();
            `);
          },
        },
        { type: 'separator' },
        {
          label: 'Print Report',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.print();
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates…',
          click: () => {
            if (autoUpdater) {
              autoUpdater
                .checkForUpdates()
                .then((result) => {
                  if (!result || !result.updateInfo) {
                    dialog.showMessageBox(mainWindow, {
                      type: 'info',
                      title: 'No Updates',
                      message: 'You are running the latest version.',
                    });
                  }
                })
                .catch(() => {
                  dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: 'Update Check',
                    message: 'Unable to check for updates. Please try again later.',
                  });
                });
            } else {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Updates',
                message: 'Auto-update is not available in development mode.',
              });
            }
          },
        },
        { type: 'separator' },
        {
          label: 'About Developmental Assessment Suite',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About',
              message: 'Developmental Assessment Suite',
              detail: `Version ${app.getVersion()}\n\nA comprehensive developmental assessment tool supporting Bayley-4, DAYC-2, REEL-3, and Sensory Profile 2.\n\nAll data is stored locally on your computer.\n\nUse File → Export Backup to save your data.`,
            });
          },
        },
      ],
    },
  ];

  // macOS-specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Check for Updates…',
          click: () => {
            if (autoUpdater) {
              autoUpdater.checkForUpdates().catch(() => {});
            }
          },
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ─── App Lifecycle ─────────────────────────────────────────────────────

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
