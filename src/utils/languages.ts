export interface LanguageInfo {
    name: string;
    nativeName: string;
    code: string;
}

export const languages: { [key: string]: LanguageInfo } = {
    'af': { code: 'af', name: '南非荷兰语', nativeName: 'Afrikaans' },
    'ar': { code: 'ar', name: '阿拉伯语', nativeName: 'العربية' },
    'bg': { code: 'bg', name: '保加利亚语', nativeName: 'Български' },
    'bn': { code: 'bn', name: '孟加拉语', nativeName: 'বাংলা' },
    'bs': { code: 'bs', name: '波斯尼亚语', nativeName: 'Bosanski' },
    'ca': { code: 'ca', name: '加泰罗尼亚语', nativeName: 'Català' },
    'cs': { code: 'cs', name: '捷克语', nativeName: 'Čeština' },
    'cy': { code: 'cy', name: '威尔士语', nativeName: 'Cymraeg' },
    'da': { code: 'da', name: '丹麦语', nativeName: 'Dansk' },
    'de': { code: 'de', name: '德语', nativeName: 'Deutsch' },
    'el': { code: 'el', name: '希腊语', nativeName: 'Ελληνικά' },
    'en': { code: 'en', name: '英语', nativeName: 'English' },
    'es': { code: 'es', name: '西班牙语', nativeName: 'Español' },
    'et': { code: 'et', name: '爱沙尼亚语', nativeName: 'Eesti' },
    'fa': { code: 'fa', name: '波斯语', nativeName: 'فارسی' },
    'fi': { code: 'fi', name: '芬兰语', nativeName: 'Suomi' },
    'fr': { code: 'fr', name: '法语', nativeName: 'Français' },
    'ga': { code: 'ga', name: '爱尔兰语', nativeName: 'Gaeilge' },
    'gu': { code: 'gu', name: '古吉拉特语', nativeName: 'ગુજરાતી' },
    'he': { code: 'he', name: '希伯来语', nativeName: 'עברית' },
    'hi': { code: 'hi', name: '印地语', nativeName: 'हिंदी' },
    'hr': { code: 'hr', name: '克罗地亚语', nativeName: 'Hrvatski' },
    'hu': { code: 'hu', name: '匈牙利语', nativeName: 'Magyar' },
    'id': { code: 'id', name: '印度尼西亚语', nativeName: 'Indonesia' },
    'is': { code: 'is', name: '冰岛语', nativeName: 'Íslenska' },
    'it': { code: 'it', name: '意大利语', nativeName: 'Italiano' },
    'ja': { code: 'ja', name: '日语', nativeName: '日本語' },
    'kk': { code: 'kk', name: '哈萨克语', nativeName: 'Қазақ тілі' },
    'kn': { code: 'kn', name: '卡纳达语', nativeName: 'ಕನ್ನಡ' },
    'ko': { code: 'ko', name: '韩语', nativeName: '한국어' },
    'lt': { code: 'lt', name: '立陶宛语', nativeName: 'Lietuvių' },
    'lv': { code: 'lv', name: '拉脱维亚语', nativeName: 'Latviešu' },
    'mk': { code: 'mk', name: '马其顿语', nativeName: 'Македонски' },
    'ml': { code: 'ml', name: '马拉雅拉姆语', nativeName: 'മലയാളം' },
    'mr': { code: 'mr', name: '马拉地语', nativeName: 'मराठी' },
    'ms': { code: 'ms', name: '马来语', nativeName: 'Bahasa Melayu' },
    'mt': { code: 'mt', name: '马耳他语', nativeName: 'Malti' },
    'nl': { code: 'nl', name: '荷兰语', nativeName: 'Nederlands' },
    'no': { code: 'no', name: '挪威语', nativeName: 'Norsk' },
    'pa': { code: 'pa', name: '旁遮普语', nativeName: 'ਪੰਜਾਬੀ' },
    'pl': { code: 'pl', name: '波兰语', nativeName: 'Polski' },
    'pt': { code: 'pt', name: '葡萄牙语', nativeName: 'Português' },
    'ro': { code: 'ro', name: '罗马尼亚语', nativeName: 'Română' },
    'ru': { code: 'ru', name: '俄语', nativeName: 'Русский' },
    'sk': { code: 'sk', name: '斯洛伐克语', nativeName: 'Slovenčina' },
    'sl': { code: 'sl', name: '斯洛文尼亚语', nativeName: 'Slovenščina' },
    'sr': { code: 'sr', name: '塞尔维亚语', nativeName: 'Српски' },
    'sv': { code: 'sv', name: '瑞典语', nativeName: 'Svenska' },
    'ta': { code: 'ta', name: '泰米尔语', nativeName: 'தமிழ்' },
    'te': { code: 'te', name: '泰卢固语', nativeName: 'తెలుగు' },
    'th': { code: 'th', name: '泰语', nativeName: 'ไทย' },
    'tr': { code: 'tr', name: '土耳其语', nativeName: 'Türkçe' },
    'uk': { code: 'uk', name: '乌克兰语', nativeName: 'Українська' },
    'ur': { code: 'ur', name: '乌尔都语', nativeName: 'اردو' },
    'vi': { code: 'vi', name: '越南语', nativeName: 'Tiếng Việt' },
    'zh-Hans': { code: 'zh-Hans', name: '简体中文', nativeName: '简体中文' },
    'zh-Hant': { code: 'zh-Hant', name: '繁体中文', nativeName: '繁體中文' },
    'auto': { code: 'auto', name: '自动检测', nativeName: '自动检测' }
};

export function getLanguageName(code: string, useNative: boolean = false): string {
    
    const normalizedCode = normalizeLanguageCode(code);
    
    const langInfo = languages[normalizedCode];
    if (!langInfo) {
        return code; // 如果找不到对应的语言信息，返回原始代码
    }

    return useNative ? langInfo.nativeName : langInfo.name;
}

export function normalizeLanguageCode(code: string): string {
    const codeMap: { [key: string]: string } = {
        'zh': 'zh-Hans',
        'zh-CN': 'zh-Hans',
        'zh-SG': 'zh-Hans',
        'zh-TW': 'zh-Hant',
        'zh-HK': 'zh-Hant',
        'zh-MO': 'zh-Hant',
        'cmn': 'zh-Hans',
        'cmn-Hans': 'zh-Hans',
        'cmn-Hant': 'zh-Hant'
    };

    return codeMap[code] || code;
}


export function isValidLanguageCode(code: string): boolean {
    return code === 'auto' || !!languages[normalizeLanguageCode(code)];
}

export function getLanguageList(): LanguageInfo[] {
    return Object.values(languages)
        .filter(lang => lang.code !== 'auto')
        .sort((a, b) => a.name.localeCompare(b.name));
}


export function getOppositeLanguage(from: string, defaultTarget: string = 'zh-Hans'): string {
    // 如果源语言是中文，则返回英语
    if (from === 'zh-Hans' || from === 'zh-Hant') {
        return 'en';
    }
    // 如果源语言是英语或其他语言，则返回简体中文
    return defaultTarget;
}