import * as vscode from 'vscode';
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

function isSVG({ languageId, fileName }: vscode.TextDocument): boolean {
  return languageId === 'xml' && fileName.endsWith('.svg');
}

function isYAML({ languageId }: vscode.TextDocument): boolean {
  return languageId === 'yaml';
}

function getPluginConfig(): SVGO.Options {
  const svgoConfig = vscode.workspace.getConfiguration('svgo');
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
  const yaml = vscode.workspace.textDocuments.find(textDocument => {
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

const minifyTextDocument = async (textDocument: vscode.TextDocument) => {
  if (!isSVG(textDocument)) {
    return;
  }

  const config = getConfig({
    js2svg: {
      pretty: false
    }
  });
  const text = await optimize(textDocument.getText(), config);
  const textEditor = await vscode.window.showTextDocument(textDocument);
  await setText(text, textEditor);
};

const prettifyTextDocument = async (textDocument: vscode.TextDocument) => {
  if (!isSVG(textDocument)) {
    return;
  }

  const config = getConfig({
    js2svg: {
      pretty: true
    }
  });
  const text = await optimize(textDocument.getText(), config);
  const textEditor = await vscode.window.showTextDocument(textDocument);
  await setText(text, textEditor);
};

function getFiles(): vscode.TextDocument[] {
  return vscode.workspace.textDocuments.filter(textDocument => {
    return isSVG(textDocument);
  });
}

export function activate(context: vscode.ExtensionContext) {
  const minify = vscode.commands.registerCommand('svgo.minify', async () => {
    const { activeTextEditor } = vscode.window;

    if (!activeTextEditor) {
      return;
    }

    await minifyTextDocument(activeTextEditor.document);
    await vscode.window.showInformationMessage('Minified current SVG file');
  });

  const minifyAll = vscode.commands.registerCommand('svgo.minify-all', async () => {
    await Promise.all(getFiles().map(textDocument => minifyTextDocument(textDocument)));
    await vscode.window.showInformationMessage('Minified all SVG files');
  });

  const prettify = vscode.commands.registerCommand('svgo.prettify', async () => {
    const { activeTextEditor } = vscode.window;

    if (!activeTextEditor) {
      return;
    }

    await prettifyTextDocument(activeTextEditor.document);
    await vscode.window.showInformationMessage('Prettified current SVG file');
  });

  const prettifyAll = vscode.commands.registerCommand('svgo.prettify-all', async () => {
    await Promise.all(getFiles().map(textDocument => minifyTextDocument(textDocument)));
    await vscode.window.showInformationMessage('Prettified all SVG files');
  });

  context.subscriptions.push(minify);
  context.subscriptions.push(minifyAll);
  context.subscriptions.push(prettify);
  context.subscriptions.push(prettifyAll);
};

export function deactivate() {}
