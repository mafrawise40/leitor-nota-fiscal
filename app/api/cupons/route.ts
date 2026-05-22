import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Cupom } from "@/model/Cupom";
import { ItemCupom } from "@/model/ItemCupom";
import "@/model/Estabelecimento";

export async function GET() {
    try {
        await connectDB();
        // Busca cupons ordenando pelos mais recentes
        const cupons = await Cupom.find().populate("estabelecimentoId").sort({ dataEmissao: -1 });
        return NextResponse.json({ success: true, data: cupons });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}


export async function DELETE(req: Request) {
  try {
    await connectDB();
    
    // 1. PEGA O ID DA URL (Ex: /api/cupons?id=6a10...)
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    console.log("Tentando excluir ID:", id);

    if (!id) {
      return NextResponse.json({ success: false, error: "ID não fornecido na URL" }, { status: 400 });
    }

    // 2. DELETA OS ITENS VINCULADOS
    await ItemCupom.deleteMany({ cupomId: id });
    
    // 3. DELETA O CUPOM
    const deletado = await Cupom.findByIdAndDelete(id);

    if (!deletado) {
      return NextResponse.json({ success: false, error: "Cupom não encontrado no banco" }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Erro no DELETE:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}