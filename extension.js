// The module 'vscode' contains the VS Code extensibility API

// import { write } from 'fs';

// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context)
{

	async function writeToFile(uri, content)
	{
		try
		{
			const document = await vscode.workspace.openTextDocument(uri);
			const editor = await vscode.window.showTextDocument(document);
			// await vscode.workspace.fs.writeFile(uri, encoder.encode(content));
			const lastLine = document.lineAt(document.lineCount - 2);
			const position = new vscode.Position(lastLine.lineNumber, lastLine.text.length);
			editor.edit(editBuilder => editBuilder.insert(position, content));
			console.log('File written successfully');
		} catch (err)
		{
			console.log(`Error writing file: ${err}`);
		}
	}

	function GenerateFunction(name)
	{
		return "\n--- ### function doc\nfunction " + name + "(view)\n\nend\n";
	}

	const ProcessorName = ["ProcessorBase", "ProcessorFree", "ProcessorBonus"];

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "donkeyutility" is now active!');
	const addDefinition = vscode.commands.registerCommand('donkeyutility.createProcessorDefinition', async function ()
	{
		console.log('尝试在选中区域添加定义');
		const editor = vscode.window.activeTextEditor;
		if (!editor)
		{
			vscode.window.showInformationMessage('Editor not found');
			return;
		}
		const selection = editor.selection;
		// get current file path
		const document = editor.document;
		const position = editor.selection.active; // Position of the cursor

		const range = editor.document.getWordRangeAtPosition(position);
		const word = editor.document.getText(range);
		const results = word.split(".")
		if (results[0] in ProcessorName)
		{
			const outputPath = path.dirname(document.uri.fsPath) + "/" + results[0] + ".lua";
			const toSearchDocument = await vscode.workspace.openTextDocument(vscode.Uri.file(outputPath));
			const toSearchText = toSearchDocument.getText();
			if (toSearchText.includes(word))
			{
				vscode.window.showInformationMessage('这里已经定义过了.');
				return;
			} else
			{
				const outputText = GenerateFunction(word);
				await writeToFile(vscode.Uri.file(outputPath), outputText);
				vscode.window.showInformationMessage("Good~~~~");
			}
		} else
		{
			vscode.window.showInformationMessage('只支持Processor.');
		}
	});
	const createAllDefinition = vscode.commands.registerCommand('donkeyutility.createAllProcessorDefinition', async function ()
	{
		const editor = vscode.window.activeTextEditor;
		if (!editor)
		{
			vscode.window.showInformationMessage('Editor not found');
			return;
		}
		const document = editor.document;
		const dir = path.dirname(document.uri.fsPath)
		const text = document.getText();

		// Find the position of the field name in the text
		const index = text.indexOf('self.behaviorTrees');
		if (index === -1)
		{
			vscode.window.showInformationMessage('没找到行为树...');
			return;
		}

		// Get all symbols in the document
		const symbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri);
		const viewSymbol = symbols.find(symbol => symbol.name === 'local View');
		if (!viewSymbol)
		{
			vscode.window.showInformationMessage('没找到View啊...');
			return;
		}
		const tree = viewSymbol.children.find(symbol => symbol.name === 'View:RegisterBehaviorTree')
		if (!tree)
		{
			vscode.window.showInformationMessage('没找到行为树...');
			return;
		}
		vscode.window.showInformationMessage('找到行为树了, Hooray!');
		const toSearchRange = tree.range;
		// Get the text in the given range
		// const textInRange = document.getText(toSearchRange);
		// const textInRange = document.getText();
		const regexToFind = [/ProcessorBase\.\w+/g, /ProcessorFree\.\w+/g, /ProcessorBonus\.\w+/g];
		const encoder = new TextEncoder();



		for (let index = 0; index < 3; index++)
		{
			// const regexBase = /ProcessorBase\.\w+/g;
			const regex = regexToFind[index];
			let match;
			let result = [];
			let outputPath = dir + "/" + ProcessorName[index] + ".lua";
			let outputText = "";
			const toSearchDocument = await vscode.workspace.openTextDocument(vscode.Uri.file(outputPath));
			const toSearchText = toSearchDocument.getText();
			while ((match = regex.exec(text)) !== null)
			{
				const matchedText = match[0];
				const position = document.positionAt(match.index + 15);
				if (!toSearchRange.contains(position))
				{
					continue;
				}
				result.push({ matchedText, position });
				// Do something with the matched text and its position
				console.log(`Found "${matchedText}" at position (${position.line}, ${position.character})`);
			}
			for (let i = 0; i < result.length; i++)
			{
				// const definition = await vscode.commands.executeCommand('vscode.executeDefinitionProvider', document.uri, result[i].position);
				// let search =  /ProcessorBase\.\w+/g;
				let search = RegExp(result[i].matchedText);
				if (toSearchText.includes(result[i].matchedText))
				{
					console.log(result[i].matchedText + "已经定义过了.");
				} else
				{
					console.log(result[i].matchedText + "要生成～～～");
					outputText += GenerateFunction(result[i].matchedText);
				}
			}
			if (outputText != "")
			{
				await writeToFile(vscode.Uri.file(outputPath), outputText);
			}
		}
	});
	context.subscriptions.push(addDefinition);
	context.subscriptions.push(createAllDefinition);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
