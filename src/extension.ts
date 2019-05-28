import * as vscode from 'vscode';
import setText from 'vscode-set-text';
import merge = require('lodash.merge');
import SVGO = require('svgo');
import SVGOConfig = require('svgo/lib/svgo/config');

declare function SVGOConfig(config: {
  full?: boolean;
  datauri?: 'base64' | 'enc' | 'unenc';
  svg2js?: object;
  js2svg?: object;
  plugins?: object[] | string[];
}): SVGO.Options;

const plugins: string[] = [
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

function getPluginConfig(): object[] {
  const svgoConfig = vscode.workspace.getConfiguration('svgo');

  return plugins.map(plugin => {
    return {
      [plugin]: svgoConfig.get<boolean>(plugin)
    };
  });
}

function getConfig(config: SVGO.Options): SVGO.Options {
  const { plugins } = SVGOConfig({
    plugins: getPluginConfig()
  });

  return merge({
    plugins
  }, config);
}

async function optimize(text: string, config: SVGO.Options): Promise<string> {
  const svgo = new SVGO(config);
  const { data } = await svgo.optimize(text);

  return data;
}

const minifyText = async (text: string) => await optimize(text, getConfig({
  js2svg: {
    pretty: false
  }
}));

const prettifyText = async (text: string) => await optimize(text, getConfig({
  js2svg: {
    pretty: true
  }
}));

function isSVG(document: vscode.TextDocument): boolean {
  const { languageId, fileName } = document;

  return languageId === 'xml' && fileName.endsWith('.svg');
}

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

    if (!isSVG(activeTextEditor.document)) {
      return;
    }

    const text = await minifyText(activeTextEditor.document.getText());

    await setText(text, activeTextEditor);
  });

  const minifyAll = vscode.commands.registerCommand('svgo.minify-all', async () => {
    getFiles().forEach(async textDocument => {
      const textEditor = await vscode.window.showTextDocument(textDocument);
      const text = await minifyText(textDocument.getText());
      await setText(text, textEditor);
    });
  });

  const prettify = vscode.commands.registerCommand('svgo.prettify', async () => {
    const { activeTextEditor } = vscode.window;

    if (!activeTextEditor) {
      return;
    }

    if (!isSVG(activeTextEditor.document)) {
      return;
    }

    const text = await prettifyText(activeTextEditor.document.getText());

    await setText(text, activeTextEditor);
  });

  const prettifyAll = vscode.commands.registerCommand('svgo.prettify-all', async () => {
    getFiles().forEach(async textDocument => {
      const textEditor = await vscode.window.showTextDocument(textDocument);
      const text = await prettifyText(textDocument.getText());
      await setText(text, textEditor);
    });
  });

  context.subscriptions.push(minify);
  context.subscriptions.push(minifyAll);
  context.subscriptions.push(prettify);
  context.subscriptions.push(prettifyAll);
};

export function deactivate() {}
