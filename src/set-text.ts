import {
  Position,
  Range,
  type TextEditor,
} from 'vscode';

export default function setText(text: string, editor: TextEditor): Thenable<void> {
  return new Promise<void>(resolve => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    editor.edit(builder => {
      const {document} = editor;
      const lastLine = document.lineAt(document.lineCount - 1);

      const start = new Position(0, 0);
      const end = new Position(document.lineCount - 1, lastLine.text.length);

      builder.replace(new Range(start, end), text);

      resolve();
    });
  });
}
