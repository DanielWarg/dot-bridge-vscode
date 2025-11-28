import * as vscode from 'vscode';
import { bridgeText } from './services/ollamaService';
import { DIPLOMAT_SYSTEM_PROMPT } from './prompts/diplomat';
import { TECHSPEC_SYSTEM_PROMPT } from './prompts/techspec';
import { BUG_REPORT_SYSTEM_PROMPT } from './prompts/bugReport';

export function activate(context: vscode.ExtensionContext) {
  const diplomatCommand = vscode.commands.registerCommand(
    'bridge.diplomat',
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage('Ingen aktiv editor öppen.');
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText) {
        vscode.window.showErrorMessage(
          'Ingen text är markerad. Markera texten du vill omformulera.'
        );
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Bridging thoughts... 🧠',
          cancellable: false,
        },
        async (progress) => {
          try {
            const bridgedText = await bridgeText(
              selectedText,
              DIPLOMAT_SYSTEM_PROMPT
            );

            // Öppna nytt fönster bredvid med preview
            const doc = await vscode.workspace.openTextDocument({
              content: bridgedText,
              language: 'markdown', // Ger snyggare formatting
            });

            await vscode.window.showTextDocument(doc, {
              viewColumn: vscode.ViewColumn.Beside, // Öppnar till höger om nuvarande fönster
              preview: true, // Betyder att fliken är temporär (kursiv stil) tills man ändrar i den
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Ett okänt fel uppstod.';
            vscode.window.showErrorMessage(errorMessage);
          }
        }
      );
    }
  );

  const techspecCommand = vscode.commands.registerCommand(
    'bridge.techspec',
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage('Ingen aktiv editor öppen.');
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText) {
        vscode.window.showErrorMessage(
          'Ingen text är markerad. Markera texten du vill generera tech spec från.'
        );
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Generating tech spec... 📋',
          cancellable: false,
        },
        async (progress) => {
          try {
            const techSpec = await bridgeText(
              selectedText,
              TECHSPEC_SYSTEM_PROMPT
            );

            // Öppna nytt fönster bredvid med preview
            const doc = await vscode.workspace.openTextDocument({
              content: techSpec,
              language: 'markdown', // Ger snyggare formatting
            });

            await vscode.window.showTextDocument(doc, {
              viewColumn: vscode.ViewColumn.Beside, // Öppnar till höger om nuvarande fönster
              preview: true, // Betyder att fliken är temporär (kursiv stil) tills man ändrar i den
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Ett okänt fel uppstod.';
            vscode.window.showErrorMessage(errorMessage);
          }
        }
      );
    }
  );

  const bugreportCommand = vscode.commands.registerCommand(
    'bridge.bugreport',
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage('Ingen aktiv editor öppen.');
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText) {
        vscode.window.showErrorMessage(
          'Ingen text är markerad. Markera texten du vill strukturera som bug report.'
        );
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Creating bug report... 🐞',
          cancellable: false,
        },
        async (progress) => {
          try {
            const bugReport = await bridgeText(
              selectedText,
              BUG_REPORT_SYSTEM_PROMPT
            );

            // Öppna nytt fönster bredvid med preview
            const doc = await vscode.workspace.openTextDocument({
              content: bugReport,
              language: 'markdown', // Ger snyggare formatting
            });

            await vscode.window.showTextDocument(doc, {
              viewColumn: vscode.ViewColumn.Beside, // Öppnar till höger om nuvarande fönster
              preview: true, // Betyder att fliken är temporär (kursiv stil) tills man ändrar i den
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Ett okänt fel uppstod.';
            vscode.window.showErrorMessage(errorMessage);
          }
        }
      );
    }
  );

  context.subscriptions.push(diplomatCommand);
  context.subscriptions.push(techspecCommand);
  context.subscriptions.push(bugreportCommand);
}

export function deactivate() {}

