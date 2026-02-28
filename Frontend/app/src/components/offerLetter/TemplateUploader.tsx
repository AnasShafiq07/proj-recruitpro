import React, { useState, useRef } from 'react';
import { FileText, Upload, CheckCircle, Loader2, AlertCircle, ExternalLink } from 'lucide-react'; // Added ExternalLink
import { candidateViewApi } from '@/services/candidateViewApi';

interface TemplateUploaderProps {
  onUploadSuccess: (docId: string) => void;
  initialLink?: string; // Added to show existing link on load
}

const TemplateUploader: React.FC<TemplateUploaderProps> = ({ onUploadSuccess, initialLink }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [templateLink, setTemplateLink] = useState<string | null>(initialLink || null); // State for the link
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    try {
      const response = await candidateViewApi.uploadOfferTemplate(file);
      setStatus('success');
      
      // Construct the link from the response
      const newLink = `https://docs.google.com/document/d/${response.google_doc_id}/edit`;
      setTemplateLink(newLink);
      
      onUploadSuccess(response.google_doc_id);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg border border-slate-100 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-foreground">Upload Offer Template</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Upload a .docx or .pdf file that will be converted to a Google Doc. Use placeholders like <code className="bg-slate-100 px-2 py-1 rounded">{'{{name}}'}</code> for dynamic fields.
        </p>
      </div>

      {/* NEW: Active Template Link Section */}
      {templateLink && (
        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Current Active Template</p>
              <p className="text-xs text-blue-700">Google Docs Format</p>
            </div>
          </div>
          <a 
            href={templateLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            Preview Template
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}

      {/* File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".docx,.pdf"
        onChange={handleFileChange}
      />

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
      >
        <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
        <p className="font-semibold text-foreground mb-1">Click to upload or drag and drop</p>
        <p className="text-sm text-muted-foreground">Supported formats: .docx, .pdf</p>
        {file && <p className="text-sm font-medium text-blue-600 mt-2">Selected: {file.name}</p>}
      </div>

      {/* Status Messages */}
      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900">Upload Successful!</p>
            <p className="text-sm text-green-700">Your template has been converted and updated below.</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Upload Failed</p>
            <p className="text-sm text-red-700">Please try again. Make sure you're authenticated with Google.</p>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={status === 'uploading' || !file}
        className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
          status === 'uploading' || !file
            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {status === 'uploading' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Converting...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            {templateLink ? 'Replace Current Template' : 'Upload & Convert'}
          </>
        )}
      </button>
    </div>
  );
};

export default TemplateUploader;