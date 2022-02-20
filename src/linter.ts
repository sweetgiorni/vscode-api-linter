import * as cp from 'child_process';
import * as vscode from 'vscode';
import * as util from 'util';
import { APILinterErrors, Problem, Location, Position, Convert } from './protoError';
import { debug } from 'console';

export interface LinterError {
    proto: APILinterErrors;
    range: vscode.Range;
}

export default class Linter {
    private codeDocument: vscode.TextDocument;

    constructor(document: vscode.TextDocument) {
        this.codeDocument = document;
    }

    public async lint(): Promise<vscode.Diagnostic[]> {
     const resultJson = await this.runProtoLint();
        if (!resultJson) {
            return [];
        }
        
        const result = Convert.toAPILinterErrors(resultJson);
        for (const file of result) {
            if (this.codeDocument.uri.fsPath.endsWith(file.filePath)) {
                return file.problems.map(this.problemToDiagnostic);
            }
        }
        return [];
    }

    private problemToDiagnostic(problem: Problem): vscode.Diagnostic {
        const range = new vscode.Range(
            new vscode.Position(problem.location.startPosition.lineNumber, problem.location.startPosition.columnNumber),
            new vscode.Position(problem.location.endPosition.lineNumber, problem.location.endPosition.columnNumber)
        );
        const diagnostic = new vscode.Diagnostic(range, problem.message, vscode.DiagnosticSeverity.Warning);
        diagnostic.code = { value: problem.ruleID, target: vscode.Uri.parse(problem.ruleDocURI) };
        return diagnostic;
    }

    private async runProtoLint(): Promise<string> {
        if (!vscode.workspace.workspaceFolders) {
            return "";
        }

        let workspaceFolder: vscode.WorkspaceFolder = vscode.workspace.getWorkspaceFolder(this.codeDocument.uri) || vscode.workspace.workspaceFolders[0];
        // Verify that api-linter can be successfully executed on the host machine by running the version command.
        // In the event the binary cannot be executed, tell the user where to download api-linter from.
        let linterPath = vscode.workspace.getConfiguration("api_linter").get<string>("path");
        if (linterPath === undefined || linterPath === "") {
            linterPath = "api-linter";
        }
        
        let args = vscode.workspace.getConfiguration("api_linter").get<string | string[]>("args");
        let argString = "";
        if (args instanceof Array) {
            argString = args.map(arg => `'${arg}'`).join(" ");
        }
        else if (args === undefined) {
            args = [];
        }
        else {
            argString = args;
        }


       const cmd = `${linterPath} ${argString} --output-format json "${this.codeDocument.uri.fsPath}"`;

        let lintResults: string = "";

        // Execute the api-linter binary and store the output from standard error.
        // The output could either be an error from using the binary improperly, such as unable to find
        // a configuration, or linting errors.
        const exec = util.promisify(cp.exec);
        const {stdout, stderr } = await exec(cmd);
        return stdout;


        return lintResults;
    }
}
