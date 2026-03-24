import { useState, useEffect } from "react";
import { Joyride, STATUS } from "react-joyride";
import type { Step, EventData } from "react-joyride";

const TOUR_STEPS: Step[] = [
  {
    target: ".tour-all-schedules-grid",
    content: (
      <div>
        <h3 className="font-black text-xl mb-2 uppercase border-b-2 border-black inline-block">
          ¡Oculta lo que no quieras!
        </h3>
        <p className="font-bold text-sm leading-snug">
          Aquí puedes ver todos los horarios disponibles a la vez. Si hay una clase en un horario que detestas o con un docente que prefieres evitar, <strong>simplemente hazle clic encima</strong>. <br /><br />
          Se atenuará y quedará descartada para el generador. ¡Así de fácil!
        </p>
      </div>
    ),
    placement: "center",
  },
];

export function AllSchedulesTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Check if the user has seen the all schedules tour already
    const hasSeenTour = localStorage.getItem("unsa_scheduler_all_schedules_tour_seen");
    if (!hasSeenTour) {
      // Small delay to ensure grid is rendered
      setTimeout(() => setRun(true), 500);
    }
  }, []);

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem("unsa_scheduler_all_schedules_tour_seen", "true");
    }
  };

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous
      scrollToFirstStep={false}
      onEvent={handleJoyrideCallback}
      options={{
        arrowColor: "#fff",
        backgroundColor: "#fff",
        overlayColor: "rgba(0, 0, 0, 0.4)",
        primaryColor: "#00E676", // Neo-brutalist green
        textColor: "#111",
        zIndex: 1000,
        showProgress: false,
        buttons: ["close", "primary"],
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
        buttonClose: {
          color: "#111",
        },
      }}
      locale={{
        close: "Cerrar",
        last: "¡Entendido!",
      }}
    />
  );
}
