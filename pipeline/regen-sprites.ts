import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load API key
const envPath = path.join(__dirname, '..', '..', 'roguelike', '.env');
if (!process.env.OPENAI_API_KEY && fs.existsSync(envPath)) {
  const match = fs.readFileSync(envPath, 'utf-8').match(/OPENAI_API_KEY=(.+)/);
  if (match) process.env.OPENAI_API_KEY = match[1].trim();
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SPRITES_DIR = path.join(__dirname, '..', 'assets', 'sprites');
const REF_PATH = path.join(SPRITES_DIR, 'char_player_down.png');

// Step 1: Use GPT-4o to analyze the reference sprite in extreme detail
async function analyzeReference(): Promise<string> {
  console.log('Step 1: Analyzing reference sprite with GPT-4o...');

  const refBase64 = fs.readFileSync(REF_PATH).toString('base64');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `You are a pixel art technical analyst. Describe this sprite sheet in EXTREME detail so another AI can recreate the exact same character facing different directions.

Describe:
- EXACT pixel dimensions of each character frame
- EXACT color hex codes for: hair, skin, suit dark areas, suit light/highlight areas, suit medium areas, outlines, shoes, any accessories
- HEAD shape and proportions relative to body (how many pixels wide vs body width)
- BODY proportions: head-to-body ratio, arm length, leg length, body width
- HAIR style: shape, how it sits on the head, any bangs
- FACE details: where eyes are positioned, eye shape, any mouth visible
- SUIT details: collar, any stripes or patterns, where color transitions happen
- ART STYLE: pixel density (how many pixels wide is the character), chibi vs realistic proportions, outline thickness
- Overall character height in pixels, width in pixels

Be extremely specific with colors and proportions. This description will be used verbatim to regenerate the character.`,
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${refBase64}` },
          },
        ],
      },
    ],
    max_tokens: 1500,
  });

  const description = response.choices[0]?.message?.content || '';
  console.log('Reference analysis:\n', description.slice(0, 500), '...\n');
  return description;
}

// Step 2: Generate a full turnaround sheet (all 4 directions in one image)
async function generateTurnaround(charDescription: string, attempt: number): Promise<string> {
  console.log(`Step 2: Generating turnaround sheet (attempt ${attempt})...`);

  const prompt = `Create a pixel art character turnaround sprite sheet with EXACTLY 4 views of the SAME character arranged in a single horizontal row, evenly spaced. From left to right: FRONT view, BACK view, LEFT profile, RIGHT profile.

CRITICAL: All 4 views must be the EXACT SAME CHARACTER with identical proportions, colors, and style. The only difference is the viewing angle.

Character description (match EXACTLY):
${charDescription}

Requirements:
- All 4 sprites must be the same height and width
- Chibi pixel art style with thick dark outlines
- Each sprite should be a single standing pose (not walking)
- White/blank background with clear separation between the 4 views
- Label each view: "FRONT" "BACK" "LEFT" "RIGHT" below each sprite
- The character proportions, colors, and details must be IDENTICAL across all 4 views`;

  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'high',
  });

  const imgData = response.data?.[0];
  if (!imgData) throw new Error('No image data returned');

  const outPath = path.join(SPRITES_DIR, `turnaround_sheet.png`);

  if (imgData.b64_json) {
    fs.writeFileSync(outPath, Buffer.from(imgData.b64_json, 'base64'));
  } else if (imgData.url) {
    const resp = await fetch(imgData.url);
    fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
  }

  console.log(`  Saved turnaround sheet to ${outPath}`);
  return outPath;
}

// Step 3: GPT-4o reviews the turnaround against the reference
async function reviewTurnaround(sheetPath: string): Promise<{ pass: boolean; feedback: string }> {
  console.log('Step 3: Reviewing turnaround against reference...');

  const refBase64 = fs.readFileSync(REF_PATH).toString('base64');
  const sheetBase64 = fs.readFileSync(sheetPath).toString('base64');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Image 1 is the REFERENCE character (front-facing pixel art sprite sheet).
Image 2 is a newly generated turnaround sheet with 4 views (front, back, left, right).

Review strictly:
1. Does the front view in image 2 match the character in image 1? (same hair, suit colors, proportions, style)
2. Are all 4 views in image 2 clearly the SAME character? (consistent colors, proportions, style)
3. Are there exactly 4 distinct directional views?
4. Is the pixel art style consistent?

VERDICT: PASS or FAIL
ISSUES: <list any problems>
CONSISTENCY_SCORE: 1-10 (10 = perfectly consistent across all views)`,
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${refBase64}` },
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${sheetBase64}` },
          },
        ],
      },
    ],
    max_tokens: 500,
  });

  const text = response.choices[0]?.message?.content || '';
  const pass = text.includes('VERDICT: PASS');
  console.log(`  Review result:\n  ${text.replace(/\n/g, '\n  ')}\n`);
  return { pass, feedback: text };
}

