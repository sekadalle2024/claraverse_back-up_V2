/**
 * Clara Attachment Service
 * Handles file attachment processing and analysis
 */

import { ClaraFileAttachment } from '../types/clara_assistant_types';
import * as XLSX from 'xlsx';

export class ClaraAttachmentService {
  /**
   * Process file attachments by analyzing them locally
   */
  public async processFileAttachments(attachments: ClaraFileAttachment[]): Promise<ClaraFileAttachment[]> {
    const processed = [...attachments];

    for (const attachment of processed) {
      try {
        // For images, we already have base64 or URL - mark as processed
        if (attachment.type === 'image') {
          attachment.processed = true;
          attachment.processingResult = {
            success: true,
            metadata: {
              type: 'image',
              processedAt: new Date().toISOString()
            }
          };
        }

        // For PDFs, documents, Excel and Word files, extract content
        if (attachment.type === 'pdf' || attachment.type === 'document' || attachment.type === 'excel' || attachment.type === 'word') {
          const extractedData = await this.extractDocumentContent(attachment);
          attachment.processed = true;
          attachment.processingResult = {
            success: extractedData.success,
            extractedText: extractedData.text,
            metadata: {
              type: attachment.type,
              processedAt: new Date().toISOString(),
              extractedData: extractedData.data,
              dataFormat: extractedData.format
            }
          };
        }

        // For code files, we can analyze the structure
        if (attachment.type === 'code') {
          attachment.processed = true;
          attachment.processingResult = {
            success: true,
            codeAnalysis: {
              language: this.detectCodeLanguage(attachment.name),
              structure: {
                functions: [],
                classes: [],
                imports: []
              },
              metrics: {
                lines: 0,
                complexity: 0
              }
            },
            metadata: {
              type: 'code',
              processedAt: new Date().toISOString()
            }
          };
        }

      } catch (error) {
        attachment.processed = false;
        attachment.processingResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Processing failed'
        };
      }
    }

