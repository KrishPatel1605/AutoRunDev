# AutoRunDev - Multi-Project Development Manager

[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-blue.svg)](https://marketplace.visualstudio.com/items?itemName=KrishPatel.autorundev)
[![GitHub](https://img.shields.io/github/license/KrishPatel1605/AutoRunDev)](https://github.com/KrishPatel1605/AutoRunDev)

AutoRunDev is a powerful VS Code extension that simplifies multi-project development by automatically detecting, configuring, and running multiple projects within your workspace. Whether you're working on a monorepo, microservices, or just multiple related projects, AutoRunDev streamlines your development workflow.

## 🚀 Features

- **🔍 Automatic Project Detection**: Scans your workspace and automatically detects different project types
- **🎯 Smart Configuration**: Generates `.autorundev.json` configuration based on detected projects
- **▶️ Bulk Project Management**: Start, stop, and restart all projects with a single click
- **🛠️ Multi-Language Support**: Supports Node.js, Python, Go, Java, PHP, Rust, and static web projects
- **📋 Easy Sidebar Management**: Convenient tree view in VS Code sidebar for quick access
- **⚙️ Custom Project Support**: Add custom projects with specific commands
- **🔄 Live Terminal Management**: Manages separate terminals for each project

## 📦 Supported Project Types

AutoRunDev automatically detects and configures the following project types:

| Technology | Detection Files | Default Command |
|------------|----------------|-----------------|
| **Node.js** | `package.json` | `npm run dev` / `npm start` |
| **Python** | `requirements.txt`, `pyproject.toml`, `setup.py` | `python main.py` |
| **Go** | `go.mod` | `go run .` |
| **Java (Maven)** | `pom.xml` | `mvn spring-boot:run` |
| **Java (Gradle)** | `build.gradle`, `build.gradle.kts` | `./gradlew bootRun` |
| **PHP** | `composer.json` | `php -S localhost:8000` |
| **Rust** | `Cargo.toml` | `cargo run` |
| **Static Web** | `index.html`, `index.php`, `app.js`, `server.js` | `python -m http.server 8000` |

## 🛠️ Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "AutoRunDev"
4. Click Install

### Manual Installation
1. Clone this repository: `git clone https://github.com/KrishPatel1605/AutoRunDev.git`
2. Open the project in VS Code
3. Press F5 to run the extension in a new Extension Development Host window

## 🎯 Quick Start

1. **Open Your Workspace**: Open a folder containing multiple projects in VS Code
2. **Access AutoRunDev**: Look for the AutoRunDev panel in the VS Code sidebar
3. **Auto Configure**: Click "Scan & Configure Projects" to automatically detect all projects
4. **Start Projects**: Click "Start All Projects" to run all detected projects

## 📋 Usage

### Sidebar Commands

The AutoRunDev sidebar provides these convenient commands:

- **🚀 Start All Projects**: Starts all configured projects in separate terminals
- **🔍 Scan & Configure Projects**: Scans workspace and regenerates `.autorundev.json`
- **➕ Add Custom Project**: Manually add a project with custom configuration
- **🗑️ Remove Project**: Remove a specific project from configuration
- **▶️ Run All Projects**: Same as "Start All Projects"
- **⏹️ Stop All Projects**: Stops all running project terminals
- **🔄 Restart All Projects**: Stops and restarts all projects

### Configuration File

AutoRunDev uses a `.autorundev.json` file in your workspace root to store project configurations:

```json
{
  "frontend": {
    "path": "./frontend",
    "start": "npm run dev"
  },
  "backend": {
    "path": "./backend",
    "start": "npm start"
  },
  "api": {
    "path": "./api",
    "start": "python main.py"
  }
}
```

### Manual Configuration

You can manually edit `.autorundev.json` or use the "Add Custom Project" command to add projects with specific requirements:

- **Project Name**: Unique identifier for your project
- **Path**: Relative path from workspace root (e.g., `./my-app`)
- **Start Command**: Command to run the project (e.g., `npm run dev`)

## 🔧 Advanced Usage

### Custom Start Commands

For Node.js projects, AutoRunDev intelligently selects start commands based on available scripts:
- Prioritizes `npm run dev` if available
- Falls back to `npm start`
- Uses `npm run serve` as alternative

### Folder Exclusions

AutoRunDev automatically excludes common non-project folders:
- Hidden folders (starting with `.`)
- `node_modules`
- `dist`
- `build`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Clone the repository
2. Run `npm install` to install dependencies
3. Press F5 to start debugging
4. Make your changes and test in the Extension Development Host

### Reporting Issues

If you encounter any issues or have feature requests, please [open an issue](https://github.com/KrishPatel1605/AutoRunDev/issues) on GitHub.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the VS Code community
- Inspired by the need for efficient multi-project development workflows

## 📈 Roadmap

- [ ] Project health monitoring
- [ ] Environment variable management
- [ ] Docker support
- [ ] Custom terminal themes
- [ ] Project dependency visualization
- [ ] Hot reload configuration changes

---

**Happy Coding!** 🎉

Made with ❤️ by [Krish Patel](https://github.com/KrishPatel1605)