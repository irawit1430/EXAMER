"use client";

import React, { useState } from "react";
import { OnboardingData } from "../OnboardingFlow";
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  data: OnboardingData;
  updateData: (patch: Partial<OnboardingData>) => void;
}

export default function Step1SyllabusUpload({ data, updateData }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      uploadAndParseFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAndParseFile(file);
    }
  };

  const uploadAndParseFile = async (file: File) => {
    setFileName(file.name);
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/syllabus/parse", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to parse syllabus");
      }

      const parsedData = await response.json();

      // Validate that Gemini actually gave us topics
      if (
        !parsedData ||
        !parsedData.topics ||
        !Array.isArray(parsedData.topics)
      ) {
        throw new Error(
          "Our AI failed to extract subjects from this file. Is it a valid syllabus?",
        );
      }

      // Assuming the API returns a structured JSON string, we store it
      updateData({ syllabus: JSON.stringify(parsedData) });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred during parsing.";
      console.error("Syllabus upload error:", err);
      setError(errorMessage);
      setFileName("");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <h2 className="text-2xl font-display font-bold text-text-primary mb-2">
        Upload Your Syllabus
      </h2>
      <p className="text-text-secondary text-[13px] mb-6 leading-relaxed max-w-xl">
        Drop your official exam syllabus or target exam topics here to let our
        AI configure your custom study path.
      </p>

      {error && (
        <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-2 text-red-600 animate-slide-up">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] font-medium">{error}</p>
        </div>
      )}

      <div
        className={`flex-1 min-h-[260px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center transition-all duration-300 ${
          isDragging
            ? "border-brand-primary bg-brand-primary/5 scale-[1.02] shadow-sm"
            : data.syllabus
              ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
              : "border-border-default hover:border-brand-primary/40 bg-surface-50 hover:bg-white shadow-sm"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {data.syllabus && !isUploading ? (
          <div className="flex flex-col items-center animate-scale-up">
            <div className="w-14 h-14 rounded-full bg-emerald-100/50 flex items-center justify-center mb-4 text-emerald-600 border border-emerald-200/50">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-1 tracking-tight">
              Syllabus Processed
            </h3>
            <p className="text-[13px] font-medium text-text-secondary">
              AI mentor is ready to build your path.
            </p>

            <button
              onClick={() => {
                updateData({ syllabus: "" });
                setFileName("");
                setError(null);
              }}
              className="mt-6 text-[13px] font-semibold text-text-muted hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              Remove and upload a different file
            </button>
          </div>
        ) : isUploading ? (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-brand-primary/5 flex items-center justify-center mb-4 text-brand-primary border border-brand-primary/10 relative">
              <div className="absolute inset-0 rounded-full border-2 border-brand-primary/20 border-t-brand-primary animate-spin" />
              <UploadCloud className="w-7 h-7 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-1 tracking-tight">
              Parsing Syllabus...
            </h3>
            <p className="text-[13px] font-medium text-text-secondary">
              Extracting key topics using Gemini AI
            </p>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 text-brand-primary border border-border-subtle">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-1 tracking-tight">
              Drag & Drop file here
            </h3>
            <p className="text-[13px] font-medium text-text-secondary mb-6">
              Currently supporting .pdf, .txt, and .md files
            </p>

            <label className="cursor-pointer">
              <span className="h-9 inline-flex items-center justify-center rounded-lg bg-surface-50 border border-border-default px-5 text-[13px] font-semibold text-text-primary hover:bg-white transition-all shadow-sm hover:border-border-subtle">
                Browse Files
              </span>
              <input
                type="file"
                className="hidden"
                accept=".txt,.md,.pdf"
                onChange={handleFileChange}
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
}
