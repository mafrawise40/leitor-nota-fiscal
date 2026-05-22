import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { FiltroFavorito } from "@/model/FiltroFavorito";

export async function GET() {
  await connectDB();
  const filtros = await FiltroFavorito.find().sort({ termo: 1 });
  return NextResponse.json({ success: true, data: filtros });
}

export async function POST(req: Request) {
  await connectDB();
  const { termo } = await req.json();
  const novo = await FiltroFavorito.create({ termo: termo.toUpperCase() });
  return NextResponse.json({ success: true, data: novo });
}

export async function DELETE(req: Request) {
  await connectDB();
  const { termo } = await req.json();
  await FiltroFavorito.deleteOne({ termo });
  return NextResponse.json({ success: true });
}