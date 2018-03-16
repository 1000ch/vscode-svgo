const vscode = require('vscode');
const SVGO = require('svgo');

function setText(text) {
  const { document } = vscode.window.activeTextEditor;

  return new Promise(resolve => {
    vscode.window.activeTextEditor.edit(builder => {
      const lastLine = document.lineAt(document.lineCount - 2);
      const start = new vscode.Position(0, 0);
      const end = new vscode.Position(document.lineCount - 1, lastLine.text.length);
      builder.replace(new vscode.Range(start, end), text);
      resolve();
    });
  });
}

async function applySvgo(text, { pretty = false, indent = 2 }) {
  const svgo = new SVGO({
    js2svg: {
      pretty,
      indent
    }
  });

  const { data } = await svgo.optimize(text);

  return Buffer.from(data);
}

exports.activate = ({ subscriptions }) => {
	const workspaceConfig = vscode.workspace.getConfiguration('svgo');

  const minify = vscode.commands.registerCommand('extension.minify', () => {
    const { document } = vscode.window.activeTextEditor;

    if (document.languageId !== 'xml' || !document.fileName.includes('.svg')) {
      return;
    }

    (async () => {
      const text = await applySvgo(document.getText(), {
        pretty: false,
        indent: 0
      });

      await setText(text);
    })();
  });

  const prettify = vscode.commands.registerCommand('extension.prettify', () => {
    const { document } = vscode.window.activeTextEditor;

    if (document.languageId !== 'xml' || !document.fileName.includes('.svg')) {
      return;
    }

    (async () => {
      const text = await applySvgo(document.getText(), {
        pretty: true,
        indent: workspaceConfig.get('indent')
      });

      await setText(text);
    })();
  });

  subscriptions.push(minify);
  subscriptions.push(prettify);
};

exports.deactivate = () => {};
