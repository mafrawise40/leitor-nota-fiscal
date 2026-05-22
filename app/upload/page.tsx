import UploadCupom from "@/components/UploadCupom";
import { ShoppingBag } from "lucide-react";

export default function UploadPage() {
    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Hero Section */}
            <div className="bg-white border-b mb-8">
                <div className="max-w-6xl mx-auto px-6 py-10 lg:py-16">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-green-600 font-black text-sm uppercase tracking-widest mb-2">
                                <ShoppingBag size={18} />
                                OCR Inteligente
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
                                Upload de <span className="text-green-600">Cupom</span>
                            </h1>
                            <p className="text-gray-500 mt-3 text-lg max-w-xl">
                                Escaneie uma ou várias fotos do seu cupom. Nossa IA separa os itens e organiza por estabelecimento automaticamente.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6">
                <UploadCupom />
            </div>
        </main>
    );
}