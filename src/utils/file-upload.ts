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

const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.xls', '.xlsx'];
const MAX_DOCUMENT_SIZE_BYTES = 2 * 1024 * 1024;

export interface SavedDocument {
    fileName: string;
    fileUrl: string;
    fileType: string | null;
    fileSize: number;
}

export const saveBase64Document = (
    base64Data: string,
    fileName: string,
    uploadDir: string = "uploads/offer-files"
): SavedDocument => {
    if (!base64Data || typeof base64Data !== 'string') {
        throw new Error('Invalid base64 data provided');
    }
    if (!fileName || typeof fileName !== 'string') {
        throw new Error('Invalid file name provided');
    }

    const fileExtension = path.extname(fileName).toLowerCase();
    if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(fileExtension)) {
        throw new Error('Unsupported file type. Allowed types: pdf, xls, xlsx');
    }

    const mimeMatch = base64Data.match(/^data:([^;]+);base64,/);
    const fileType = mimeMatch ? mimeMatch[1] : null;
    const base64String = base64Data.replace(/^data:[^;]+;base64,/, '');

    const sizeInBytes = Buffer.byteLength(base64String, 'base64');
    if (sizeInBytes > MAX_DOCUMENT_SIZE_BYTES) {
        throw new Error('File is too large. Maximum allowed size is 2 MB');
    }

    const fullUploadDir = path.join(process.cwd(), 'public', uploadDir);
    if (!fs.existsSync(fullUploadDir)) {
        fs.mkdirSync(fullUploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const baseName = path.basename(fileName, fileExtension).replace(/[^a-zA-Z0-9-_]/g, '_');
    const uniqueFileName = `${baseName}-${timestamp}${fileExtension}`;
    const filePath = path.join(fullUploadDir, uniqueFileName);

    fs.writeFileSync(filePath, base64String, 'base64');

    return {
        fileName,
        fileUrl: `/${uploadDir}/${uniqueFileName}`,
        fileType,
        fileSize: sizeInBytes,
    };
};

export const resolveUploadedFilePath = (fileUrl: string): string => {
    const relative = fileUrl.replace(/^\/+/, '');
    return path.join(process.cwd(), 'public', relative);
};

export const deleteUploadedFile = (fileUrl: string): void => {
    if (!fileUrl || typeof fileUrl !== 'string') return;
    try {
        const absolutePath = resolveUploadedFilePath(fileUrl);
        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
        }
    } catch {
    }
};
