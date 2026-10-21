
import { Config } from "./configManager";
import * as vscode from 'vscode';

export const extensionConfig = {
     service: {
        command: 'translator.service',
        value: 'microsoft',
     },
}

export class ExtensionConfigManager  {
  
    @Config<string>(extensionConfig.service.command, extensionConfig.service.value)     
    service: string;
   

}

