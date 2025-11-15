import { useState, useEffect } from 'react';
import { Loader2 } from "lucide-react";

export function ShareModal({ isOpen, onClose, link }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Detect when link arrives
  useEffect(() => {
    if (link && link.trim() !== "") {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [link]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Share Link
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-gray-600 mt-3 text-sm">Generating link...</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              Copy the link below to share with others.
            </p>

            {/* Link Field */}
            <div className="flex items-center gap-2 mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="text"
                value={link}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
              />
              <button
                onClick={copyLink}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
