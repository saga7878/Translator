export class CommentExtractor {


    /**
     * 从文本中提取注释内容，保持原始换行结构
     * @param text 输入文本
     * @returns 注释内容数组
     */
    static clean(text: string): string {
        
        if (!text || typeof text !== 'string') {
            return text;
        }

        // 检查是否是注释文本
        const trimmed = text.trim().replace(/^\t+|\t+$/g, '').replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        
        // 处理多行注释
        if (trimmed.startsWith('/*') || trimmed.startsWith('/**')) {
            return trimmed
                .replace(/^\s*\/\*+/g, '')    // 删除开头的 /* 或 /**
                .replace(/\*\/\s*$/g, '')       // 删除结尾的 */
                .replace(/^\s*\*\s?/gm, '') // 删除每行开头的 * 和空格
                .trim().replace(/\n/g, " ");
        }

        // 处理HTML多行注释
        if (trimmed.startsWith('<!--')) {
            return trimmed
            .replace(/^\s*<!--+/g, '')    // 删除行首的 <!-- 或 <!---
             .replace(/--+>\s*/g, '').replace(/\n/g, " ")    // 删除行尾的 --> 或 --->
                 
        }

        // 处理Python多行注释
        if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
            console.log('python', trimmed);
            return trimmed
                .replace(/^(?:'''|""")/, '') // 删除开头的 ''' 或 """
                .replace(/(?:'''|""")$/, '') // 删除结尾的 ''' 或 """
                .trim().replace(/\n/g, " ");
        }

        // 处理单行注释
        if (trimmed.startsWith('//') || 
            trimmed.startsWith('#') || 
            trimmed.startsWith('--') || 
            trimmed.startsWith(';')) {
            return trimmed
                .replace(/^[\/\/#;\-]+\s*/, '')
                .trim().replace(/\n/g, " ");
        }

        // 不是注释文本，返回原文
        return text;
    
    }

   
}