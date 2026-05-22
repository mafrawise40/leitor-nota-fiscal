import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ItemCupom } from "@/model/ItemCupom";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const cupomId = searchParams.get("id");

    if (!cupomId) {
      return NextResponse.json({ success: false, error: "ID do cupom ausente" }, { status: 400 });
    }

    // BUSCA NA COLEÇÃO DE ITENS vinculada a este cupom
    const itens = await ItemCupom.find({ cupomId }).sort({ descricao: 1 });

    console.log(`Encontrados ${itens.length} itens para o cupom ${cupomId}`);

    return NextResponse.json({ 
      success: true, 
      data: itens // Agora o data vai com o array de itens real
    });

  } catch (err: any) {
    console.error("Erro ao buscar itens:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}