// Step 4: Generate individual direction sprite sheets from the approved turnaround
async function generateDirectionSheet(charDescription: string, direction: string): Promise<string> {
  console.log(`  Generating ${direction} walk cycle...`);

  const directionGuide: Record<string, string> = {
    down: 'facing TOWARD THE CAMERA (front view)',
    up: 'facing AWAY FROM THE CAMERA (back view, we see the back of the head and suit)',
    left: 'facing LEFT (left side profile)',
    right: 'facing RIGHT (right side profile)',
  };

  const prompt = `Create a 4-frame walk cycle pixel art sprite sheet. EXACTLY 4 frames of the same character walking, arranged in a horizontal row.

The character is ${directionGuide[direction]}.

Character description (match EXACTLY):
${charDescription}

Requirements:
- 4 frames showing a walk cycle animation (standing, step left, standing, step right)
- All frames same size, evenly spaced in a horizontal row
- White background
- Same chibi pixel art style with dark outlines
- Character must match the description EXACTLY: same colors, same proportions, same style`;

  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'high',
  });

  const imgData = response.data?.[0];
  if (!imgData) throw new Error(`No image for ${direction}`);

  const outPath = path.join(SPRITES_DIR, `char_player_${direction}.png`);

  if (imgData.b64_json) {
    fs.writeFileSync(outPath, Buffer.from(imgData.b64_json, 'base64'));
  } else if (imgData.url) {
    const resp = await fetch(imgData.url);
    fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
  }

  console.log(`  Saved ${direction} sheet to ${outPath}`);
  return outPath;
}

// Step 5: Final consistency check - compare all 4 direction sheets
async function finalReview(): Promise<void> {
  console.log('Step 5: Final consistency review of all 4 sprites...');

  const images = ['down', 'up', 'left', 'right'].map(dir => {
    const p = path.join(SPRITES_DIR, `char_player_${dir}.png`);
    return fs.readFileSync(p).toString('base64');
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `These are 4 sprite sheets for the same character facing different directions: front (down), back (up), left, right.

Rate the consistency across all 4:
1. Are they clearly the same character? (colors, proportions, style)
2. Score 1-10 for consistency
3. Any specific issues?

VERDICT: PASS (7+) or FAIL (<7)
SCORE: X/10
NOTES: <details>`,
          },
          ...images.map(b64 => ({
            type: 'image_url' as const,
            image_url: { url: `data:image/png;base64,${b64}` },
          })),
        ],
      },
    ],
    max_tokens: 400,
  });

  const text = response.choices[0]?.message?.content || '';
  console.log(`  Final review:\n  ${text.replace(/\n/g, '\n  ')}`);
}

async function main() {
  console.log('=== Sprite Regeneration Pipeline ===\n');

  // Step 1: Analyze the reference
  const charDescription = await analyzeReference();

  // Step 2: Generate and review turnaround sheet (for consistency validation)
  let turnaroundApproved = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const sheetPath = await generateTurnaround(charDescription, attempt);
    const review = await reviewTurnaround(sheetPath);
    if (review.pass) {
      turnaroundApproved = true;
      break;
    }
    console.log(`  Turnaround failed review, retrying...\n`);
  }

  if (!turnaroundApproved) {
    console.log('WARNING: Turnaround never passed review, proceeding anyway with best effort.\n');
  }

  // Step 3: Generate individual walk cycle sheets for each direction
  console.log('Step 4: Generating individual walk cycle sheets...\n');
  for (const dir of ['down', 'up', 'left', 'right']) {
    await generateDirectionSheet(charDescription, dir);
  }

  // Step 4: Final consistency check
  await finalReview();

  console.log('\n=== Done! Sprites regenerated ===');
}

main().catch(e => { console.error(e); process.exit(1); });
