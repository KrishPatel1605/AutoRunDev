const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

let terminals = []; // keep track of running terminals
let webviewPanel = null;

function activate(context) {
  // Register webview provider
  const provider = new AutoRunDevWebviewProvider(context.extensionUri);
  
  // Register the webview view
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('autorundevView', provider)
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("autorundev.start", () => startProject(provider)),
    vscode.commands.registerCommand("autorundev.autoconfig", () => autoConfig(provider)),
    vscode.commands.registerCommand("autorundev.add", () => addCustomProject(provider)),
    vscode.commands.registerCommand("autorundev.runAll", () => runAllProjects(provider)),
    vscode.commands.registerCommand("autorundev.stop", () => stopAllProjects(provider)),
    vscode.commands.registerCommand("autorundev.restart", () => restartAllProjects(provider)),
    vscode.commands.registerCommand("autorundev.remove", () => removeProject(provider))
  );
}

class AutoRunDevWebviewProvider {
  constructor(extensionUri) {
    this._extensionUri = extensionUri;
    this._view = null;
  }

  resolveWebviewView(webviewView, context, _token) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'startAll':
            startProject(this);
            break;
          case 'stopAll':
            stopAllProjects(this);
            break;
          case 'addProject':
            addCustomProject(this);
            break;
          case 'removeProject':
            removeProject(this);
            break;
          case 'autoConfig':
            autoConfig(this);
            break;
          case 'runAll':
            runAllProjects(this);
            break;
          case 'restart':
            restartAllProjects(this);
            break;
          case 'playTerminal':
            playTerminal(message.name, this);
            break;
          case 'stopTerminal':
            stopTerminal(message.name, this);
            break;
          case 'restartTerminal':
            restartTerminal(message.name, this);
            break;
          case 'deleteTerminal':
            deleteTerminal(message.name, this);
            break;
        }
      },
      undefined,
      []
    );

    // Send initial terminal data
    this.updateTerminals();
    
    // Update terminals periodically to reflect current state
    setInterval(() => {
      this.updateTerminals();
    }, 2000);
  }

  updateTerminals() {
    if (this._view) {
      const config = this._getCurrentConfig();
      const configProjects = Object.keys(config);
      
      // Create terminal data that includes all projects from config
      const terminalData = configProjects.map(projectName => {
        const runningTerminal = terminals.find(t => t.name === projectName);
        return {
          name: projectName,
          status: runningTerminal && runningTerminal.exitStatus === undefined ? 'running' : 'stopped',
          port: this._extractPort(projectName)
        };
      });

      this._view.webview.postMessage({
        command: 'updateTerminals',
        terminals: terminalData
      });
    }
  }

  _extractPort(terminalName) {
    // Try to extract port from common patterns
    const config = this._getCurrentConfig();
    if (config[terminalName]) {
      const command = config[terminalName].start;
      const portMatch = command.match(/:(\d{4,5})/);
      return portMatch ? portMatch[1] : null;
    }
    return null;
  }

  _getCurrentConfig() {
    const rootPath = getWorkspaceRoot();
    if (!rootPath) return {};
    return readConfig(rootPath);
  }

  _getHtmlForWebview(webview) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AutoRunDev</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family);
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 16px;
            min-height: 100vh;
            font-size: var(--vscode-font-size);
        }

        .container {
            max-width: 100%;
        }

        .control-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
        }

        .control-button {
            background: #007acc;
            border: 1px solid #0e639c;
            color: white;
            padding: 12px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 45.6px;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s ease;
            position: relative;
        }

        .control-button:hover {
            background: #1177bb;
            border-color: #1177bb;
        }

        .control-button:active {
            background: #005a9e;
            transform: translateY(1px);
        }

        .play-button::before {
            content: '';
            width: 0;
            height: 0;
            border-left: 10px solid white;
            border-top: 6px solid transparent;
            border-bottom: 6px solid transparent;
            margin-right: 8px;
        }

        .stop-button::before {
            content: '';
            width: 12px;
            height: 12px;
            background: white;
            margin-right: 8px;
        }

        .add-button::before {
            content: '+';
            font-size: 18px;
            font-weight: bold;
            margin-right: 6px;
        }

        .trash-button::before {
            content: '🗑️';
            margin-right: 6px;
            font-size: 14px;
        }

        .config-button {
            background: #007acc;
            border: 1px solid #0e639c;
            color: white;
            padding: 14px;
            border-radius: 4px;
            cursor: pointer;
            text-align: center;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s ease;
            width: 100%;
        }

        .config-button:hover {
            background: #1177bb;
            border-color: #1177bb;
        }

        .terminal-panel {
            background: var(--vscode-sideBar-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 14px;
            min-height: 200px;
        }

        .panel-header {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 12px;
            text-align: center;
        }

        .terminal-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 12px;
        }

        .terminal-item {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 3px;
            padding: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
        }

        .terminal-name {
            color: var(--vscode-editor-foreground);
            font-weight: 500;
        }

        .terminal-status {
            color: var(--vscode-terminal-ansiGreen);
            font-size: 10px;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .terminal-status.stopped {
            color: var(--vscode-terminal-ansiRed);
        }

        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
        }

        .status-indicator.running {
            background-color: var(--vscode-terminal-ansiGreen);
            box-shadow: 0 0 4px var(--vscode-terminal-ansiGreen);
        }

        .status-indicator.stopped {
            background-color: var(--vscode-terminal-ansiRed);
        }

        .terminal-controls {
            display: flex;
            gap: 3px;
        }

        .mini-button {
            background: #007acc;
            border: none;
            color: white;
            padding: 3px 6px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 9px;
            transition: background 0.2s ease;
            min-width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .mini-button:hover {
            background: #1177bb;
        }

        .mini-button.play::before {
            content: '▶';
        }

        .mini-button.stop::before {
            content: '⏹';
        }

        .mini-button.restart::before {
            content: '🔄';
        }

        .mini-button.delete::before {
            content: '🗑';
        }

        .empty-state {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            padding: 20px;
            font-size: 11px;
        }

        .section-buttons {
            display: flex;
            justify-content: center;
            gap: 6px;
            padding-top: 12px;
            border-top: 1px solid var(--vscode-panel-border);
        }

        .section-buttons .mini-button {
            padding: 6px 10px;
            font-size: 10px;
            height: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Control Grid -->
        <div class="control-grid">
            <button class="control-button play-button" onclick="sendCommand('startAll')">
                Start
            </button>
            <button class="control-button stop-button" onclick="sendCommand('stopAll')">
                Stop
            </button>
            <button class="control-button add-button" onclick="sendCommand('addProject')">
                Add
            </button>
            <button class="control-button trash-button" onclick="sendCommand('removeProject')">
                Remove
            </button>
        </div>

        <!-- Auto Config and Restart Row -->
        <div class="control-grid">
            <button class="config-button" onclick="sendCommand('autoConfig')">
                Scan for Projects
            </button>
            <button class="config-button restart-button" onclick="sendCommand('restart')">
                🔄 Restart
            </button>
        </div>

        <!-- Terminal Panel -->
        <div class="terminal-panel">
            <div class="panel-header">
                All terminals with their status
            </div>
            <div class="terminal-list" id="terminalList">
                <div class="empty-state">No projects configured</div>
            </div>
            <div class="section-buttons">
                <button class="mini-button play" onclick="sendCommand('runAll')" title="Run All">Play</button>
                <button class="mini-button stop" onclick="sendCommand('stopAll')" title="Stop All">Stop</button>
                <button class="mini-button restart" onclick="sendCommand('restart')" title="Restart All">Restart</button>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        let terminals = [];

        function sendCommand(command, data = {}) {
            vscode.postMessage({ command, ...data });
        }

        function renderTerminals() {
            const terminalList = document.getElementById('terminalList');
            
            if (terminals.length === 0) {
                terminalList.innerHTML = '<div class="empty-state">No projects configured</div>';
                return;
            }

            terminalList.innerHTML = terminals.map(terminal => \`
                <div class="terminal-item">
                    <div>
                        <div class="terminal-name">\${terminal.name}</div>
                        <div class="terminal-status \${terminal.status}">
                            <span class="status-indicator \${terminal.status}"></span>
                            \${terminal.status.toUpperCase()}\${terminal.port ? \` (:\${terminal.port})\` : ''}
                        </div>
                    </div>
                    <div class="terminal-controls">
                        <button class="mini-button play" onclick="sendCommand('playTerminal', {name: '\${terminal.name}'})" title="Start"></button>
                        <button class="mini-button stop" onclick="sendCommand('stopTerminal', {name: '\${terminal.name}'})" title="Stop"></button>
                        <button class="mini-button restart" onclick="sendCommand('restartTerminal', {name: '\${terminal.name}'})" title="Restart"></button>
                        <button class="mini-button delete" onclick="sendCommand('deleteTerminal', {name: '\${terminal.name}'})" title="Delete"></button>
                    </div>
                </div>
            \`).join('');
        }

        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateTerminals':
                    terminals = message.terminals;
                    renderTerminals();
                    break;
            }
        });
    </script>
</body>
</html>`;
  }
}

/**
 * Start all projects from config
 */
function startProject(provider) {
  const rootPath = getWorkspaceRoot();
  if (!rootPath) return;

  const configPath = path.join(rootPath, ".autorundev.json");
  
  // If config doesn't exist, generate it first
  if (!fs.existsSync(configPath)) {
    const config = scanAllFolders(rootPath);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    vscode.window.showInformationMessage(".autorundev.json created by scanning all folders!");
  }

  const config = readConfigNoAutoCreate(rootPath);

  // Run all projects defined in config
  Object.keys(config).forEach(projectName => {
    if (config[projectName].path && config[projectName].start) {
      runInTerminal(projectName, config[projectName].path, config[projectName].start, rootPath);
    }
  });

  // Update the webview
  setTimeout(() => provider.updateTerminals(), 500);
}

/**
 * Auto detect and regenerate .autorundev.json by scanning all folders
 */
function autoConfig(provider) {
  const rootPath = getWorkspaceRoot();
  if (!rootPath) return;

  const configPath = path.join(rootPath, ".autorundev.json");
  const config = scanAllFolders(rootPath);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  vscode.window.showInformationMessage(".autorundev.json regenerated by scanning all folders!");
  
  provider.updateTerminals();
}

/**
 * Add a custom project manually
 */
async function addCustomProject(provider) {
  const rootPath = getWorkspaceRoot();
  if (!rootPath) return;

  const name = await vscode.window.showInputBox({ prompt: "Enter project name" });
  const folder = await vscode.window.showInputBox({ prompt: "Enter relative folder path (e.g. ./myapp)" });
  const command = await vscode.window.showInputBox({ prompt: "Enter start command (e.g. npm run dev)" });

  if (!name || !folder || !command) {
    vscode.window.showErrorMessage("Invalid input. Project not added.");
    return;
  }

  const configPath = path.join(rootPath, ".autorundev.json");
  let config = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }

  // Add project directly to config object (not in projects array)
  config[name] = { path: folder, start: command };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  vscode.window.showInformationMessage(`Custom project "${name}" added to .autorundev.json`);
  
  provider.updateTerminals();
}

/**
 * Remove a specific project
 */
async function removeProject(provider) {
  const rootPath = getWorkspaceRoot();
  if (!rootPath) return;

  const config = readConfigNoAutoCreate(rootPath);
  const projectNames = Object.keys(config);

  if (projectNames.length === 0) {
    vscode.window.showWarningMessage("No projects found in .autorundev.json");
    return;
  }

  const selectedProject = await vscode.window.showQuickPick(projectNames, {
    placeHolder: "Select project to remove"
  });

  if (!selectedProject) return;

  delete config[selectedProject];

  const configPath = path.join(rootPath, ".autorundev.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  vscode.window.showInformationMessage(`Project "${selectedProject}" removed from .autorundev.json`);
  
  provider.updateTerminals();
}

/**
 * Run all projects defined in .autorundev.json
 */
function runAllProjects(provider) {
  const rootPath = getWorkspaceRoot();
  if (!rootPath) return;

  const config = readConfigNoAutoCreate(rootPath);
  const projectNames = Object.keys(config);

  if (projectNames.length === 0) {
    vscode.window.showWarningMessage("No projects found in .autorundev.json. Click 'Scan for Projects' to detect projects automatically.");
    return;
  }

  projectNames.forEach(projectName => {
    if (config[projectName].path && config[projectName].start) {
      runInTerminal(projectName, config[projectName].path, config[projectName].start, rootPath);
    }
  });

  setTimeout(() => provider.updateTerminals(), 500);
}

/**
 * Stop all running terminals
 */
function stopAllProjects(provider) {
  terminals.forEach(t => t.dispose());
  terminals = [];
  vscode.window.showInformationMessage("All AutoRunDev terminals stopped.");
  
  provider.updateTerminals();
}

/**
 * Restart all projects
 */
function restartAllProjects(provider) {
  stopAllProjects(provider);
  setTimeout(() => {
    runAllProjects(provider);
  }, 1000); // Give a small delay for terminals to close properly
}

// Individual terminal control functions
function playTerminal(name, provider) {
  const rootPath = getWorkspaceRoot();
  if (!rootPath) return;

  const config = readConfigNoAutoCreate(rootPath);
  if (config[name]) {
    runInTerminal(name, config[name].path, config[name].start, rootPath);
    setTimeout(() => provider.updateTerminals(), 500);
  }
}

function stopTerminal(name, provider) {
  const terminalToStop = terminals.find(t => t.name === name);
  if (terminalToStop) {
    terminalToStop.dispose();
    terminals = terminals.filter(t => t.name !== name);
    provider.updateTerminals();
  }
}

function restartTerminal(name, provider) {
  stopTerminal(name, provider);
  setTimeout(() => {
    playTerminal(name, provider);
  }, 1000);
}

function deleteTerminal(name, provider) {
  // Stop the terminal if running
  stopTerminal(name, provider);
  
  // Remove from config
  const rootPath = getWorkspaceRoot();
  if (!rootPath) return;

  const configPath = path.join(rootPath, ".autorundev.json");
  let config = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    delete config[name];
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    vscode.window.showInformationMessage(`Project "${name}" deleted from configuration`);
    provider.updateTerminals();
  }
}

/**
 * --- Helpers ---
 */
function getWorkspaceRoot() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No workspace open!");
    return null;
  }
  return workspaceFolders[0].uri.fsPath;
}

