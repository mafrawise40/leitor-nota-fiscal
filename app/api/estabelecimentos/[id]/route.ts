import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Estabelecimento } from "@/model/Estabelecimento";

// ATUALIZAR
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const body = await req.json();

    // O SEGREDO ESTÁ AQUI: Aguardar o params
    const { id } = await params;

    const atualizado = await Estabelecimento.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    return NextResponse.json({ success: true, data: atualizado });
  } catch (err: any) {
    console.error("Erro no PUT:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// EXCLUIR
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    
    // Aguardar o params também no DELETE
    const { id } = await params;

    await Estabelecimento.findByIdAndDelete(id);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}