import fs from "fs";
import path from "path";

// Helper function to save base64 file
export const saveBase64File = (base64Data: string, fileName: string, uploadDir: string = "uploads/logos"): string => {
    // Check if base64Data is valid
    if (!base64Data || typeof base64Data !== 'string') {
        throw new Error('Invalid base64 data provided');
    }
    
    // Remove data URL prefix if present
    const base64String = base64Data.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
    
    // Create upload directory if it doesn't exist
    const fullUploadDir = path.join(process.cwd(), 'public', uploadDir);
    if (!fs.existsSync(fullUploadDir)) {
        fs.mkdirSync(fullUploadDir, { recursive: true });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(fileName);
    const baseName = path.basename(fileName, fileExtension);
    const uniqueFileName = `${baseName}-${timestamp}${fileExtension}`;
    const filePath = path.join(fullUploadDir, uniqueFileName);
    
    // Save file
    fs.writeFileSync(filePath, base64String, 'base64');
    
    // Return URL path
    return `/${uploadDir}/${uniqueFileName}`;
};

// Helper function to save multiple base64 files
export const saveBase64Files = (files: Array<{file: string, fileName: string}>, uploadDir: string = "uploads/images"): string[] => {
    return files.map(file => saveBase64File(file.file, file.fileName, uploadDir));
};
