import { useState, useEffect } from "react";
import { Joyride, STATUS } from "react-joyride";
import type { Step, EventData } from "react-joyride";

const TOUR_STEPS: Step[] = [
  {
    target: ".tour-header",
    content: (
      <div>
        <h3 className="font-black text-xl mb-2 uppercase border-b-2 border-black inline-block">
          ¡Bienvenido a tu Scheduler!
        </h3>
        <p className="font-bold text-sm leading-snug">
          Esta es la herramienta definitiva para armar tu horario universitario sin dolor.
          Te daré un recorrido rápido para que le saques el máximo provecho. ¡Vamos!
        </p>
      </div>
    ),
    skipBeacon: true,
    placement: "bottom",
  },
  {
    target: ".tour-tabs",
    content: (
      <div>
        <h3 className="font-black text-xl mb-2 uppercase border-b-2 border-black inline-block">
          Navegación
        </h3>
        <p className="font-bold text-sm leading-snug">
          Tienes tres vistas principales:<br/><br/>
          🔹 <strong>Generador:</strong> Crea combinaciones perfectas al instante.<br/>
          🔹 <strong>Todos los horarios:</strong> Mira todas las secciones disponibles a la vez y haz clic en ellas para ocultarlas.<br/>
          🔹 <strong>Social:</strong> Comparte y compara horarios con tus amigos.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: ".tour-filters",
    content: (
      <div>
        <h3 className="font-black text-xl mb-2 uppercase border-b-2 border-black inline-block">
          Filtros Inteligentes
        </h3>
        <p className="font-bold text-sm leading-snug">
          ¿Quieres salir temprano o tener los viernes libres? 
          Selecciona tus días libres deseados y restringe tu rango horario. 
          Además, puedes ordenar las opciones para ver primero horarios compactos o de solo mañanas/tardes.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: ".tour-course-list",
    content: (
      <div>
        <h3 className="font-black text-xl mb-2 uppercase border-b-2 border-black inline-block">
          Administra tus Cursos
        </h3>
        <p className="font-bold text-sm leading-snug mb-2">
          Aquí puedes ver todos los cursos de tu malla.
        </p>
        <ul className="text-sm font-bold border-l-2 border-black pl-2 space-y-1">
          <li>• Desmarca un curso entero si <strong>ya lo tomaste</strong> o no lo llevarás.</li>
          <li>• Despliega un curso y desmarca secciones individuales (ej. Grupo "A") si <strong>ya se llenaron</strong> o no te agradan.</li>
        </ul>
        <p className="font-bold text-sm mt-2 text-gray-600">
          *El generador ignorará automáticamente lo que desmarques aquí.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: ".tour-generator-results",
    content: (
      <div>
        <h3 className="font-black text-xl mb-2 uppercase border-b-2 border-black inline-block">
          Explora tus Opciones
        </h3>
        <p className="font-bold text-sm leading-snug">
          Aquí verás los horarios autogenerados que cumplen con tus filtros y grupos seleccionados. 
          ¡Usa las flechas azules de arriba para navegar entre ellos!<br/><br/>
          Si dice <strong>"Cruces o Sin Opciones"</strong>, relaja tus filtros o habilita más grupos en la barra lateral.
        </p>
      </div>
    ),
    placement: "left",
  },
];

export function AppTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Check if the user has seen the tour already
    const hasSeenTour = localStorage.getItem("unsa_scheduler_tour_seen");
    if (!hasSeenTour) {
      setRun(true);
    }
  }, []);

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem("unsa_scheduler_tour_seen", "true");
    }
  };

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={handleJoyrideCallback}
      options={{
        arrowColor: "#fff",
        backgroundColor: "#fff",
        overlayColor: "rgba(0, 0, 0, 0.4)",
        primaryColor: "#00E676", // Neo-brutalist green
        textColor: "#111",
        zIndex: 1000,
        showProgress: true,
        buttons: ["back", "primary", "skip", "close"],
      }}
      styles={{
        tooltip: {
          border: "4px solid #111",
          borderRadius: "0",
          boxShadow: "6px 6px 0px #111",
          fontFamily: "monospace",
          padding: "1rem",
        },
        buttonPrimary: {
          border: "2px solid #111",
          borderRadius: "0",
          boxShadow: "2px 2px 0px #111",
          fontFamily: "monospace",
          fontWeight: "900",
          textTransform: "uppercase",
          padding: "0.5rem 1rem",
          color: "#111",
          backgroundColor: "#00E676",
        },
        buttonBack: {
          border: "2px solid #111",
          borderRadius: "0",
          boxShadow: "2px 2px 0px #111",
          fontFamily: "monospace",
          fontWeight: "900",
          marginRight: "0.5rem",
          textTransform: "uppercase",
          padding: "0.5rem 1rem",
          color: "#111",
          backgroundColor: "#fff",
        },
        buttonSkip: {
          color: "#FF3366",
          fontFamily: "monospace",
          fontWeight: "900",
          textTransform: "uppercase",
        },
      }}
      locale={{
        back: "Atrás",
        close: "Cerrar",
        last: "¡Terminar!",
        next: "Siguiente",
        skip: "Saltar",
      }}
    />
  );
}
