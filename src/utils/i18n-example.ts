// Example usage of i18n system
import { __, setLanguage, getCurrentLanguage } from './i18n';

// Example function showing how to use translations
export const exampleUsage = () => {
    console.log('Current language:', getCurrentLanguage());
    
    // English messages
    console.log('User not found (EN):', __('auth.user_not_found'));
    console.log('Invalid password (EN):', __('auth.invalid_password'));
    
    // Switch to Ukrainian
    setLanguage('uk');
    console.log('Current language:', getCurrentLanguage());
    
    // Ukrainian messages
    console.log('User not found (UK):', __('auth.user_not_found'));
    console.log('Invalid password (UK):', __('auth.invalid_password'));
    
    // Switch back to English
    setLanguage('en');
};

// Example of how to use in API responses
export const createErrorResponse = (errorKey: string, statusCode: number = 400) => {
    return {
        success: false,
        error: __(errorKey),
        statusCode
    };
};

export const createSuccessResponse = (messageKey: string, data?: any) => {
    return {
        success: true,
        message: __(messageKey),
        data
    };
};
