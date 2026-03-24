import { useState } from "react";

export function SocialView() {
  const [messages] = useState([
    {
      id: 1,
      name: "Cachimbo Ansioso",
      msg: "¡Gracias mano! Me salvaste de cruzar Progra con Conta.",
      color: "bg-[#00E676]",
    },
    {
      id: 2,
      name: "Estudiante a Punto de Egreso",
      msg: "Toma para tu café, excelente app.",
      color: "bg-[#00E5FF]",
    },
    {
      id: 3,
      name: "Delegada",
      msg: "Lo compartí con toda mi base, te pasaste 👍",
      color: "bg-[#FFEA00]",
    },
    {
      id: 4,
      name: "Anónimo",
      msg: "Si paso este semestre gracias a tu horario, te invito unas chelas. 🙏",
      color: "bg-[#D500F9]",
    },
    {
      id: 5,
      name: "Ing. de Sistemas",
      msg: "Buen manejo de algoritmos, mis respetos rey. 🤖",
      color: "bg-[#FF3366]",
    },
  ]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-8 font-mono flex-1 min-h-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Columna Izquierda: QR y WhatsApp */}
      <aside className="w-full lg:w-80 shrink-0 flex flex-col min-h-0 gap-3 md:gap-4 justify-between h-full">
        {/* Call to action */}
        <div className="bg-[#FF3366] text-white border-4 border-black p-4 neo-brutalist shadow-[4px_4px_0px_#111] flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
          <h2 className="text-2xl font-black uppercase mb-1 rotate-[-2deg] bg-black inline-block px-3 py-1 shadow-[2px_2px_0px_rgba(255,255,255,1)]">
            Tengo Hambre
          </h2>
          <p className="mt-1 font-bold text-sm tracking-wide">
            Apoya el proyecto, claude no es gratis :'v
          </p>
        </div>

        {/* QR Section */}
        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#111] text-center flex flex-col items-center shrink-0 flex-2">
          <h3 className="font-black uppercase text-xl mb-3 border-b-4 border-black inline-block bg-[#00E5FF] px-2">
            Yapea aquí
          </h3>
          <div className="w-full max-w-[220px] aspect-square border-4 border-black bg-gray-200 flex items-center justify-center shadow-[4px_4px_0px_#111] overflow-hidden p-2">
            <img
              src="/yape.png"
              alt="QR Yape"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="font-bold text-gray-500 absolute -z-10">
              [QR de Yape]
            </span>
          </div>
        </div>

        {/* Botón WhatsApp */}
        <a
          href="https://wa.me/+51943606092"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#00E676] hover:bg-[#00C853] text-black border-4 border-black p-3 neo-brutalist shadow-[4px_4px_0px_#111] text-center flex flex-col items-center gap-1 transition-transform hover:-translate-y-1 active:translate-y-0 shrink-0"
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
          <span className="font-black uppercase text-base md:text-lg">
            ¿Encontraste un bug?
          </span>
          <span className="text-xs font-bold bg-white px-2 border-2 border-black">
            Escríbeme por WhatsApp
          </span>
        </a>
      </aside>

      {/* Columna Derecha: Panel de Mensajes */}
      <main className="flex-1 min-w-0 flex flex-col min-h-0 gap-4">
        <div className="bg-white border-4 border-black p-4 md:p-6 relative shadow-[8px_8px_0px_#111] flex flex-col flex-1 min-h-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0 border-b-4 border-black pb-4">
            <h3 className="text-xl md:text-3xl font-black uppercase bg-black text-white inline-block px-4 py-2 rotate-[1deg]">
              CONFESIONES & DONADORES 🏆
            </h3>
            <span className="font-bold text-sm bg-[#FF9100] text-black border-2 border-black px-3 py-2 shadow-[2px_2px_0px_#111] -rotate-1">
              Deja tu mensaje
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-4 border-4 border-black shadow-[4px_4px_0px_#111] ${m.color}`}
              >
                <h4 className="font-black text-lg bg-white px-2 mb-2 inline-block border-2 border-black">
                  {m.name}
                </h4>
                <p className="font-bold text-black text-base leading-snug">
                  "{m.msg}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
