import * as vscode from 'vscode';
import { bridgeText } from './services/ollamaService';
import { buildDiplomatPrompt } from './prompts/diplomat';

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
            // Hämta target language från konfiguration
            const config = vscode.workspace.getConfiguration('bridge');
            const targetLanguage = config.get<string>('targetLanguage') || 'English';
            
            // HÄR sker magin: Vi bygger rätt prompt baserat på texten
            const systemPrompt = buildDiplomatPrompt(selectedText, targetLanguage);
            
            const bridgedText = await bridgeText(selectedText, systemPrompt);

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

  context.subscriptions.push(diplomatCommand);
}

export function deactivate() {}

