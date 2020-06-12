# vscode-svgo

[![Dependency Status](https://david-dm.org/1000ch/vscode-svgo.svg)](https://david-dm.org/1000ch/vscode-svgo)
[![devDependency Status](https://david-dm.org/1000ch/vscode-svgo/dev-status.svg)](https://david-dm.org/1000ch/vscode-svgo?type=dev)

Fully featured [SVGO](http://github.com/svg/svgo) plugin for [Visual Studio Code](https://github.com/microsoft/vscode).

## Install

Execute `Extensions: Install Extensions` command from [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette) (<kbd>Cmd</kbd> <kbd>Shift</kbd> <kbd>P</kbd>) and search by **svgo**.

## Usage

Open the Command Palette (<kbd>Cmd</kbd> <kbd>Shift</kbd> <kbd>P</kbd>) and search following commands.

- **Minify current SVG file**: to minify current SVG file
- **Minify SVG files in workspace**: to minify all SVG files in workspace
- **Prettify current SVG file**: to prettify current SVG file
- **Prettify SVG files in workspace**: to prettify all SVG files in workspace

You can also execute these commands from context menu of [Explorer](https://code.visualstudio.com/docs/getstarted/userinterface#_explorer) or Editor.

![You can use commands from the context menu of editor view](./screenshot-1.png)

![You can also use commands from the context menu of explorer view](./screenshot-2.png)

## Config

### Extension config

You can enable/disable [plugins](https://github.com/svg/svgo/blob/master/docs/how-it-works/en.md#3-plugins) via [Configure Extension Settings](https://code.visualstudio.com/docs/editor/extension-gallery#_configuring-extensions).

### Project config

[To configure with `.svgo.yml`](https://github.com/svg/svgo/blob/master/docs/how-it-works/en.md#1-config), just put the config file in project root.

## License

[MIT](https://1000ch.mit-license.org) © [Shogo Sensui](https://github.com/1000ch)
