import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { HubSpotForm } from "../components/HubSpotForm";

function BienvenidosOliv() {
  return (
    <div className="bg-[#fcfcfb] min-h-screen font-sans selection:bg-[#1a7d7a] selection:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 px-6 pt-32 pb-20">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="font-serif text-3xl md:text-5xl text-[#125755] leading-snug">Bienvenidos a OLIV Cartagena</h1>
            <p className="mt-4 font-sans font-light text-[#125755]/70 max-w-2xl mx-auto leading-relaxed">
              Déjanos tus datos y un asesor se pondrá en contacto contigo.
            </p>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl border border-gray-100">
            <HubSpotForm />
            <p className="mt-4 text-center text-xs text-gray-600 font-sans font-semibold">
              Al enviar aceptas nuestra{" "}
              <a
                href="https://olivcartagena.com/politica-de-tratamiento-de-datos"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#125755] transition-colors"
              >
                política de tratamiento de datos
              </a>{" "}
              y ser contactado por OLIV Cartagena vía WhatsApp.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default BienvenidosOliv;
