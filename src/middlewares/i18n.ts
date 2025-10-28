import { Request, Response, NextFunction } from 'express';
import { setLanguage, getAvailableLanguages } from '../utils/i18n';

export const i18nMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const acceptLanguage = req.headers['accept-language'];
    const queryLang = req.query.lang as string;
    
    let language = 'en';
    
    if (queryLang && getAvailableLanguages().includes(queryLang)) {
        language = queryLang;
    } else if (acceptLanguage) {
        const languages = acceptLanguage
            .split(',')
            .map(lang => lang.split(';')[0].trim().toLowerCase())
            .map(lang => lang.split('-')[0]); 
        
        for (const lang of languages) {
            if (getAvailableLanguages().includes(lang)) {
                language = lang;
                break;
            }
        }
    }
    
    setLanguage(language);
    
    res.setHeader('Content-Language', language);
    
    next();
};
