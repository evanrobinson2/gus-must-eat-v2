# Gus Must Eat v2 - Issue Tracker

## Open

### #1 - Sprite movement feels weird
- **Priority:** Medium
- **Category:** Polish / UX
- **Status:** Partially fixed (iso directions fixed in c493292)
- **Description:** Player character movement on the isometric grid feels off. Remaining issues:
  - Single-frame sprites (no walk animation) - character slides rather than walks
  - The scaleY bob tween (0.18 → 0.17) is subtle and doesn't sell the movement
  - Sprite sheets have 4 walk frames but only frame 1 is extracted; could implement frame cycling
- **Possible fixes:**
  - [ ] Cycle through all 4 sprite sheet frames during movement for proper walk animation
  - [ ] Add a slight shadow under the player that moves with them
  - [ ] Add a more visible squash/stretch or head-bob during movement
  - [ ] Add a subtle dust/footstep particle effect on each tile transition

### #2 - Down-facing sprite is smaller than other directions
- **Priority:** Low
- **Category:** Art / Polish
- **Description:** The front-facing (down) sprite is slightly more compact than up/left/right. Noticeable when turning. The auto-trim + uniform scale (0.18) means the down character appears a bit smaller in-game.
- **Possible fixes:**
  - [ ] Regenerate just the down sprite with explicit size instructions matching the others
  - [ ] Apply per-direction scale factors in BootScene after trimming

---

## Closed

### #0 - Character sprites are completely different in each direction
- **Fixed:** e6eb13d - Regenerated all 4 directions from same GPT-4o character description. Final consistency score 9/10.