/**
 * Read config without auto-creating it
 */
function readConfigNoAutoCreate(rootPath) {
  const configPath = path.join(rootPath, ".autorundev.json");

  if (!fs.existsSync(configPath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(configPath, "utf-8"));
}

/**
 * Read config - used only by updateTerminals to show current state
 */
function readConfig(rootPath) {
  const configPath = path.join(rootPath, ".autorundev.json");

  if (!fs.existsSync(configPath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(configPath, "utf-8"));
}

/**
 * Scan all folders in root directory and one level deeper to detect projects
 */
function scanAllFolders(rootPath) {
  const config = {};

  // First, check if the workspace root itself is a project
  const rootProjectConfig = detectProjectType(rootPath, '.');
  if (rootProjectConfig) {
    config['workspace-root'] = rootProjectConfig;
  }

  try {
    const items = fs.readdirSync(rootPath);

    items.forEach(item => {
      const itemPath = path.join(rootPath, item);

      // Check if it's a directory and not hidden/system folders
      if (fs.lstatSync(itemPath).isDirectory() &&
        !item.startsWith('.') &&
        item !== 'node_modules' &&
        item !== 'dist' &&
        item !== 'build') {

        // Check if current folder is a project
        const projectConfig = detectProjectType(itemPath, item);
        if (projectConfig) {
          config[item] = projectConfig;
        }

        // Scan one level deeper
        try {
          const subItems = fs.readdirSync(itemPath);
          
          subItems.forEach(subItem => {
            const subItemPath = path.join(itemPath, subItem);

            // Check if subdirectory and not hidden/system folders
            if (fs.lstatSync(subItemPath).isDirectory() &&
              !subItem.startsWith('.') &&
              subItem !== 'node_modules' &&
              subItem !== 'dist' &&
              subItem !== 'build') {

              const subProjectConfig = detectProjectType(subItemPath, `${item}/${subItem}`);
              if (subProjectConfig) {
                // Use a combined name for nested projects
                const nestedName = `${item}/${subItem}`;
                config[nestedName] = subProjectConfig;
              }
            }
          });
        } catch (subError) {
          // Skip if can't read subdirectory
          console.warn(`Error scanning subdirectory ${item}:`, subError.message);
        }
      }
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Error scanning folders: ${error.message}`);
  }

  return config;
}

/**
 * Detect project type and return appropriate config
 */
function detectProjectType(folderPath, folderName) {
  const pkgPath = path.join(folderPath, "package.json");

  // Check for package.json
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

      // Determine start command based on available scripts
      let startCommand = "npm start";
      if (pkg.scripts) {
        if (pkg.scripts.dev) startCommand = "npm run dev";
        else if (pkg.scripts.start) startCommand = "npm start";
        else if (pkg.scripts.serve) startCommand = "npm run serve";
      }

      return {
        path: `./${folderName}`,
        start: startCommand
      };
    } catch (error) {
      console.warn(`Error parsing package.json in ${folderName}:`, error.message);
    }
  }

  // Check for other project types

  // Python projects
  if (fs.existsSync(path.join(folderPath, "requirements.txt")) ||
    fs.existsSync(path.join(folderPath, "pyproject.toml")) ||
    fs.existsSync(path.join(folderPath, "setup.py"))) {
    return {
      path: `./${folderName}`,
      start: "python main.py"
    };
  }

  // Go projects
  if (fs.existsSync(path.join(folderPath, "go.mod"))) {
    return {
      path: `./${folderName}`,
      start: "go run ."
    };
  }

  // Java projects (Maven)
  if (fs.existsSync(path.join(folderPath, "pom.xml"))) {
    return {
      path: `./${folderName}`,
      start: "mvn spring-boot:run"
    };
  }

  // Java projects (Gradle)
  if (fs.existsSync(path.join(folderPath, "build.gradle")) ||
    fs.existsSync(path.join(folderPath, "build.gradle.kts"))) {
    return {
      path: `./${folderName}`,
      start: "./gradlew bootRun"
    };
  }

  // PHP projects
  if (fs.existsSync(path.join(folderPath, "composer.json"))) {
    return {
      path: `./${folderName}`,
      start: "php -S localhost:8000"
    };
  }

  // Rust projects
  if (fs.existsSync(path.join(folderPath, "Cargo.toml"))) {
    return {
      path: `./${folderName}`,
      start: "cargo run"
    };
  }

  // If folder contains common web files, assume it's a web project
  const webFiles = ["index.html", "index.php", "app.js", "server.js"];
  const hasWebFiles = webFiles.some(file => fs.existsSync(path.join(folderPath, file)));

  if (hasWebFiles) {
    return {
      path: `./${folderName}`,
      start: "python -m http.server 8000"
    };
  }

  return null; // No recognizable project structure
}

function runInTerminal(name, dir, command, rootPath) {
  const term = vscode.window.createTerminal(name);
  term.show(true);
  const fullPath = path.join(rootPath, dir);
  term.sendText(`cd "${fullPath}"`);
  term.sendText(command);
  terminals.push(term);
}

function deactivate() {
  stopAllProjects(null);
}

module.exports = { activate, deactivate };