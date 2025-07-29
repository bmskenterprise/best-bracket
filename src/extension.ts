import * as vscode from 'vscode';

let decorationType: vscode.TextEditorDecorationType;

export function activate(context: vscode.ExtensionContext) {
    const activeEditor = vscode.window.activeTextEditor;

    decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(100, 100, 255, 0.3)',
        borderRadius: '3px'
    });

    if (activeEditor) {
        highlightBrackets(activeEditor);
    }

    vscode.window.onDidChangeTextEditorSelection(event => {
        highlightBrackets(event.textEditor);
    });
}

function highlightBrackets(editor: vscode.TextEditor) {
    const doc = editor.document;
    const cursorPos = editor.selection.active;
    const text = doc.getText();
    const offset = doc.offsetAt(cursorPos);

    const brackets = {
        '(': ')',
        '[': ']',
        '{': '}'
    };

    const openBrackets = Object.keys(brackets);
    const closeBrackets = Object.values(brackets);

    let matchPos: vscode.Position | null = null;

    const currentChar = text[offset];
    const prevChar = text[offset - 1];

    if (openBrackets.includes(currentChar)) {
        const bracketChar = currentChar as keyof typeof brackets;
        matchPos = findMatchingBracket(doc, offset, bracketChar, brackets[bracketChar]);
    } else if (closeBrackets.includes(prevChar)) {
        const open = Object.entries(brackets).find(([_, c]) => c === prevChar)?.[0];
        if (open) matchPos = findMatchingBracket(doc, offset - 1, open, prevChar, true);
    }

    if (matchPos) {
        const decorations = [
            { range: new vscode.Range(doc.positionAt(offset), doc.positionAt(offset + 1)) },
            { range: new vscode.Range(matchPos, matchPos.translate(0, 1)) }
        ];
        editor.setDecorations(decorationType, decorations);
    } else {
        editor.setDecorations(decorationType, []);
    }
}

function findMatchingBracket(
    doc: vscode.TextDocument,
    offset: number,
    open: string,
    close: string,
    reverse = false
): vscode.Position | null {
    const text = doc.getText();
    let depth = 0;

    if (reverse) {
        for (let i = offset - 1; i >= 0; i--) {
            if (text[i] === close) depth++;
            else if (text[i] === open) {
                if (depth === 0) return doc.positionAt(i);
                depth--;
            }
        }
    } else {
        for (let i = offset + 1; i < text.length; i++) {
            if (text[i] === open) depth++;
            else if (text[i] === close) {
                if (depth === 0) return doc.positionAt(i);
                depth--;
            }
        }
    }

    return null;
}

export function deactivate() {
    if (decorationType) decorationType.dispose();
}
