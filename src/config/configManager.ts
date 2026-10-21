import { get } from 'request';
import * as vscode from 'vscode';


export function Config<T>(section: string, initialValue: T): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol) => {
      
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(section)) {
                const config = vscode.workspace.getConfiguration();
                const newValue = config.get<T>(section);
                target[propertyKey] = newValue;
            }
          
        });

        return {
             get() {
                const config = vscode.workspace.getConfiguration();
                return config.get<T>(section, initialValue);
             }
        }
      
    };
}

