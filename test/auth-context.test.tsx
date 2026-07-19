import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/components/landing/auth-context";

function TestButton() {
  const { openAuth, closeAuth, open } = useAuth();
  return (
    <div>
      <span data-testid="state">{open ? "open" : "closed"}</span>
      <button onClick={() => openAuth("login")}>Open</button>
      <button onClick={closeAuth}>Close</button>
    </div>
  );
}

describe("AuthProvider", () => {
  it("provides auth context", () => {
    render(
      <AuthProvider>
        <TestButton />
      </AuthProvider>
    );
    expect(screen.getByTestId("state")).toHaveTextContent("closed");
  });

  it("opens auth modal", () => {
    render(
      <AuthProvider>
        <TestButton />
      </AuthProvider>
    );
    fireEvent.click(screen.getByText("Open"));
    expect(screen.getByTestId("state")).toHaveTextContent("open");
  });
});
