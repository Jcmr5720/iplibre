import { describe, expect, it } from "vitest";
import {
  coefficientOfVariation,
  jitter,
  mean,
  median,
  percentile,
  removeOutliers,
  stabilityLabel,
  stdev,
} from "./stats";

describe("estadística básica", () => {
  it("mean y median", () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([1, 2, 3])).toBe(2);
    expect(mean([])).toBe(0);
  });
  it("stdev", () => {
    expect(stdev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 2);
    expect(stdev([5])).toBe(0);
  });
  it("percentile", () => {
    expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
    expect(percentile([1, 2, 3, 4], 0)).toBe(1);
    expect(percentile([1, 2, 3, 4], 100)).toBe(4);
  });
});

describe("jitter", () => {
  it("es la media de diferencias absolutas consecutivas", () => {
    expect(jitter([10, 12, 11, 13])).toBeCloseTo((2 + 1 + 2) / 3, 5);
    expect(jitter([10])).toBe(0);
  });
});

describe("removeOutliers", () => {
  it("elimina un valor anómalo evidente", () => {
    const data = [20, 21, 19, 20, 22, 500];
    const clean = removeOutliers(data);
    expect(clean).not.toContain(500);
    expect(clean.length).toBe(5);
  });
  it("no filtra con muestras muy pequeñas", () => {
    expect(removeOutliers([1, 100])).toEqual([1, 100]);
  });
  it("mantiene datos homogéneos", () => {
    const data = [10, 10, 10, 10];
    expect(removeOutliers(data)).toEqual(data);
  });
});

describe("estabilidad", () => {
  it("clasifica según jitter", () => {
    expect(stabilityLabel(2)).toBe("excelente");
    expect(stabilityLabel(10)).toBe("buena");
    expect(stabilityLabel(25)).toBe("regular");
    expect(stabilityLabel(80)).toBe("inestable");
  });
  it("coefficientOfVariation", () => {
    expect(coefficientOfVariation([10, 10, 10])).toBe(0);
    expect(coefficientOfVariation([0, 0])).toBe(0);
  });
});
