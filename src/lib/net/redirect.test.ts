import { describe, it, expect } from "vitest";
import { canonicalForLoop, isLoop, isRedirectStatus, redirectType } from "@/lib/net/redirect";

describe("redirectType", () => {
  it("clasifica permanentes y temporales", () => {
    expect(redirectType(301).kind).toBe("permanent");
    expect(redirectType(308).kind).toBe("permanent");
    expect(redirectType(302).kind).toBe("temporary");
    expect(redirectType(307).kind).toBe("temporary");
    expect(redirectType(303).kind).toBe("temporary");
    expect(redirectType(399).kind).toBe("other");
  });
});

describe("isRedirectStatus", () => {
  it("reconoce 3xx", () => {
    expect(isRedirectStatus(301)).toBe(true);
    expect(isRedirectStatus(200)).toBe(false);
    expect(isRedirectStatus(404)).toBe(false);
  });
});

describe("canonicalForLoop", () => {
  it("ignora el fragmento y la barra final", () => {
    expect(canonicalForLoop("https://a.com/x/#top")).toBe("https://a.com/x");
    expect(canonicalForLoop("https://a.com/")).toBe("https://a.com/");
  });

  it("conserva la query", () => {
    expect(canonicalForLoop("https://a.com/x?y=1")).toContain("y=1");
  });
});

describe("isLoop", () => {
  it("detecta una URL ya visitada", () => {
    const visited = [canonicalForLoop("https://a.com/1"), canonicalForLoop("https://a.com/2")];
    expect(isLoop(visited, "https://a.com/1#frag")).toBe(true);
    expect(isLoop(visited, "https://a.com/3")).toBe(false);
  });
});
