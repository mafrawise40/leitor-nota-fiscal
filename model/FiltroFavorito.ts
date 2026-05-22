import mongoose from "mongoose";

const FiltroFavoritoSchema = new mongoose.Schema({
  termo: { type: String, required: true, uppercase: true },
  categoria: { type: String, uppercase: true, default: "GERAL" }, // usado para organizar os cards dos filtros favoritos
  createdAt: { type: Date, default: Date.now }
});

export const FiltroFavorito = mongoose.models.FiltroFavorito || mongoose.model("FiltroFavorito", FiltroFavoritoSchema);