import * as vscode from 'vscode';

export class ChatManager {
    private messages: Array<vscode.LanguageModelChatMessage> = [];
    
    setSystemPrompt(systemPrompt: string) {
        this.messages = [vscode.LanguageModelChatMessage.User(systemPrompt)];
    }
    
    addMessage(message: string) {
        this.messages[1] = vscode.LanguageModelChatMessage.User(message);  
    }
    
    getMessages(): Array<vscode.LanguageModelChatMessage> {
        return this.messages;
    }
}