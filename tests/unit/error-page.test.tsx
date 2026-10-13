import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import ErrorPage from "@/app/error";

afterEach(() => vi.restoreAllMocks());

function setup() {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  const reset = vi.fn();
  const error = Object.assign(new Error("secret details"), { digest: "abc123" });
  render(<ErrorPage error={error} reset={reset} />);
  return { spy, reset };
}

it("shows generic copy and the request id, never the message", () => {
  setup();
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Something broke on our side.",
  );
  expect(screen.getByText("Request ID: abc123")).toBeInTheDocument();
  expect(screen.queryByText(/secret details/)).not.toBeInTheDocument();
});

it("calls reset when Try again is clicked", () => {
  const { reset } = setup();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(reset).toHaveBeenCalledTimes(1);
});

it("logs once with the digest only", () => {
  const { spy } = setup();
  expect(spy).toHaveBeenCalledTimes(1);
  const [label, payload] = spy.mock.calls[0] ?? [];
  expect(label).toBe("route error");
  expect(payload).toEqual({ digest: "abc123" });
  expect(payload).not.toHaveProperty("message");
});
