import { app, BrowserWindow, shell, ipcMain, utilityProcess } from "electron";
import path from "path";
import net from "net";
import fs from "fs";

const isDev = !app.isPackaged;
const DEV_PORT = parseInt(process.env.DEV_PORT || "3456", 10);

let mainWindow: BrowserWindow | null = null;
let nextProcess: Electron.UtilityProcess | null = null;

// --- Settings (persisted to userData/settings.json) ---

function getSettingsPath(): string {
  return path.join(app.getPath("userData"), "settings.json");
}

function readSettings(): Record<string, string> {
  try {
    const data = fs.readFileSync(getSettingsPath(), "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function writeSettings(settings: Record<string, string>): void {
  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2));
}

// --- Port & Server Utilities ---

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        const port = addr.port;
        server.close(() => resolve(port));
      } else {
        reject(new Error("Failed to get free port"));
      }
    });
    server.on("error", reject);
  });
}

function waitForServer(url: string, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      fetch(url)
        .then((res) => {
          if (res.ok || res.status === 302 || res.status === 307) {
            resolve();
          } else {
            retry();
          }
        })
        .catch(retry);
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server at ${url} did not start within ${timeoutMs}ms`));
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  });
}

function startNextServer(port: number): Electron.UtilityProcess {
  const standaloneDir = path.join(process.resourcesPath!, "standalone");
  const serverJs = path.join(standaloneDir, "server.js");

  const settings = readSettings();
  const env: Record<string, string> = {
    ...process.env as Record<string, string>,
    PORT: String(port),
    HOSTNAME: "localhost",
  };
  if (settings.OPENAI_API_KEY) {
    env.OPENAI_API_KEY = settings.OPENAI_API_KEY;
  }
  if (settings.GITHUB_CLIENT_ID) {
    env.GITHUB_CLIENT_ID = settings.GITHUB_CLIENT_ID;
  }
  if (settings.GITHUB_CLIENT_SECRET) {
    env.GITHUB_CLIENT_SECRET = settings.GITHUB_CLIENT_SECRET;
  }

  const child = utilityProcess.fork(serverJs, [], {
    cwd: standaloneDir,
    env,
    stdio: "pipe",
  });

  child.stdout?.on("data", (data: Buffer) => {
    console.log(`[next] ${data.toString().trim()}`);
  });
  child.stderr?.on("data", (data: Buffer) => {
    console.error(`[next] ${data.toString().trim()}`);
  });

  return child;
}

// --- Window ---

function createWindow(port: number): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 12 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(`http://localhost:${port}`);

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// --- IPC Handlers ---

ipcMain.handle("get-settings", () => {
  return readSettings();
});

ipcMain.handle("save-settings", (_event, settings: Record<string, string>) => {
  const current = readSettings();
  writeSettings({ ...current, ...settings });
  return true;
});

// --- App Lifecycle ---

app.whenReady().then(async () => {
  const port = isDev ? DEV_PORT : await getFreePort();

  if (!isDev) {
    nextProcess = startNextServer(port);
  }

  await waitForServer(`http://localhost:${port}`);
  createWindow(port);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(port);
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (nextProcess) {
    nextProcess.kill();
    nextProcess = null;
  }
});
