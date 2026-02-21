# Gus Must Eat v2 - Issue Tracker

## Open

### #1 - Sprite movement feels weird
- **Priority:** Medium
- **Category:** Polish / UX
- **Description:** Player character movement on the isometric grid feels off. Likely causes:
  - Single-frame sprites (no walk animation) - character slides rather than walks
  - The scaleY bob tween (0.18 → 0.17) is subtle and doesn't sell the movement
  - AI-generated sprite sheets have 4 frames but only frame 1 is extracted; could implement frame cycling
  - Isometric directions may feel unintuitive (up arrow = move toward top-right of screen)
- **Possible fixes:**
  - [ ] Cycle through all 4 sprite sheet frames during movement for proper walk animation
  - [ ] Add a slight shadow under the player that moves with them
  - [ ] Add a more visible squash/stretch or head-bob during movement
  - [ ] Consider diagonal movement support for more natural iso navigation
  - [ ] Add a subtle dust/footstep particle effect on each tile transition

---

## Closed

(none yet)
