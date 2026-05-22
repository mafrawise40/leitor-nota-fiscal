import { NextResponse } from "next/server";
import { createWorker } from "tesseract.js";

export async function POST(req: Request) {

  try {

    const formData = await req.formData();

    const file = formData.get("file") as File;

    if (!file) {

      return NextResponse.json(
        { error: "Arquivo não enviado" },
        { status: 400 }
      );

    }

    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);

    // cria worker
    const worker = await createWorker("por");

    // OCR
    const result = await worker.recognize(buffer);

    await worker.terminate();

    return NextResponse.json({
      success: true,
      text: result.data.text,
    });

  } catch (err) {

    console.error(err);

    return NextResponse.json(
      { error: "Erro OCR" },
      { status: 500 }
    );

  }
}