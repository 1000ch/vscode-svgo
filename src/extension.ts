import {ExtensionContext, TextDocument, commands, window, workspace} from 'vscode';
import setText from 'vscode-set-text';
import merge from 'lodash.merge';
import {OptimizeOptions, DefaultPlugins, Plugin, loadConfig, optimize} from 'svgo';

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

function isSVG({languageId, fileName}: TextDocument): boolean {
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
  const configFile = workspace.textDocuments.find(({fileName}) => fileName === 'svgo.config.js');
  const projectConfig = await loadConfig(configFile?.fileName) ?? {};

  return projectConfig;
}

async function getConfig(config: OptimizeOptions): Promise<OptimizeOptions> {
  const pluginConfig = getPluginConfig();
  const projectConfig = await getProjectConfig();

  return merge(pluginConfig, projectConfig, config);
}

const minifyTextDocument = async (textDocument: TextDocument) => {
  if (!isSVG(textDocument)) {
    return;
  }

  const config = await getConfig({
    js2svg: {
      pretty: false,
    },
  });
  const {data} = optimize(textDocument.getText(), config);
  const textEditor = await window.showTextDocument(textDocument);
  await setText(data, textEditor);
};

const prettifyTextDocument = async (textDocument: TextDocument) => {
  if (!isSVG(textDocument)) {
    return;
  }

  const config = await getConfig({
    js2svg: {
      pretty: true,
    },
  });
  const {data} = optimize(textDocument.getText(), config);
  const textEditor = await window.showTextDocument(textDocument);
  await setText(data, textEditor);
};

function getTextDocuments(): TextDocument[] {
  return workspace.textDocuments.filter(textDocument => isSVG(textDocument));
}

async function minify() {
  if (!window.activeTextEditor) {
    return;
  }

  await minifyTextDocument(window.activeTextEditor.document);
  await window.showInformationMessage('Minified current SVG file');
}

async function minifyAll() {
  await Promise.all(getTextDocuments().map(async textDocument => minifyTextDocument(textDocument)));
  await window.showInformationMessage('Minified all SVG files');
}

async function prettify() {
  if (!window.activeTextEditor) {
    return;
  }

  await prettifyTextDocument(window.activeTextEditor.document);
  await window.showInformationMessage('Prettified current SVG file');
}

async function prettifyAll() {
  await Promise.all(getTextDocuments().map(async textDocument => prettifyTextDocument(textDocument)));
  await window.showInformationMessage('Prettified all SVG files');
}

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('svgo.minify', minify),
    commands.registerCommand('svgo.minify-all', minifyAll),
    commands.registerCommand('svgo.prettify', prettify),
    commands.registerCommand('svgo.prettify-all', prettifyAll),
  );
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
