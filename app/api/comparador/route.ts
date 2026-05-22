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

    // Função que transforma "PAO" em "P[AÁÀÃÂ]O"
    const buscarComAcentos = (text: string) => {
      const accents: Record<string, string> = {
        'a': '[aáàãâä]',
        'e': '[eéèêë]',
        'i': '[iíìîï]',
        'o': '[oóòõôö]',
        'u': '[uúùûü]',
        'c': '[cç]'
      };
      return text.toLowerCase().split('').map(char => accents[char] || char).join('');
    };

    // Normalizamos apenas para tirar acentos da BUSCA do usuário e reconstruir a Regex
    const termoLimpo = termo.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const palavras = termoLimpo.trim().split(/\s+/);

    const query = {
      $and: palavras.map(p => ({
        // Aqui a mágica acontece: "pao" vira o regex "p[aáàãâä]o"
        descricao: { $regex: buscarComAcentos(p), $options: "i" }
      }))
    };

    const itens = await ItemCupom.find(query)
      .populate("estabelecimentoId")
      .sort({ valorUnitario: 1 }) 
      .limit(100); 

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