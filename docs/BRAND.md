# Biotérmica showcase identity

Source: the owner-supplied logo reference and https://biotermica.osoriogrisaleskevin.workers.dev/ (reviewed in this session).

All showcases use the shared HTML/CSS brand shell rather than their own invented brand. Use the real emblem in `public/brand/biotermica-logo.webp` (downloaded from the company website) beside the BIOTÉRMICA wordmark and “Agua más cálida · Días más felices”. Do not recolour or redraw the emblem. The product cabinet itself remains unbranded as previously requested.

- Navy #073C52 for headings and identity.
- Aqua #009ECB and deeper blue #007C9F for water, navigation and accents.
- Orange #B94700 for primary actions and heat cues.
- White and pale water-blue surfaces for the library and controls. Showcases use deeper blue-green stage backgrounds and light text for contrast.
- Website font stack: Avenir Next, Avenir, Segoe UI, sans-serif. The lockup uses a bold serif wordmark treatment matching the supplied reference.
- Spanish showcase copy: clear, welcoming, focused on warm water, pools, wellbeing and time to enjoy it. Explain the process without inventing numerical efficiency, temperature, or performance claims.

`src/brand/theme.ts` holds the 3D palette. Shared CSS tokens and brand shell are in `src/style.css` / `index.html`. Scene captions are registered in the catalog. Maintain a clean, readable presentation; avoid unrelated purple/copper film palettes. Keep captions clear of the flow paths.

Air uses 360 small, soft particles per air stage (four-point trails). Water uses a glossy continuous tube surface and moving instanced droplets; it must not reuse the air sprites. The hot outlet curves downward and the cold inlet is straight. Flow colours illustrate temperature and direction; this is not a fluid simulation.

### Showcase contrast
Use muted deep blue-green stage backgrounds (`stage`, `stageCool`, `stageWarm` in the shared theme), with light headings and pale cyan accents. Keep logo and captions directly on the scene without background cards. Product lighting remains independent of the backdrop so charcoal panels and water retain visible highlights. Air trails use warm amber and icy cyan for contrast.