    return processed;
  }

  /**
   * Detect code language from filename
   */
  private detectCodeLanguage(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin'
    };
    return langMap[ext || ''] || 'text';
  }

  /**
   * Extract image attachments from a list of attachments
   */
  public extractImageAttachments(attachments: ClaraFileAttachment[]): string[] {
    return attachments
      .filter(att => att.type === 'image')
      .map(att => att.base64 || att.url || '')
      .filter(Boolean);
  }

  /**
   * Check if attachments contain images
   */
  public hasImages(attachments: ClaraFileAttachment[]): boolean {
    return attachments.some(att => att.type === 'image');
  }

  /**
   * Check if attachments contain code files
   */
  public hasCodeFiles(attachments: ClaraFileAttachment[]): boolean {
    return attachments.some(att => att.type === 'code');
  }

  /**
   * Get attachment summary for display
   */
  public getAttachmentSummary(attachments: ClaraFileAttachment[]): string {
    if (attachments.length === 0) {
      return 'No attachments';
    }

    const typeCount: Record<string, number> = {};
    attachments.forEach(att => {
      typeCount[att.type] = (typeCount[att.type] || 0) + 1;
    });

    const summary = Object.entries(typeCount)
      .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
      .join(', ');

    return `Attachments: ${summary}`;
  }

  /**
   * Validate attachment before processing
   */
  public validateAttachment(attachment: ClaraFileAttachment): { valid: boolean; error?: string } {
    if (!attachment.name) {
      return { valid: false, error: 'Attachment name is required' };
    }

    if (!attachment.type) {
      return { valid: false, error: 'Attachment type is required' };
    }

    if (attachment.type === 'image' && !attachment.base64 && !attachment.url) {
      return { valid: false, error: 'Image attachments require base64 data or URL' };
    }

    if (attachment.size && attachment.size > 10 * 1024 * 1024) { // 10MB limit
      return { valid: false, error: 'Attachment size exceeds 10MB limit' };
    }

    return { valid: true };
  }

  /**
   * Filter valid attachments from a list
   */
  public filterValidAttachments(attachments: ClaraFileAttachment[]): ClaraFileAttachment[] {
    return attachments.filter(attachment => {
      const validation = this.validateAttachment(attachment);
      if (!validation.valid) {
        console.warn(`Invalid attachment ${attachment.name}: ${validation.error}`);
        return false;
      }
      return true;
    });
  }

  /**
   * Get extracted data formatted specifically for Flowise endpoint
   */
  public getExtractedDataForFlowise(attachments: ClaraFileAttachment[]): any {
    return this.formatExcelDataForFlowise(attachments);
  }

  /**
   * Get extracted data from attachments for sending to n8n endpoint
   */
  public getExtractedDataForN8N(attachments: ClaraFileAttachment[]): any {
    const extractedData: any = {
      files: [],
      hasExtractedContent: false,
      totalFiles: attachments.length
    };

    attachments.forEach(attachment => {
      if (attachment.processed && attachment.processingResult?.success) {
        const fileData: any = {
          filename: attachment.name,
          type: attachment.type,
          size: attachment.size,
          mimeType: attachment.mimeType,
          processed: true,
          extractedText: attachment.processingResult.extractedText || '',
          metadata: attachment.processingResult.metadata || {}
        };

        // Add structured data if available
        if (attachment.processingResult.metadata?.extractedData) {
          fileData.structuredData = attachment.processingResult.metadata.extractedData;
          fileData.dataFormat = attachment.processingResult.metadata.dataFormat;
          extractedData.hasExtractedContent = true;
        }

        extractedData.files.push(fileData);
      } else {
        // Include unprocessed files info
        extractedData.files.push({
          filename: attachment.name,
          type: attachment.type,
          size: attachment.size,
          mimeType: attachment.mimeType,
          processed: false,
          error: attachment.processingResult?.error || 'Not processed'
        });
      }
    });

    return extractedData;
  }

  /**
   * Format Excel data for Flowise endpoint in the specific JSON structure
   */
  private formatExcelDataForFlowise(attachments: ClaraFileAttachment[]): any {
    console.log('🔍 DEBUG - formatExcelDataForFlowise called with attachments:', attachments.length);
    const flowiseData: any = {};

    attachments.forEach((attachment, index) => {
      console.log(`🔍 DEBUG - Processing attachment ${index + 1}:`, {
        name: attachment.name,
        type: attachment.type,
        processed: attachment.processed,
        hasResult: !!attachment.processingResult,
        hasExtractedData: !!attachment.processingResult?.metadata?.extractedData
      });

      const isExcelFile = attachment.type === 'excel' || 
                          attachment.type === 'document' || 
                          attachment.name.toLowerCase().endsWith('.xlsx') || 
                          attachment.name.toLowerCase().endsWith('.xls') ||
                          attachment.processingResult?.metadata?.dataFormat === 'excel';

      if (attachment.processed && 
          attachment.processingResult?.success && 
          attachment.processingResult.metadata?.extractedData &&
          isExcelFile) {
        
        const extractedData = attachment.processingResult.metadata.extractedData;
        const fileName = attachment.name.replace(/\.(xlsx|xls)$/i, '');
        
        console.log(`🔍 DEBUG - Processing Excel file: ${fileName}`);
        console.log('🔍 DEBUG - Extracted data:', extractedData);
        
        // Create the main structure with filename as key
        flowiseData[fileName] = [];
        
        let tableIndex = 1;
        
        // Process each sheet
        Object.keys(extractedData).forEach(sheetName => {
          const sheetData = extractedData[sheetName];
          console.log(`🔍 DEBUG - Processing sheet: ${sheetName}`, sheetData);
          
          if (Array.isArray(sheetData) && sheetData.length > 0) {
            // If sheet has data, create table structure
            if (sheetData.length === 1) {
              // Single row - treat as key-value pairs
              const tableObj: any = {};
              tableObj[`table ${tableIndex}`] = {};
              
              if (Array.isArray(sheetData[0])) {
                // Array format - use indices as keys
                sheetData[0].forEach((value: any, index: number) => {
                  tableObj[`table ${tableIndex}`][`col_${index + 1}`] = value;
                });
              } else {
                // Object format
                tableObj[`table ${tableIndex}`] = sheetData[0];
              }
              
              flowiseData[fileName].push(tableObj);
              console.log(`🔍 DEBUG - Added single row table ${tableIndex}:`, tableObj);
            } else {
              // Multiple rows - treat as array of objects
              const tableObj: any = {};
              tableObj[`table ${tableIndex}`] = [];
              
              if (sheetData.length > 1) {
                const headers = sheetData[0]; // First row as headers
                const dataRows = sheetData.slice(1); // Remaining rows as data
                
                console.log(`🔍 DEBUG - Headers:`, headers);
                console.log(`🔍 DEBUG - Data rows:`, dataRows.length);
                
                dataRows.forEach((row: any[]) => {
                  const rowObj: any = {};
                  if (Array.isArray(headers) && Array.isArray(row)) {
                    headers.forEach((header: any, index: number) => {
                      rowObj[header || `col_${index + 1}`] = row[index] || '';
                    });
                  }
                  tableObj[`table ${tableIndex}`].push(rowObj);
                });
              }
              
              flowiseData[fileName].push(tableObj);
              console.log(`🔍 DEBUG - Added multi-row table ${tableIndex}:`, tableObj);
            }
            
            tableIndex++;
          }
        });
      } else {
        console.log(`🔍 DEBUG - Skipping attachment ${attachment.name} - not Excel or missing data`);
      }
    });

    console.log('🔍 DEBUG - Final Flowise data:', flowiseData);
    return flowiseData;
  }

  /**
   * Show extraction confirmation alert with Flowise JSON format
   */
  public showExtractionAlert(attachments: ClaraFileAttachment[]): void {
    console.log('🔍 DEBUG - showExtractionAlert called with attachments:', attachments);
    
    const processedFiles = attachments.filter(att => att.processed && att.processingResult?.success);
    const failedFiles = attachments.filter(att => att.processed && !att.processingResult?.success);
    
    // Debug: Log all processed files with their types
    console.log('🔍 DEBUG - Processed files:', processedFiles.map(f => ({
      name: f.name,
      type: f.type,
      hasExtractedData: !!f.processingResult?.metadata?.extractedData,
      dataFormat: f.processingResult?.metadata?.dataFormat
    })));
    
    const excelFiles = processedFiles.filter(att => {
      const isExcel = att.type === 'excel' || 
                     att.type === 'document' || // Fallback for documents
                     att.name.toLowerCase().endsWith('.xlsx') || 
                     att.name.toLowerCase().endsWith('.xls');
      const hasExtractedData = att.processingResult?.metadata?.extractedData;
      const dataFormat = att.processingResult?.metadata?.dataFormat;
      
      console.log(`🔍 DEBUG - File ${att.name}: type=${att.type}, isExcel=${isExcel}, hasExtractedData=${!!hasExtractedData}, dataFormat=${dataFormat}`);
      
      // Accept if it's Excel type OR if it has Excel data format
      return (isExcel || dataFormat === 'excel') && hasExtractedData;
    });
    
    console.log('🔍 DEBUG - Excel files found:', excelFiles.length);

    let message = `📊 Extraction des fichiers terminée !\n\n`;
    
    if (processedFiles.length > 0) {
      message += `✅ Fichiers traités avec succès (${processedFiles.length}):\n`;
      processedFiles.forEach(file => {
        const format = file.processingResult?.metadata?.dataFormat || file.type;
        message += `  • ${file.name} (${format})\n`;
      });
    }

    if (failedFiles.length > 0) {
      message += `\n❌ Fichiers non traités (${failedFiles.length}):\n`;
      failedFiles.forEach(file => {
        message += `  • ${file.name}: ${file.processingResult?.error || 'Erreur inconnue'}\n`;
      });
    }

    // Add Flowise JSON format for Excel files
    if (excelFiles.length > 0) {
      console.log('🔍 DEBUG - Generating Flowise data for Excel files...');
      const flowiseData = this.formatExcelDataForFlowise(excelFiles);
      console.log('🔍 DEBUG - Generated Flowise data:', flowiseData);
      
      message += `\n📤 Données Excel formatées pour l'endpoint Flowise:\n\n`;
      message += `${JSON.stringify(flowiseData, null, 2)}`;
    } else {
      console.log('🔍 DEBUG - No Excel files found, adding debug info to message');
      message += `\n🔍 DEBUG - Aucun fichier Excel détecté pour le formatage Flowise`;
      message += `\nTypes de fichiers détectés: ${processedFiles.map(f => `${f.name} (${f.type}) - dataFormat: ${f.processingResult?.metadata?.dataFormat}`).join(', ')}`;
      
      // Force test with any processed file that might be Excel
      const potentialExcelFiles = processedFiles.filter(att => 
        att.name.toLowerCase().includes('.xlsx') || 
        att.name.toLowerCase().includes('.xls') ||
        att.processingResult?.metadata?.dataFormat === 'excel'
      );
      
      if (potentialExcelFiles.length > 0) {
        console.log('🔍 DEBUG - Found potential Excel files, forcing Flowise format...');
        const forcedFlowiseData = this.formatExcelDataForFlowise(potentialExcelFiles);
        if (Object.keys(forcedFlowiseData).length > 0) {
          message += `\n\n📤 FORCED - Données Excel formatées pour l'endpoint Flowise:\n\n`;
          message += `${JSON.stringify(forcedFlowiseData, null, 2)}`;
        }
      }
    }

    message += `\n\n📤 Les données extraites seront incluses dans votre message vers l'endpoint Flowise.`;

    // Show browser alert
    alert(message);
    
    // Also log to console for debugging
    console.log('📊 Extraction Summary:', {
      total: attachments.length,
      processed: processedFiles.length,
      failed: failedFiles.length,
      excelFiles: excelFiles.length,
      extractedData: this.getExtractedDataForN8N(attachments),
      flowiseFormat: excelFiles.length > 0 ? this.formatExcelDataForFlowise(excelFiles) : null
    });
  }

  /**
   * Extract content from Excel and Word documents
   */
  private async extractDocumentContent(attachment: ClaraFileAttachment): Promise<{
    success: boolean;
    text: string;
    data?: any;
    format?: string;
    error?: string;
  }> {
    try {
      if (!attachment.base64) {
        return {
          success: false,
          text: '',
          error: 'No file content available for extraction'
        };
      }

      const fileExtension = attachment.name.toLowerCase().split('.').pop();
      
      // Check by file type first, then by extension
      if (attachment.type === 'excel' || fileExtension === 'xlsx' || fileExtension === 'xls') {
        console.log('🔍 DEBUG - Routing to Excel extraction');
        return await this.extractExcelContent(attachment);
      } else if (attachment.type === 'word' || fileExtension === 'docx') {
        console.log('🔍 DEBUG - Routing to Word extraction');
        return await this.extractWordContent(attachment);
      } else if (fileExtension === 'pdf') {
        console.log('🔍 DEBUG - PDF type not implemented yet');
        return {
          success: false,
          text: '',
          error: 'PDF extraction not implemented in this service'
        };
      } else {
        console.log('🔍 DEBUG - Unsupported document type:', fileExtension, 'attachment type:', attachment.type);
        return {
          success: false,
          text: '',
          error: `Unsupported document type: ${fileExtension} (type: ${attachment.type})`
        };
      }
    } catch (error) {
      console.error('Error extracting document content:', error);
      return {
        success: false,
        text: '',
        error: error instanceof Error ? error.message : 'Unknown extraction error'
      };
    }
  }

  /**
   * Extract content from Excel files (.xlsx, .xls)
   */
  private async extractExcelContent(attachment: ClaraFileAttachment): Promise<{
    success: boolean;
    text: string;
    data?: any;
    format?: string;
    error?: string;
  }> {
    console.log('🔍 DEBUG - extractExcelContent called for:', attachment.name);
    console.log('🔍 DEBUG - Has base64:', !!attachment.base64);
    
    try {
      if (!attachment.base64) {
        console.log('🔍 DEBUG - No base64 data found');
        return {
          success: false,
          text: '',
          error: 'No base64 data available'
        };
      }

      // Convert base64 to binary
      const base64Data = attachment.base64.includes(',') ? attachment.base64.split(',')[1] : attachment.base64;
      console.log('🔍 DEBUG - Base64 data length:', base64Data.length);
      
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      console.log('🔍 DEBUG - Binary data length:', bytes.length);

      // Read Excel file
      const workbook = XLSX.read(bytes, { type: 'array' });
      console.log('🔍 DEBUG - Workbook loaded, sheets:', workbook.SheetNames);
      
      const extractedData: any = {};
      let extractedText = `📊 Données extraites du fichier Excel: ${attachment.name}\n\n`;

      // Process each worksheet
      workbook.SheetNames.forEach((sheetName) => {
        console.log(`🔍 DEBUG - Processing sheet: ${sheetName}`);
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON for structured data
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log(`🔍 DEBUG - Sheet ${sheetName} data:`, jsonData);
        extractedData[sheetName] = jsonData;

        // Convert to text for display
        const csvText = XLSX.utils.sheet_to_csv(worksheet);
        
        extractedText += `📋 Feuille "${sheetName}":\n`;
        if (csvText.trim()) {
          // Format as table for better readability
          const rows = csvText.split('\n').filter(row => row.trim());
          if (rows.length > 0) {
            extractedText += rows.slice(0, 10).map(row => `  ${row}`).join('\n');
            if (rows.length > 10) {
              extractedText += `\n  ... (${rows.length - 10} lignes supplémentaires)`;
            }
          } else {
            extractedText += '  (Feuille vide)';
          }
        } else {
          extractedText += '  (Feuille vide)';
        }
        extractedText += '\n\n';
      });

      // Add summary
      extractedText += `📈 Résumé:\n`;
      extractedText += `  • ${workbook.SheetNames.length} feuille(s) de calcul\n`;
      extractedText += `  • Feuilles: ${workbook.SheetNames.join(', ')}\n`;

      console.log('🔍 DEBUG - Final extracted data:', extractedData);
      console.log('🔍 DEBUG - Final extracted text length:', extractedText.length);

      return {
        success: true,
        text: extractedText,
        data: extractedData,
        format: 'excel'
      };
    } catch (error) {
      console.error('🔍 DEBUG - Error extracting Excel content:', error);
      return {
        success: false,
        text: '',
        error: error instanceof Error ? error.message : 'Excel extraction failed'
      };
    }
  }

  /**
   * Extract content from Word documents (.docx)
   */
  private async extractWordContent(attachment: ClaraFileAttachment): Promise<{
    success: boolean;
    text: string;
    data?: any;
    format?: string;
    error?: string;
  }> {
    try {
      // Convert base64 to binary
      const binaryString = atob(attachment.base64!.split(',')[1] || attachment.base64!);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // For Word documents, we'll use a simple approach to extract text
      // Note: This is a basic implementation. For full Word parsing, we'd need mammoth.js
      const JSZip = await import('jszip');
      const zip = await JSZip.default.loadAsync(bytes);
      
      // Extract document.xml which contains the main text content
      const documentXml = await zip.file('word/document.xml')?.async('string');
      
      if (!documentXml) {
        return {
          success: false,
          text: '',
          error: 'Could not find document content in Word file'
        };
      }

      // Simple text extraction from XML (removes tags)
      let extractedText = documentXml
        .replace(/<[^>]*>/g, ' ') // Remove XML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      // Format the output
      const formattedText = `📄 Contenu extrait du document Word: ${attachment.name}\n\n${extractedText}`;

      return {
        success: true,
        text: formattedText,
        data: { rawText: extractedText },
        format: 'word'
      };
    } catch (error) {
      console.error('Error extracting Word content:', error);
      return {
        success: false,
        text: '',
        error: error instanceof Error ? error.message : 'Word extraction failed'
      };
    }
  }
}

// Export singleton instance
export const claraAttachmentService = new ClaraAttachmentService(); 