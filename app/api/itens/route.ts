import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ItemCupom } from "@/model/ItemCupom";

export async function GET() {
    try {
        await connectDB();
        // Busca todos os itens e popula os dados do cupom se precisar da data
        const itens = await ItemCupom.find()
            .populate("estabelecimentoId")
            .sort({ updatedAt: -1 });
            
        return NextResponse.json({ success: true, data: itens });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Erro ao buscar itens" }, { status: 500 });
    }
}