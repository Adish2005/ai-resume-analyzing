export interface PdfConversionResult {
  file: File | null;
  error?: string;
}

export async function convertPdfToImage(
  file: File
): Promise<PdfConversionResult | null> {
  try {
    // ✅ Prevent SSR (fixes DOMMatrix / window errors)
    if (typeof window === "undefined") {
      return null;
    }

    // ✅ Correct browser build of pdf.js
    const pdfjsLib = await import("pdfjs-dist/build/pdf");

    // ✅ Correct worker (must match build)
    const worker = await import(
      "pdfjs-dist/build/pdf.worker.min?url"
    );

    // ✅ Attach worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;

    // ✅ Read file
    const arrayBuffer = await file.arrayBuffer();

    // ✅ Load PDF
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
    }).promise;

    // ✅ Get first page
    const page = await pdf.getPage(1);

    // ✅ Set scale for better quality
    const viewport = page.getViewport({ scale: 2 });

    // ✅ Create canvas
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) throw new Error("Canvas failed");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // ✅ Render page
    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    // ✅ Convert to image blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("Blob failed"));
      }, "image/png");
    });

    // ✅ Create File
    const imageFile = new File([blob], "preview.png", {
      type: "image/png",
    });

    return {
      file: imageFile,
    };
  } catch (err) {
    console.error("PDF ERROR:", err);

    return {
      file: null,
      error: "PDF conversion failed",
    };
  }
}