Bosh Builder
============

Source code and generated output for animated sprites for linerider.com, as reference for implementations of animated sprite renderers. At some point, this will have automation and resources for creating custom sprites.

Relevant files:

- `bosh-generator.svg`: For developing sprite sheets. Click on the background to see the animation in action. Click on the text to generate the output sprite sheet.
- `generateBoundingBoxes.js`: Automatically generate the bounding boxes for each sprite, and cleans up the generator svg for production. Notice the usage of the `lr-bbox` attribute to manually adjust bounding boxes to include stroke widths.
- `bosh-sprite.svg`: Produced by `bosh-generator.svg` & `generateBoundingBoxes.js`, the sprite sheet used in production.
- `spriteSheetMappings.js`: Parses a sprite sheet into JSON for JS animated sprite renderer implementations. **This is the de facto spec for animated sprite sheets.**
- `bosh-sprite-mapping.json`: Produced by `bosh-sprite.svg` & `spriteSheetMappings.js`, the sprite sheet mapping in the form of JSON. You can use this instead of `spriteSheetMappings.js` if you want to render only `bosh-sprite.svg`.
