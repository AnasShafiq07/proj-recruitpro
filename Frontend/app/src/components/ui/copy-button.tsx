import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyLinkProps {
  link: string;
}

export const CopyLinkInput = ({ link }: CopyLinkProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="w-full max-w-md">
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Share Interview Link
      </label>
      <div className="relative group">
        {/* The Read-Only Input */}
        <input
          type="text"
          readOnly
          value={link}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-24 text-sm text-gray-500 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />

        {/* The Button */}
        <button
          onClick={handleCopy}
          className={`absolute right-1 top-1 bottom-1 flex items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-all duration-300
            ${
              copied
                ? "bg-green-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm"
            }
          `}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};