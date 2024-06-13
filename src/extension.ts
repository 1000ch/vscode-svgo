import {
  Uri,
  FileType,
  commands,
  window,
  workspace,
  type ExtensionContext,
  type TextDocument,
  type TextEditor,
} from 'vscode';
import setText from 'vscode-set-text';
import merge from 'lodash.merge';
import {
  loadConfig,
  optimize,
  builtinPlugins,
  type Config,
  type Output,
  type PluginConfig,
} from 'svgo';

/** Name of all plugins that are enabled/invoked by default. */
const defaultPlugins = new Set(
  builtinPlugins
    .find(p => p.name === 'preset-default')
    .plugins
    .map(p => p.name),
);

/** Name of all builtin plugins, excluding presets. */
const builtin = builtinPlugins
  .filter(p => !p.isPreset)
  .map(p => p.name);

function isSvg({languageId, fileName}: TextDocument): boolean {
  return languageId === 'xml' && fileName.endsWith('.svg');
}

function getPluginConfig(): Config {
  const svgoConfig = workspace.getConfiguration('svgo');

  // Use 'preset-default' plugin to override defaults
  // https://github.com/svg/svgo#configuration
  const defaultPlugin: PluginConfig = {
    name: 'preset-default',
    params: {
      overrides: {},
    },
  };
  const otherPlugins: PluginConfig[] = [];

  for (const plugin of builtin) {
    // If plugin is configured by workspace config
    if (!svgoConfig.has(plugin)) {
      continue;
    }

    if (defaultPlugins.has(plugin)) {
      defaultPlugin.params.overrides[plugin] = svgoConfig.get<boolean>(plugin);
    } else if (svgoConfig.get<boolean>(plugin)) {
      otherPlugins.push(plugin as PluginConfig);
    }
  }

  const plugins: PluginConfig[] = [defaultPlugin, ...otherPlugins];
  const pluginConfig: Config = {plugins};

  return pluginConfig;
}

async function getProjectConfig(): Promise<Config> {
  const workspaceFolder = workspace.workspaceFolders[0];
  if (!workspaceFolder?.uri) {
    return {};
  }

  try {
    const configFile = Uri.parse(`${workspaceFolder?.uri.fsPath}/svgo.config.js`);
    const stats = await workspace.fs.stat(configFile);
    if (stats.type !== FileType.File) {
      return {};
    }

    const projectConfig = await loadConfig(configFile.fsPath);
    return projectConfig;
  } catch (error: unknown) {
    console.error(error);
  }

  return {};
}

async function getConfig(config: Config): Promise<Config> {
  const pluginConfig = getPluginConfig();
  const projectConfig = await getProjectConfig();

  return merge(pluginConfig, projectConfig, config);
}

async function processTextEditor(textEditor: TextEditor, config?: Config) {
  if (!isSvg(textEditor.document)) {
    return;
  }

  const mergedConfig = await getConfig(config);
  const text = textEditor.document.getText();
  const {data}: Output = optimize(text, mergedConfig);
  await setText(data, textEditor);
}

async function minify() {
  if (!window.activeTextEditor) {
    return;
  }

  const config: Config = {
    js2svg: {
      pretty: false,
    },
  };

  try {
    await processTextEditor(window.activeTextEditor, config);
    await window.showInformationMessage('Minified current SVG file');
  } catch (error: unknown) {
    console.error(error);

    if (error instanceof Error) {
      await window.showErrorMessage(error.message);
    }
  }
}

async function format() {
  if (!window.activeTextEditor) {
    return;
  }

  const config: Config = {
    js2svg: {
      pretty: true,
    },
  };

  try {
    await processTextEditor(window.activeTextEditor, config);
    await window.showInformationMessage('Prettified current SVG file');
  } catch (error: unknown) {
    console.error(error);

    if (error instanceof Error) {
      await window.showErrorMessage(error.message);
    }
  }
}

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('svgo.minify', minify),
    commands.registerCommand('svgo.format', format),
  );
}

export function deactivate() {}
