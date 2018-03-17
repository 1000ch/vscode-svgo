const { workspace, window, commands, Position, Range } = require('vscode');
const SVGO = require('svgo');

function setText(text) {
  const { document } = window.activeTextEditor;

  return new Promise(resolve => {
    window.activeTextEditor.edit(builder => {
      const lastLine = document.lineAt(document.lineCount - 2);
      const start = new Position(0, 0);
      const end = new Position(document.lineCount - 1, lastLine.text.length);
      builder.replace(new Range(start, end), text);
      resolve();
    });
  });
}

async function svgo(text, { pretty = false, indent = 2 }) {
  const svgo = new SVGO({
    js2svg: {
      pretty,
      indent
    }
  });

  const { data } = await svgo.optimize(text);

  return data;
}

function cannotApply(document) {
  const { languageId, fileName } = document;

  return languageId !== 'xml' || !fileName.includes('.svg');
}

exports.activate = ({ subscriptions }) => {
  const minify = commands.registerCommand('extension.minify', async () => {
    const { document } = window.activeTextEditor;

    if (cannotApply(document)) {
      return;
    }

    const text = await svgo(document.getText(), {
      pretty: false,
      indent: 0
    });

    await setText(text);
  });

  const prettify = commands.registerCommand('extension.prettify', async () => {
    const { document } = window.activeTextEditor;

    if (cannotApply(document)) {
      return;
    }

    const text = await svgo(document.getText(), {
      pretty: true,
      indent: workspace.getConfiguration('svgo').get('indent')
    });

    await setText(text);
  });

  subscriptions.push(minify);
  subscriptions.push(prettify);
};

exports.deactivate = () => {};
