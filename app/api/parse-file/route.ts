import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();

    let text = "";

    if (fileName.endsWith(".pdf")) {
      // Dynamic import to avoid issues with Next.js bundling
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (fileName.endsWith(".txt")) {
      text = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, Word, or TXT files." },
        { status: 400 }
      );
    }

    return NextResponse.json({ text: text.trim() });
  } catch (error) {
    console.error("File parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse file. Please try again or paste text manually." },
      { status: 500 }
    );
  }
}
