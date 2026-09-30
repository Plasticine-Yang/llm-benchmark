Immersive Product Website: NOCTURNE ONE Spatial Audio Headphones

Your Task

Design and implement a working premium consumer electronics website directly in the current project. The product is NOCTURNE ONE, a flagship pair of over-ear headphones featuring spatial audio, transparent acoustic chambers, and 42-hour battery life.

This is not a standard SaaS landing page. The result should feel like a carefully choreographed digital product launch: visually striking at first glance, then revealing the product layer by layer as the user scrolls. Do not ask for design preferences. Make distinctive, cohesive, high-end design decisions and implement them.

Visual Direction

- Use a palette of deep graphite, ice silver, and a single muted amber accent. Avoid pure black, purple-blue neon, and rainbow gradients.
- Aim for the feel of “a precision acoustic instrument in a dark room”: restrained, sharp, and expensive, without a gaming aesthetic.
- Use Liquid Glass with convincing material depth: translucent layers, a sense of background refraction, highlights within 1 px, subtle inner shadows, variable edge brightness, and depth of field. A white translucent layer with backdrop-blur alone is insufficient.
- Make the first screen an asymmetric split layout: concise, forceful Chinese copy and CTAs on the left; a visually dominant headphone installation on the right. Build the product with CSS, SVG, or Canvas if needed, without relying on fragile external images.
- Use Geist, Satoshi, Outfit, or another modern industrial sans-serif font, with sensible Chinese fallbacks. Do not use Inter or emoji.
- Subtle dark-area grain, soft volumetric light, and slight chromatic dispersion are welcome. Avoid cheap outer glows and a screen full of glass cards.
  
Page Content

Implement all of the following without falling into a generic “hero + three feature cards + CTA” structure:

1. Floating glass navigation: Brand, Sound, Structure, Specifications, and Purchase. Its material and size should change subtly after scrolling.
2. Launch scene above the fold:
  - Heading: 听见空间，而不只是声音。
  - Supporting copy: NOCTURNE ONE 以透明双腔体、个性化 HRTF 与 42 小时续航，重新定义私人声场。
  - Primary button: 预约试听
  - Secondary button: 观看 90 秒设计故事
  - The product installation on the right should feature slow levitation, a passing light sweep, foreground/background depth, and glass HUD elements displaying 42h, Spatial Engine, and 38 mm.
3. Soundstage section: Create an interactive circular soundstage or waveform visualization. Sound waves and spatial direction should respond subtly to pointer movement.
4. Structure section: Use an offset layout or sticky scrolling to progressively separate the earcups, acoustic chambers, and headband, accompanied by concise copy.
5. Color selector: Offer Obsidian, Mist Silver, and Burnt Amber. Switching options should smoothly transition the product color and ambient lighting without reloading the page.
6. Specifications and purchase: Present the details in a refined technical layout: weight 312 g, Bluetooth 5.4, battery life 42 h, fast charging 10 min / 6 h, and launch price ¥3,499.
7. Footer: Make it feel like the back cover of a brand publication, rather than a conventional four-column link footer.
  
Keep the specified Chinese UI copy in Chinese.

Interaction and Motion

- On first visit, play a complete choreographed entrance: navigation, copy, product, and HUD should appear in sequence.
- Give the primary CTA a restrained magnetic-follow or directional hover effect. Do not use React state to drive pointer animation on every frame.
- Limit scroll animation to transform and opacity. Avoid high-frequency calculations in native scroll listeners.
- Implement hover, active, focus-visible, and disabled states for every button. Clicking 预约试听 should open a glass reservation panel that appears to expand naturally from the button. Include a minimal form flow that users can close and submit.
- The form must support default, submitting, success, and validation-error states. Do not make it a static success screen.
- Support prefers-reduced-motion and full keyboard operation.
  
Engineering Constraints

- Use React and TypeScript. Reuse the project’s existing stack where possible. Inspect package.json before installing missing dependencies; do not assume Framer Motion or an icon library is already available.
- Use icons only from @phosphor-icons/react, @radix-ui/react-icons, or simple custom SVGs, and keep their style consistent.
- Split the implementation into clear components. Isolate continuously animated components so they do not cause the entire page to rerender.
- Complete the design for desktop, tablet, and mobile. Use min-h-[100dvh] for the first screen. Below 768px, use a stable single-column layout with no horizontal scrolling.
- Do not use Unsplash. Leave no placeholders, TODOs, pseudocode, or primary buttons that cannot be clicked.
  
Definition of Done

Deliver a page that runs directly, rather than a design description or screenshot. It must be visually impressive, have convincing glass materials, use motion with a clear hierarchy, contain meaningful content, provide complete interaction flows, work reliably on mobile, and avoid the look of a default component-library template.
