const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

function activate(context) {
  let disposable = vscode.commands.registerCommand("autodev.start", async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders) {
      vscode.window.showErrorMessage("No workspace open!");
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const configPath = path.join(rootPath, ".autodev.json");

    let config;

    if (!fs.existsSync(configPath)) {
      config = autoDetect(rootPath);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      vscode.window.showInformationMessage(".autodev.json created automatically!");
    } else {
      const data = fs.readFileSync(configPath, "utf-8");
      config = JSON.parse(data);
    }

    runInTerminal("Frontend", config.frontend.path, config.frontend.start, rootPath);
    runInTerminal("Backend", config.backend.path, config.backend.start, rootPath);
  });

  context.subscriptions.push(disposable);
}

function autoDetect(rootPath) {
  const candidates = {
    frontend: ["frontend", "client", "web", "ui"],
    backend: ["backend", "server", "api"]
  };

  function detect(typeList) {
    for (const name of typeList) {
      const fullPath = path.join(rootPath, name);
      if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory()) {
        const pkgPath = path.join(fullPath, "package.json");
        if (fs.existsSync(pkgPath)) {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
          if (pkg.scripts && pkg.scripts.dev) return { path: `./${name}`, start: "npm run dev" };
          if (pkg.scripts && pkg.scripts.start) return { path: `./${name}`, start: "npm start" };
        }
        return { path: `./${name}`, start: "npm start" }; // fallback
      }
    }
    return { path: ".", start: "echo No folder detected" };
  }

  return {
    frontend: detect(candidates.frontend),
    backend: detect(candidates.backend)
  };
}

function runInTerminal(name, dir, command, rootPath) {
  const term = vscode.window.createTerminal(name);
  term.show(true);
  term.sendText(`cd "${path.join(rootPath, dir)}"`);
  term.sendText(command);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
