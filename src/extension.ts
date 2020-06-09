import { ExtensionContext, TextDocument, commands, window, workspace } from 'vscode';
import { safeLoad } from 'js-yaml';
import setText from 'vscode-set-text';
import merge = require('lodash.merge');
import SVGO = require('svgo');

const pluginNames: string[] = [
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
  'reusePaths'
];

function isSVG({ languageId, fileName }: TextDocument): boolean {
  return languageId === 'xml' && fileName.endsWith('.svg');
}

function isYAML({ languageId }: TextDocument): boolean {
  return languageId === 'yaml';
}

function getPluginConfig(): SVGO.Options {
  const svgoConfig = workspace.getConfiguration('svgo');
  const pluginConfig: SVGO.Options = {
    plugins: pluginNames.map(pluginName => {
      return {
        [pluginName]: svgoConfig.get<boolean>(pluginName)
      } as any;
    })
  };

  return pluginConfig;
}

function getProjectConfig(): SVGO.Options {
  const yaml = workspace.textDocuments.find(textDocument => {
    return isYAML(textDocument) && textDocument.fileName === '.svgo.yml';
  });

  if (yaml) {
    return safeLoad(yaml.getText()) as SVGO.Options;
  } else {
    return {};
  }
}

function getConfig(config: SVGO.Options): SVGO.Options {
  const pluginConfig = getPluginConfig();
  const projectConfig = getProjectConfig();

  return merge(pluginConfig, projectConfig, config);
}

async function optimize(text: string, config: SVGO.Options): Promise<string> {
  const svgo = new SVGO(config);
  const { data } = await svgo.optimize(text);

  return data;
}

const minifyTextDocument = async (textDocument: TextDocument) => {
  if (!isSVG(textDocument)) {
    return;
  }

  const config = getConfig({
    js2svg: {
      pretty: false
    }
  });
  const text = await optimize(textDocument.getText(), config);
  const textEditor = await window.showTextDocument(textDocument);
  await setText(text, textEditor);
};

const prettifyTextDocument = async (textDocument: TextDocument) => {
  if (!isSVG(textDocument)) {
    return;
  }

  const config = getConfig({
    js2svg: {
      pretty: true
    }
  });
  const text = await optimize(textDocument.getText(), config);
  const textEditor = await window.showTextDocument(textDocument);
  await setText(text, textEditor);
};

function getTextDocuments(): TextDocument[] {
  return workspace.textDocuments.filter(textDocument => {
    return isSVG(textDocument);
  });
}

async function minify() {
  if (!window.activeTextEditor) {
    return;
  }

  await minifyTextDocument(window.activeTextEditor.document);
  await window.showInformationMessage('Minified current SVG file');
}

async function minifyAll() {
  await Promise.all(getTextDocuments().map(textDocument => minifyTextDocument(textDocument)));
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
  await Promise.all(getTextDocuments().map(textDocument => minifyTextDocument(textDocument)));
  await window.showInformationMessage('Prettified all SVG files');
}

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('svgo.minify', minify),
    commands.registerCommand('svgo.minify-all', minifyAll),
    commands.registerCommand('svgo.prettify', prettify),
    commands.registerCommand('svgo.prettify-all', prettifyAll)
  );
};

export function deactivate() {}
