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

        const buscarComAcentos = (text: string) => {
            const accents: Record<string, string> = {
                'a': '[aáàãâä]', 'e': '[eéèêë]', 'i': '[iíìîï]',
                'o': '[oóòõôö]', 'u': '[uúùûü]', 'c': '[cç]'
            };
            return text.toLowerCase().split('').map(char => accents[char] || char).join('');
        };

        const termoLimpo = termo.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const palavras = termoLimpo.trim().split(/\s+/);

        const query = {
            $and: palavras.map(p => ({
                descricao: { $regex: buscarComAcentos(p), $options: "i" }
            }))
        };

     

        const itens = await ItemCupom.find(query)
            .populate("estabelecimentoId")
            .sort({ valorUnitario: 1 }) // MAIS BARATO PRIMEIRO
            .limit(10); // LIMITE DE 10 ITENS POR FILTRO

               console.log(itens)

        return NextResponse.json({ success: true, data: itens });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message });
    }
}