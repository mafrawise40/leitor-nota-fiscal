import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ItemCupom } from "@/model/ItemCupom";

export async function GET() {
    try {
        await connectDB();
        const anoAtual = new Date().getFullYear();
        const inicioAno = new Date(anoAtual, 0, 1);

        // Busca todos os itens do ano atual
        const itens = await ItemCupom.find({
            createdAt: { $gte: inicioAno }
        }).sort({ createdAt: 1 }); // Do mais antigo para o mais novo

        const analise: Record<string, any> = {};

        itens.forEach(item => {
            const nome = item.descricao.toUpperCase().trim();
            if (!analise[nome]) {
                analise[nome] = {
                    nome,
                    precoInicial: item.valorUnitario,
                    precoFinal: item.valorUnitario,
                    dataInicial: item.createdAt,
                    dataFinal: item.createdAt,
                    ocorrencias: 1
                };
            } else {
                analise[nome].precoFinal = item.valorUnitario;
                analise[nome].dataFinal = item.createdAt;
                analise[nome].ocorrencias += 1;
            }
        });

        const resultado = Object.values(analise)
            .map(item => {
                const variacao = ((item.precoFinal - item.precoInicial) / item.precoInicial) * 100;
                return { ...item, variacao };
            })
            .filter(item => item.ocorrencias > 1) // Só importa se comprou mais de uma vez
            .sort((a, b) => b.variacao - a.variacao); // Os que mais subiram no topo

        return NextResponse.json({ success: true, data: resultado });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message });
    }
}