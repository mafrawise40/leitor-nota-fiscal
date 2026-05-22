import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { FiltroFavorito } from "@/model/FiltroFavorito";

export async function GET() {
    try {
        await connectDB();
        // Busca todos os filtros e ordena por categoria, depois por termo
        const filtros = await FiltroFavorito.find().sort({ categoria: 1, termo: 1 });
        return NextResponse.json({ success: true, data: filtros });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const { termo, categoria } = await req.json();

        const termoUpper = termo.toUpperCase().trim();
        const categoriaUpper = (categoria || "GERAL").toUpperCase().trim();

        // CRIA UM NOVO SEMPRE (Permite repetições)
        const novoFiltro = await FiltroFavorito.create({
            termo: termoUpper,
            categoria: categoriaUpper
        });

        return NextResponse.json({ success: true, data: novoFiltro });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { id, categoria } = body;

        console.log("Solicitação de DELETE:", body);

        // SE MANDOU CATEGORIA, APAGA TUDO QUE TIVER ESSE NOME (SEM FREIO)
        if (categoria) {
            const nomeCat = categoria.toUpperCase().trim();

            // Usamos um Regex 'i' para ignorar se é maiúsculo ou minúsculo no banco
            const res = await FiltroFavorito.deleteMany({
                categoria: { $regex: new RegExp(`^${nomeCat}$`, 'i') }
            });

            console.log(`Limpando categoria: ${nomeCat}. Removidos: ${res.deletedCount}`);
            return NextResponse.json({ success: true, deletedCount: res.deletedCount });
        }

        // SE MANDOU ID, APAGA SÓ O ITEM ESPECÍFICO
        if (id) {
            const res = await FiltroFavorito.deleteOne({ _id: id });
            console.log(`Item deletado. ID: ${id}`);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: "Faltou ID ou Categoria" }, { status: 400 });
    } catch (err: any) {
        console.error("ERRO NO DELETE:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}