import {Uri, FileType, commands, window, workspace} from 'vscode';
import type {ExtensionContext, TextDocument, TextEditor} from 'vscode';
import setText from 'vscode-set-text';
import merge from 'lodash.merge';
import {loadConfig, optimize} from 'svgo';
import type {OptimizeOptions, DefaultPlugins, Plugin} from 'svgo';

const defaultPlugins: Array<DefaultPlugins['name']> = [
  'removeDoctype',
  'removeXMLProcInst',
  'removeComments',
  'removeMetadata',
  'removeXMLNS',
  'removeEditorsNSData',
  'cleanupAttrs',
  'inlineStyles',
  'minifyStyles',
  'convertStyleToAttrs',
  'cleanupIDs',
  'prefixIds',
  'removeRasterImages',
  'removeUselessDefs',
  'cleanupNumericValues',
  'cleanupListOfValues',
  'convertColors',
  'removeUnknownsAndDefaults',
  'removeNonInheritableGroupAttrs',
  'removeUselessStrokeAndFill',
  'removeViewBox',
  'cleanupEnableBackground',
  'removeHiddenElems',
  'removeEmptyText',
  'convertShapeToPath',
  'moveElemsAttrsToGroup',
  'moveGroupAttrsToElems',
  'collapseGroups',
  'convertPathData',
  'convertTransform',
  'removeEmptyAttrs',
  'removeEmptyContainers',
  'mergePaths',
  'removeUnusedNS',
  'sortAttrs',
  'removeTitle',
  'removeDesc',
  'removeDimensions',
  'removeAttrs',
  'removeAttributesBySelector',
  'removeElementsByAttr',
  'addClassesToSVGElement',
  'removeStyleElement',
  'removeScriptElement',
  'addAttributesToSVGElement',
  'removeOffCanvasPaths',
  'reusePaths',
];

function isSvg({languageId, fileName}: TextDocument): boolean {
  return languageId === 'xml' && fileName.endsWith('.svg');
}

function getPluginConfig(): OptimizeOptions {
  const svgoConfig = workspace.getConfiguration('svgo');

  // Use 'preset-default' plugin to override defaults
  // https://github.com/svg/svgo#configuration
  const defaultPlugin: Plugin = {
    name: 'preset-default',
    params: {
      overrides: {},
    },
  };

  for (const plugin of defaultPlugins) {
    // If plugin is configured by workspace config
    if (!svgoConfig.has(plugin)) {
      continue;
    }

    defaultPlugin.params.overrides[plugin] = svgoConfig.get<boolean>(plugin);
  }

  const plugins: Plugin[] = [defaultPlugin];
  const pluginConfig: OptimizeOptions = {plugins};

  return pluginConfig;
}

async function getProjectConfig(): Promise<OptimizeOptions> {
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

async function getConfig(config: OptimizeOptions): Promise<OptimizeOptions> {
  const pluginConfig = getPluginConfig();
  const projectConfig = await getProjectConfig();

  return merge(pluginConfig, projectConfig, config);
}

async function processTextEditor(textEditor: TextEditor, config?: OptimizeOptions) {
  if (!isSvg(textEditor.document)) {
    return;
  }

  const mergedConfig = await getConfig(config);
  const text = textEditor.document.getText();
  const {data} = optimize(text, mergedConfig);
  await setText(data, textEditor);
}

async function minify() {
  if (!window.activeTextEditor) {
    return;
  }

  const config: OptimizeOptions = {
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

  const config: OptimizeOptions = {
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

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
