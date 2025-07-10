import mammoth from 'mammoth';

export const extractTextFromFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      // Handle plain text files
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        resolve(result);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read text file'));
      };
      reader.readAsText(file);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
      // Handle DOCX files
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve(result.value);
        } catch (error) {
          reject(new Error('Failed to extract text from DOCX file. Please ensure the file is not corrupted.'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read DOCX file'));
      };
      reader.readAsArrayBuffer(file);
    } else if (fileName.endsWith('.doc')) {
      // Older Word format not supported
      reject(new Error('DOC files (older Word format) are not supported. Please save your document as DOCX or copy-paste the text.'));
    } else if (fileName.endsWith('.pdf')) {
      // PDF files not supported
      reject(new Error('PDF files are not supported. Please convert to DOCX or copy-paste your resume text.'));
    } else {
      // Unsupported file type
      reject(new Error('Unsupported file type. Please upload a DOCX or TXT file, or copy-paste your resume text.'));
    }
  });
};

export const downloadTXT = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// Convert Markdown to plain text for ATS compatibility
export const markdownToPlainText = (markdown: string): string => {
  return markdown
    // Remove markdown headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold and italic formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove code formatting
    .replace(/`([^`]+)`/g, '$1')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Convert bullet points to simple dashes
    .replace(/^[\*\-\+]\s+/gm, '- ')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
};

// Convert text to sentence case (first letter capitalized, rest lowercase)
export const toSentenceCase = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Generate SHA-256 hash for content deduplication
export const generateSHA256Hash = async (text: string): Promise<string> => {
  try {
    // Normalize the text by trimming whitespace and converting to lowercase
    const normalizedText = text.trim().toLowerCase();
    
    // Convert string to ArrayBuffer
    const encoder = new TextEncoder();
    const data = encoder.encode(normalizedText);
    
    // Generate hash using Web Crypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert ArrayBuffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error('Failed to generate hash:', error);
    // Fallback: use a simple hash if crypto.subtle is not available
    return btoa(text.trim().toLowerCase()).replace(/[^a-zA-Z0-9]/g, '');
  }
};