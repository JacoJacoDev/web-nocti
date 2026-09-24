---
trigger: model_decision
description: Apple-inspired web UI: fluid motion, gestures, spring animations, drag/swipe/sheets, momentum, interruptible transitions, translucent materials, depth, typography, reduced motion, feedback, spatial consistency and restraint.
---

## Initial Response

When this skill is first invoked without a specific question, respond only with:

> I'm ready to help you build fluid, Apple-style interfaces on the web, my knowledge comes from Apple's WWDC design talks, translated for the web.

Do not provide other information until the user asks a question.

# Apple-Style Fluid Web Interfaces

Knowledge distilled from Apple's WWDC design talks, especially *Designing Fluid Interfaces* (WWDC 2018), translated to CSS, Pointer Events, `requestAnimationFrame`, and Motion/Framer Motion.

**Core principle:** Interfaces feel alive when motion starts from the current visual value, inherits user velocity, projects momentum, and can be grabbed/reversed at any moment. Springs are ideal because they are interruptible and velocity-aware.

Apple's design goals center on **safety/predictability, understanding, achievement, and joy.**

## 1. Response

Latency destroys directness.

* Respond on **pointer-down**, not release.
* Eliminate unnecessary debounce, timers, transition waits, and input delays.
* Feedback must be continuous during interaction.
* Dragging, sliders, and drawers should track the pointer 1:1.

```css
.button:active {
  transform: scale(0.97);
  transition: transform 100ms ease-out;
}
```

## 2. Direct Manipulation

> “Touch and content should move together.”

Dragged content must remain attached to the pointer and preserve the exact grab offset.

* Use Pointer Events + `setPointerCapture`.
* Track recent position/time samples for release velocity.
* Never snap an element to its center when grabbed.

```js
el.addEventListener('pointerdown', (e) => {
  el.setPointerCapture(e.pointerId);
  const grabOffset =
    e.clientY - el.getBoundingClientRect().top;
  // Track position/time for velocity
});
```

## 3. Interruptibility

**Every animation must be interruptible.**

* Never lock input during transitions.
* Animate from the **current presentation value**, not the logical target.
* On interruption, read the live transform and continue from it.
* Avoid CSS transitions/keyframes for gesture-driven motion; use springs.
* Preserve velocity when reversing instead of creating a sudden stop.
* Use independent X/Y springs when their velocities differ.

A closing sheet grabbed again must immediately follow the finger.

## 4. Springs Over Fixed Animation

Fixed-duration animations cannot naturally react to new input. Springs can.

Think in:

* **Damping:** controls bounce. `1.0` = critically damped/no overshoot; `<1.0` = increasingly bouncy.
* **Response:** how quickly the spring reaches its target. Lower = faster. It is not a fixed duration.

**Defaults:**

* General UI: damping `1.0`.
* Momentum-driven gestures: ~`0.8`.

Apple examples:

| Interaction     | Damping | Response |
| --------------- | ------: | -------: |
| Move/reposition |   `1.0` |    `0.4` |
| Rotation        |   `0.8` |    `0.4` |
| Drawer/sheet    |   `0.8` |    `0.3` |

Motion/Framer Motion can approximate this with `bounce` + `duration`:

```js
animate(el, { y: 0 }, {
  type: 'spring',
  bounce: 0,
  duration: 0.4
});

animate(el, { y: target }, {
  type: 'spring',
  bounce: 0.2,
  duration: 0.4
});
```

## 5. Velocity Handoff

When a gesture ends, the spring must continue with the finger's release velocity. This removes the visible seam between dragging and animation.

If normalized velocity is required:

```text
relativeVelocity = gestureVelocity / (targetValue - currentValue)
```

Motion/Framer Motion generally accepts raw velocity directly.

## 6. Momentum Projection

Do not simply snap from the release point. Project where the gesture is heading, then choose the nearest snap point.

```js
function project(v, d = 0.998) {
  return (v / 1000) * d / (1 - d);
}

const projected = currentPosition + project(releaseVelocity);
const target = nearestSnapPoint(projected);

animateSpringTo(target, { velocity: releaseVelocity });
```

Use `d ≈ 0.998` for normal scrolling and `0.99` for snappier behavior. Use this exponential-decay model rather than `v²/(2·decel)` when reproducing Apple's behavior.

## 7. Spatial Consistency

* Enter and exit through the **same spatial path**.
* Anchor menus, popovers, and sheets to their trigger with `transform-origin`.
* Mirror easing for reversible transitions.

If something enters from the right, it should normally leave toward the right.

## 8. Gesture Direction

Intermediate motion should communicate the destination. Motion should visually point toward the final state rather than merely interpolate between positions.

## 9. Rubber-Banding

Boundaries should resist progressively rather than stop abruptly.

```js
function rubberband(overshoot, dimension, c = 0.55) {
  return (overshoot * dimension * c) /
    (dimension + c * Math.abs(overshoot));
}
```

## 10. Gesture Checklist

**Tap**

* Highlight on touch-down.
* Commit on touch-up.
* ~10px hysteresis/hit padding.
* Allow cancellation by dragging away/back.

**Drag/swipe**

* Use a small movement threshold (~10px).
* Track continuously 1:1 after intent is clear.

**Recognition**

* Detect plausible gestures from the first movement.
* Cancel losing gestures once intent is clear.
* Avoid final-state-only events such as `swipeleft`.
* Minimize disambiguation delays.

## 11. Frame-Level Smoothness

Smoothness depends on frame content, not just FPS.

