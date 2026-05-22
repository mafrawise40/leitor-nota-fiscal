// models/Estabelecimento.ts
import mongoose, { Schema, model, models } from "mongoose";

const EstabelecimentoSchema = new Schema({
  cnpj: { type: String, required: true, unique: true }, // Chave primária real do mercado
  nome: { type: String, required: true },
  nomeCurto: { type: String },
  endereco: { type: String },
  telefone: { type: String }
}, { timestamps: true });

export const Estabelecimento = models.Estabelecimento || model("Estabelecimento", EstabelecimentoSchema);