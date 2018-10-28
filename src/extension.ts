import * as vscode from 'vscode';
import setText from 'vscode-set-text';
import merge = require('lodash.merge');
import SVGO = require('svgo');
const { workspace, window, commands } = vscode;

function getConfig(config: SVGO.Options): SVGO.Options {
  const svgoConfig = workspace.getConfiguration('svgo');
  const js2svg = {
    indent: svgoConfig.get('indent') as number,
    pretty: svgoConfig.get('pretty') as boolean,
    useShortTags: svgoConfig.get('useShortTags') as boolean
  };
  const plugins = [{ removeTitle: false }];

  return merge(config, {
    js2svg,
    plugins
  });
}

async function optimize(text: string, config: SVGO.Options) {
  const svgo = new SVGO(config);
  const { data } = await svgo.optimize(text);

  return data;
}

function canApply(document: vscode.TextDocument) {
  const { languageId, fileName } = document;

  return languageId === 'xml' && fileName.includes('.svg');
}

export function activate(context: vscode.ExtensionContext) {
  const minify = commands.registerCommand('svgo.minify', async () => {
    if (!window.activeTextEditor) {
      return;
    }

    const { document } = window.activeTextEditor;

    if (!canApply(document)) {
      return;
    }

    const config = getConfig({
      js2svg: {
        pretty: false
      }
    });
    const text = await optimize(document.getText(), config);

    await setText(text);
  });

  const prettify = commands.registerCommand('svgo.prettify', async () => {
    if (!window.activeTextEditor) {
      return;
    }

    const { document } = window.activeTextEditor;

    if (!canApply(document)) {
      return;
    }

    const config = getConfig({
      js2svg: {
        pretty: true
      }
    });
    const text = await optimize(document.getText(), config);

    await setText(text);
  });

  context.subscriptions.push(minify);
  context.subscriptions.push(prettify);
};

export function deactivate() {}
