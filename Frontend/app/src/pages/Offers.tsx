import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import TemplateUploader from "@/components/offerLetter/TemplateUploader";
import { candidateViewApi } from "@/services/candidateViewApi";

const Offers = () => {
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [templateLink, setTemplateLink] = useState<string | null>(null);

  useEffect(() => {
    const fetchExistingTemplate = async () => {
      try {
        const data = await candidateViewApi.getOfferTemplate();
        if (data.google_doc_id) {
          setActiveTemplateId(data.google_doc_id);
          // Use the view_link from API or construct it if missing
          setTemplateLink(data.view_link || `https://docs.google.com/document/d/${data.google_doc_id}/edit`);
        }
      } catch (error) {
        console.error("No existing template found or fetch failed:", error);
      }
    };

    fetchExistingTemplate();
  }, []);

  const handleUploadSuccess = (docId: string) => {
    setActiveTemplateId(docId);
    setTemplateLink(`https://docs.google.com/document/d/${docId}/edit`);
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        {/* --- Header --- */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Offer Letters</h1>
          <p className="text-muted-foreground mt-1">
            Upload a .docx template with placeholders like {"{{name}}"} to automate your hiring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* --- Right Side: Upload Tool --- */}
          <div className="md:col-span-2">
            {/* Added initialLink prop to sync with internal uploader state */}
            <TemplateUploader 
              onUploadSuccess={handleUploadSuccess} 
              initialLink={templateLink || undefined} 
            />
          </div>

          {/* --- Left Side: Current Status --- */}
          <div className="space-y-6">
            <Card className="border-blue-100 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {activeTemplateId ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  )}
                  Active Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeTemplateId ? (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground font-mono break-all bg-white p-2 rounded border">
                      {activeTemplateId}
                    </p>
                    <a 
                      href={templateLink || `https://docs.google.com/document/d/${activeTemplateId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View on Google Docs <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No template uploaded yet. Upload a .docx file to get started.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Guide</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>1. Prepare a Word (.docx) file.</p>
                <p>2. Use double brackets for fields: <code className="bg-slate-100 px-1">{"{{salary}}"}</code></p>
                <p>3. Upload here to convert it to a RecruitPro template.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Offers;