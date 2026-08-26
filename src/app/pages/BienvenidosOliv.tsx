import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

function BienvenidosOliv() {
  return (
    <div className="bg-[#fcfcfb] min-h-screen font-sans selection:bg-[#1a7d7a] selection:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-6 pt-32 pb-20 text-center">
        <div>
          <h1 className="font-serif text-3xl md:text-5xl text-[#125755]">Bienvenidos a OLIV Cartagena</h1>
          <p className="mt-4 font-sans font-light text-[#125755]/70">Contenido próximamente.</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default BienvenidosOliv;
