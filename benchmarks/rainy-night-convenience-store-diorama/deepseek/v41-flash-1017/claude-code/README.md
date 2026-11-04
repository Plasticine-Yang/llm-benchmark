# 雨夜のコンビニ — Rainy Night Convenience Store Diorama

A self-contained, interactive Three.js miniature diorama of a Japanese convenience
store on a rainy night. No Blender, no build step, no UI overlays — just the model.

## Run

From this directory:

```bash
python3 -m http.server 8123
```

Then open <http://127.0.0.1:8123/>.

## Controls

- **Drag** — orbit around the diorama
- **Wheel / pinch** — zoom in and out
- Idle for a few seconds and the view drifts slowly on its own

## What is in the scene

- A complete square display base with layered plinth, rim light and engraved plaque
- Corner convenience store with glass front and side, canopy, sliding automatic doors,
  lightbox signage, vertical corner sign, awning drips and wet reflections
- Detailed interior: drink cooler with backlit bottles, gondola shelves, endcaps,
  onigiri case, magazine rack, bento corner, register, coffee machine, oden warmer,
  hot-snack case, hanging banners, posters, floor guides, lockers and staff door
- Street corner: crosswalk, curbs, gutter grates, manhole, puddles, parking bay,
  guardrails, street lamps, utility poles and sagging wires, traffic signal,
  pedestrian signal, convex mirror, notice board, vending machines, bicycle,
  bins, umbrella stand, AC units and a small alley
- Weather and motion: continuous rain, splash rings, puddle ripples, canopy drips,
  rain running down the glass, flickering store sign, cycling traffic lights,
  automatic doors, steam above the oden counter and shimmering wet reflections

## Technical notes

- Three.js is vendored in `vendor/three.module.js`; there are no CDN or network requests
- Toon shading uses stepped gradient maps; silhouettes use inverted-hull outlines
- All textures (signs, posters, magazines, vending fronts, asphalt, tiles) are
  generated at runtime with the Canvas 2D API
- No external assets, no framework, no bundler
