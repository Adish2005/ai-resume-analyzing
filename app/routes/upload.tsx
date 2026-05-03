// app/routes/upload.tsx

import React, {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { useNavigate } from "react-router";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";

import { usePuterStore } from "~/lib/puter";
import { generateUUID } from "~/lib/utils";
import { convertPdfToImage } from "~/lib/pdf2img";
import { prepareInstructions } from "../../constants";

const Upload = () => {
  const {
    init,
    puterReady,
    isLoading,
    fs,
    ai,
    kv,
  } = usePuterStore();

  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [statusText, setStatusText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (puterReady) {
      console.log("✅ Puter is ready");
    }
  }, [puterReady]);

  const handleFileSelect = (
    selectedFile: File | null
  ) => {
    setFile(selectedFile);

    if (selectedFile) {
      setStatusText(`${selectedFile.name} selected`);
    } else {
      setStatusText("");
    }
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (isProcessing) return;

    if (isLoading || !puterReady) {
      setStatusText("Puter still loading...");
      return;
    }

    if (!file) {
      setStatusText("Please upload resume PDF");
      return;
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setStatusText("Only PDF files allowed");
      return;
    }

    try {
      setIsProcessing(true);

      const formData = new FormData(e.currentTarget);

      const companyName = (
        formData.get("company-name") as string
      )?.trim();

      const jobTitle = (
        formData.get("job-title") as string
      )?.trim();

      const jobDescription = (
        formData.get("job-description") as string
      )?.trim();

      if (!companyName || !jobTitle || !jobDescription) {
        setStatusText("Fill all fields");
        setIsProcessing(false);
        return;
      }

      // Upload Resume
      setStatusText("Uploading resume...");
      const uploadedResume = await fs.upload([file]);

      const resumePath =
        uploadedResume?.path ||
        uploadedResume?.[0]?.path;

      if (!resumePath) {
        throw new Error("Resume upload failed");
      }

      // Convert PDF to Image
      setStatusText("Converting PDF...");

      let image = null;

      if (typeof window !== "undefined") {
        image = await convertPdfToImage(file);
      }

      if (!image?.file) {
        throw new Error("Image conversion failed");
      }

      // Upload Preview Image
      setStatusText("Uploading preview...");
      const uploadedImage = await fs.upload([
        image.file,
      ]);

      const imagePath =
        uploadedImage?.path ||
        uploadedImage?.[0]?.path;

      if (!imagePath) {
        throw new Error("Image upload failed");
      }

      // AI Feedback
      setStatusText("Analyzing resume...");

      let feedback;

      try {
        const instructions =
          prepareInstructions({
            jobTitle,
            jobDescription,
            AIResponseFormat: "json",
          });

        const response = await ai.feedback(
          resumePath,
          instructions
        );

        const raw = response?.message?.content;

        if (typeof raw === "string") {
          const cleaned = raw
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

          feedback = JSON.parse(cleaned);
        } else {
          feedback = raw;
        }
      } catch (err) {
        console.error("AI Error:", err);
        setStatusText("AI failed");
        setIsProcessing(false);
        return;
      }

      // Save Data
      const id = generateUUID();

      await kv.set(
        `resume:${id}`,
        JSON.stringify({
          id,
          companyName,
          jobTitle,
          jobDescription,
          resumePath,
          imagePath,
          feedback,
          createdAt: Date.now(),
        })
      );

      setStatusText("Success! Redirecting...");

      setTimeout(() => {
        navigate(`/resume/${id}`);
      }, 1500);
    } catch (error) {
      console.error(error);
      setStatusText("Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>

          <h2 className="mt-3">{statusText}</h2>

          {!isProcessing && (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              <input
                type="text"
                name="company-name"
                placeholder="Company Name"
                required
              />

              <input
                type="text"
                name="job-title"
                placeholder="Job Title"
                required
              />

              <textarea
                rows={5}
                name="job-description"
                placeholder="Job Description"
                required
              />

              <FileUploader
                onFileSelect={handleFileSelect}
              />

              <button
                type="submit"
                disabled={
                  isLoading ||
                  isProcessing ||
                  !file
                }
                className="primary-button disabled:opacity-50"
              >
                {isLoading
                  ? "Loading..."
                  : "Analyze Resume"}
              </button>
            </form>
          )}

          {isProcessing && (
            <div className="mt-8 flex flex-col items-center gap-4">
              <img
                src="/images/resume-scan.gif"
                alt="Scanning Resume"
                className="w-72 md:w-96"
              />

              <p className="text-white text-lg">
                {statusText || "Processing..."}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;