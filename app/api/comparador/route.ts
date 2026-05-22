import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ItemCupom } from "@/model/ItemCupom";
import "@/model/Estabelecimento";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const termo = searchParams.get("termo");

    if (!termo) return NextResponse.json({ success: false, data: [] });

    // Quebra a busca em palavras (ex: "OVO 30" vira ["OVO", "30"])
    const normalizar = (text: string) => 
      text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const palavras = normalizar(termo).trim().split(/\s+/);

    // Cria um array de condições: cada palavra deve estar na descrição
    // O $all garante que todas as palavras existam na string, em qualquer ordem
    const query = {
      $and: palavras.map(p => ({
        descricao: { $regex: p, $options: "i" }
      }))
    };

    const itens = await ItemCupom.find(query)
      .populate("estabelecimentoId")
      .sort({ valorUnitario: 1 }) 
      .limit(10); // Buscamos um pouco mais para filtrar os melhores únicos

    // Lógica para pegar apenas o preço mais recente/melhor de cada mercado para não repetir o mesmo item 5x
    const uniqueMercados = new Map();
    itens.forEach(item => {
        const mercId = item.estabelecimentoId?._id.toString();
        if (!uniqueMercados.has(mercId)) {
            uniqueMercados.set(mercId, item);
        }
    });

    return NextResponse.json({ 
      success: true, 
      data: Array.from(uniqueMercados.values()).slice(0, 5) 
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}