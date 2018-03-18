import * as vscode from 'vscode';
import SVGO = require('svgo');
const { workspace, window, commands, Position, Range } = vscode;

function setText(text: string) {
  const { activeTextEditor } = window;

  if (!activeTextEditor) {
    return Promise.reject(null);
  }

  const { document } = activeTextEditor;

  return new Promise<void>((resolve, reject) => {
    activeTextEditor.edit((builder: vscode.TextEditorEdit) => {
      const lastLine = document.lineAt(document.lineCount - 2);
      const start = new Position(0, 0);
      const end = new Position(document.lineCount - 1, lastLine.text.length);
      builder.replace(new Range(start, end), text);
      resolve();
    });
  });
}

async function optimize(text: string, { pretty = false, indent = 2 }) {
  const svgo = new SVGO({
    js2svg: {
      pretty,
      indent
    }
  });

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

    const text = await optimize(document.getText(), {
      pretty: false,
      indent: 0
    });

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

    const text = await optimize(document.getText(), {
      pretty: true,
      indent: workspace.getConfiguration('svgo').get('indent') as number
    });

    await setText(text);
  });

  context.subscriptions.push(minify);
  context.subscriptions.push(prettify);
};

export function deactivate() {}
