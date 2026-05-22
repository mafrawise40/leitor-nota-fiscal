import mongoose from "mongoose";

const FiltroFavoritoSchema = new mongoose.Schema({
  termo: { type: String, required: true, uppercase: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

export const FiltroFavorito = mongoose.models.FiltroFavorito || mongoose.model("FiltroFavorito", FiltroFavoritoSchema);