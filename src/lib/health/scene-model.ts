export const shapes = ["box", "sphere", "cylinder", "cone", "torus"] as const;
export type Sketch = { title: string; description: string; objects: { shape: typeof shapes[number]; color: string; position: number[]; rotation: number[]; scale: number[] }[] };
const vector = { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3 };
export const sketchSchema = {
  type: "object", additionalProperties: false, required: ["title", "description", "objects"],
  properties: {
    title: { type: "string" }, description: { type: "string" },
    objects: { type: "array", minItems: 1, maxItems: 24, items: {
      type: "object", additionalProperties: false, required: ["shape", "color", "position", "rotation", "scale"],
      properties: { shape: { type: "string", enum: [...shapes] }, color: { type: "string" }, position: vector, rotation: vector, scale: vector },
    } },
  },
};
export function validateSketch(value: unknown): Sketch {
  const fail = () => { throw new Error("Invalid sketch geometry."); };
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail();
  const s = value as Sketch;
  if (Object.keys(s).sort().join() !== "description,objects,title" || typeof s.title !== "string" || !s.title.trim() || s.title.length > 100 || typeof s.description !== "string" || s.description.length > 600 || !Array.isArray(s.objects) || s.objects.length < 1 || s.objects.length > 24) return fail();
  for (const o of s.objects) {
    if (!o || Object.keys(o).sort().join() !== "color,position,rotation,scale,shape" || !shapes.includes(o.shape) || typeof o.color !== "string" || !/^#[0-9a-f]{6}$/i.test(o.color)) return fail();
    for (const key of ["position", "rotation", "scale"] as const) {
      if (!Array.isArray(o[key]) || o[key].length !== 3 || o[key].some(n => typeof n !== "number" || !Number.isFinite(n) || Math.abs(n) > 10 || (key === "scale" && n < 0.05))) return fail();
    }
  }
  return structuredClone(s);
}
export const exampleSketch: Sketch = {
  title: "A little balance", description: "An example sculpture. Make it your own with a description.",
  objects: [
    { shape: "cylinder", color: "#3c6555", position: [0,-1,0], rotation: [0,0,0], scale: [2,0.3,2] },
    { shape: "sphere", color: "#dbecaa", position: [0,-0.2,0], rotation: [0,0,0], scale: [1.1,1.1,1.1] },
    { shape: "torus", color: "#c59c78", position: [0,0.8,0], rotation: [0.4,0.3,0], scale: [1,1,1] },
    { shape: "sphere", color: "#eee7d8", position: [0,1.65,0], rotation: [0,0,0], scale: [0.45,0.45,0.45] },
  ],
};
