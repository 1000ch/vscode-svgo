const vscode = require('vscode');
const setText = require('vscode-set-text');
const SVGO = require('svgo');

exports.activate = ({ subscriptions }) => {
	const workspaceConfig = workspace.getConfiguration('svgo');

  const minify = vscode.commands.registerCommand('extension.minify', () => {
    const { document } = vscode.window.activeTextEditor;

    if (document.languageId !== 'xml' || !document.fileName.includes('.svg')) {
      return;
    }

    const svgo = new SVGO({
      js2svg: {
        pretty: false
      }
    });

    (async () => {
      const result = await svgo.optimize(document.getText());
      await setText(Buffer.from(result.data));
    })();
  });

  const prettify = vscode.commands.registerCommand('extension.prettify', () => {
    const { document } = vscode.window.activeTextEditor;

    if (document.languageId !== 'xml' || !document.fileName.includes('.svg')) {
      return;
    }

    const svgo = new SVGO({
      js2svg: {
        pretty: true,
        indent: workspaceConfig.get('indent')
      }
    });

    (async () => {
      const result = await svgo.optimize(document.getText());
      await setText(Buffer.from(result.data));
    })();
  });

  subscriptions.push(minify);
  subscriptions.push(prettify);
};

exports.deactivate = () => {};