* Keep positional changes small enough to avoid strobing.
* Use subtle blur/stretch for very fast movement when useful.
* Use `requestAnimationFrame`.
* Prefer compositor-friendly `transform` and `opacity`.
* Use `will-change` when motion is imminent.

## 12. Materials & Depth

Translucent materials create hierarchy without stealing focus. On the web, use `backdrop-filter`.

* Navbars, toolbars, and sheets can be translucent with content scrolling underneath.
* Darker/heavier materials suit structural regions; lighter materials suit interactive elements.
* Avoid stacking light translucent surfaces.
* Larger surfaces should have stronger blur/deeper shadows.
* Modal surfaces use a scrim; non-blocking panels can use translucency/offset without one.
* Increase text contrast/weight over translucent surfaces.
* Prefer edge blur/gradients over hard dividers where floating UI overlaps content.
* Animate blur + scale when material appears rather than only fading opacity.

```css
.toolbar {
  background: rgba(255,255,255,.6);
  backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid rgba(255,255,255,.4);
}
```

## 13. Multimodal Feedback

When combining visual, sound, and haptic feedback:

1. **Causality:** feedback must correspond to the actual event.
2. **Harmony:** all modalities should occur together.
3. **Utility:** reserve feedback for meaningful moments such as success, error, commit, and snap.

Avoid excessive feedback.

## 14. Accessibility & Reduced Motion

Reduced motion means **gentler equivalent feedback**, not no feedback.

* `prefers-reduced-motion: reduce`: replace slides/springs/parallax with short fades/static transitions; remove overshoot.
* `prefers-reduced-transparency: reduce`: increase opacity and remove/reduce blur.
* `prefers-contrast: more`: use near-solid backgrounds and clear borders.
* Avoid full-screen moving backgrounds, slow looping motion, and abrupt brightness changes.

```css
@media (prefers-reduced-motion: reduce) {
  .sheet {
    transition: opacity 200ms ease;
    transform: none !important;
  }
}

@media (prefers-reduced-transparency: reduce) {
  .toolbar {
    background: white;
    backdrop-filter: none;
  }
}
```

## 15. Typography

From *The Details of UI Typography* (WWDC 2020):

* Tracking is **size-specific**: large text generally needs negative tracking; small text may need slightly positive tracking.
* Leading should generally be tighter for large headings and more generous for body text.
* Build hierarchy from weight + size + leading.
* Respect user text-size settings; use `rem`/`em` where possible.
* Prefer the system font unless there is a clear reason to use another.

```css
:root {
  font: 100%/1.5 system-ui, sans-serif;
}

.display {
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  font-optical-sizing: auto;
}
```

## 16. Eight Design Principles

**1. Purpose** — Build intentionally. Every feature consumes time, attention, and trust.

**2. Agency** — Keep users in control. Provide choices and easy undo. Confirm only genuinely destructive actions.

**3. Responsibility** — Act in the user's interest. Request only necessary information, explain why, anticipate risks, especially with AI, and remove features whose risks outweigh their value.

**4. Familiarity** — Build on known patterns and metaphors. Consistent appearance, behavior, and placement improve predictability. Break conventions only when validated.

**5. Flexibility** — Adapt to devices, contexts, abilities, languages, and expertise. Allow personalization when necessary.

**6. Simplicity, not minimalism** — Remove unnecessary complexity while preserving useful context. Use plain language, hierarchy, clear spacing/contrast, and progressive disclosure. Show common paths first.

**7. Craft** — Every spacing, timing, color, alignment, and animation should be deliberate. Avoid jitter, misalignment, and fragile responsive layouts. Quality details build trust.

**8. Delight** — The result of getting the other principles right, not decorative effects added afterward. Reinforce the intended emotion consistently.

### Supporting Rules

**Feedback:** status, completion, warning, error. Confirm meaningful actions, expose ongoing status, warn before problems, validate inline.

**Wayfinding:** every screen should answer: Where am I? Where can I go? What's there? How do I leave?

**Grouping/mapping:** proximity implies relationship. Put controls near what they affect and arrange them according to their effects.

**Labels:** prefer specific labels such as “Progress” or “Library” over vague labels such as “Home” when appropriate.

## 17. Process

* Prototype interactions, not only static screens. Interactive prototypes reveal behavior and establish a quality bar.
* Design motion and visuals together; they should feel like one system.
* Test with real users in real contexts.
* Review motion slowly/frame-by-frame to catch issues invisible at normal speed.

# Quick Reference

| Need                  | Technique                              |
| --------------------- | -------------------------------------- |
| Default spring        | Damping `1.0`, response `0.3–0.4`      |
| Momentum spring       | Damping ~`0.8`, response `0.3–0.4`     |
| Gesture → spring      | Pass release velocity                  |
| Flick landing         | Project momentum, `d ≈ 0.998`          |
| Interrupt             | Start from live presentation value     |
| Smooth reversal       | Carry velocity through re-targeting    |
| Reversible transition | Mirror easing                          |
| Reverse/commit        | Use velocity sign                      |
| 1:1 drag              | Pointer Events + capture + grab offset |
| Feedback              | Pointer-down + continuous              |
| Boundary              | Rubber-band                            |
| Translucent UI        | `backdrop-filter`                      |
| Typography            | Size-specific tracking                 |
| Reduced motion        | Cross-fade instead of slide/spring     |

**Overall:** prioritize immediate response, direct manipulation, interruptible springs, velocity continuity, momentum, spatial consistency, accessibility, material hierarchy, intentional typography, and purposeful simplicity. Reproduce the underlying physical and human principles—not merely Apple's visual style.
