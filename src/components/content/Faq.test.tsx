import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Faq } from "./Faq";
import { DataList } from "@/components/tools/DataList";

describe("Faq", () => {
  it("renderiza preguntas y respuestas de forma accesible", () => {
    render(<Faq items={[{ q: "¿Pregunta?", a: "Respuesta." }]} />);
    // <summary> es el nombre accesible del <details>
    expect(screen.getByText("¿Pregunta?")).toBeInTheDocument();
    expect(screen.getByText("Respuesta.")).toBeInTheDocument();
  });
});

describe("DataList", () => {
  it("omite filas sin valor y muestra las que tienen", () => {
    render(
      <DataList
        rows={[
          { label: "Con valor", value: "dato" },
          { label: "Sin valor", value: undefined },
        ]}
      />,
    );
    expect(screen.getByText("Con valor")).toBeInTheDocument();
    expect(screen.queryByText("Sin valor")).not.toBeInTheDocument();
  });
});
