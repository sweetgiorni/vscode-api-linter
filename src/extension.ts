import * as vscode from 'vscode';
import * as cp from 'child_process';
import Linter from './linter';

const diagnosticCollection = vscode.languages.createDiagnosticCollection("api-linter");

export function activate(context: vscode.ExtensionContext) {
	if (vscode.workspace.getConfiguration("api_linter").get<boolean>("enabled") === false) {
		return;
	}

	// Verify that api-linter can be successfully executed on the host machine by running the version command.
	// In the event the binary cannot be executed, tell the user where to download api-linter from.
	let path = vscode.workspace.getConfiguration("api_linter").get<string>("path");
	if (path === undefined || path === "") {
		path = "api-linter";
	}
	const result = cp.spawnSync(path, ['--version']);
	if (result.status !== 0) {
		vscode.window.showErrorMessage("api-linter was not detected. Download from: https://linter.aip.dev/");
		return;
	}
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-api-linter.lint', runLint);

	vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		vscode.commands.executeCommand('vscode-api-linter.lint');
	});
	// Run the linter when the user changes the file that they are currently viewing
	// so that the lint results show up immediately.
	vscode.window.onDidChangeActiveTextEditor((e: vscode.TextEditor | undefined) => {
		vscode.commands.executeCommand('vscode-api-linter.lint');
	});
	context.subscriptions.push(disposable);
}

function runLint() {
	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}
	// We only want to run protolint on documents that are known to be
	// protocol buffer files.
	const doc = editor.document;
	if (doc.languageId !== 'proto3' && doc.languageId !== 'proto') {
		return;
	}
	doLint(doc, diagnosticCollection);

}

async function doLint(codeDocument: vscode.TextDocument, collection: vscode.DiagnosticCollection): Promise<void> {
	const linter = new Linter(codeDocument);
	const diagnostics: vscode.Diagnostic[] = await linter.lint();
	collection.clear();
	collection.set(codeDocument.uri, diagnostics);
}

// this method is called when your extension is deactivated
export function deactivate() { }
