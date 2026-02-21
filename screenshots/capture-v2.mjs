import { chromium } from 'playwright';

const DIR = '/Users/evanrobinson/Documents/luna_claude/roguelike-v2/screenshots';
const URL = 'http://localhost:3001';

// Key hold must be SHORTER than MOVE_DURATION (220ms) to get exactly 1 tile per press
async function move(page, dir, count) {
  const key = `Arrow${dir.charAt(0).toUpperCase()}${dir.slice(1)}`;
  for (let i = 0; i < count; i++) {
    await page.keyboard.down(key);
    await page.waitForTimeout(100); // hold < 220ms move duration
    await page.keyboard.up(key);
    await page.waitForTimeout(300); // wait for tween to complete
  }
  await page.waitForTimeout(400);
}

async function capture() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 820, height: 640 } });

  await page.goto(URL);
  await page.waitForTimeout(5000);

  // Click canvas to focus
  await page.click('canvas');
  await page.waitForTimeout(500);

  // === 01: Ship overview, player at start (9,5) ===
  await page.screenshot({ path: `${DIR}/01_ship_overview.png` });
  console.log('01: Ship Overview (player at 9,5)');

  // === 02: Move to Bridge console (9,3): up 2 ===
  await move(page, 'up', 2);
  await page.screenshot({ path: `${DIR}/02_at_bridge.png` });
  console.log('02: At Bridge (9,3)');

  // === 03: Bridge UI ===
  await page.keyboard.press('e');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}/03_bridge_ui.png` });
  console.log('03: Bridge UI');

  // === Close Bridge, move to Galley ===
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // Click canvas again to re-focus after overlay
  await page.click('canvas');
  await page.waitForTimeout(500);

  // From (9,3): down 4 to (9,7), left 5 to (4,7)
  await move(page, 'down', 4);
  await move(page, 'left', 5);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/04_at_galley.png` });
  console.log('04: At Galley (4,7)');

  // === 05: Galley UI ===
  await page.keyboard.press('e');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}/05_galley_ui.png` });
  console.log('05: Galley UI');

  // === Close, move to Engineering ===
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  await page.click('canvas');
  await page.waitForTimeout(500);

  // From (4,7): right 11 to (15,7)
  await move(page, 'right', 11);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/06_at_engineering.png` });
  console.log('06: At Engineering (15,7)');

  // === 07: Engineering UI ===
  await page.keyboard.press('e');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}/07_engineering_ui.png` });
  console.log('07: Engineering UI');

  // === Close, move to Clone Bay ===
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  await page.click('canvas');
  await page.waitForTimeout(500);

  // From (15,7): left 6 to (9,7), down 6 to (9,13), left 6 to (3,13)
  await move(page, 'left', 6);
  await move(page, 'down', 6);
  await move(page, 'left', 6);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/08_at_clonebay.png` });
  console.log('08: At Clone Bay (3,13)');

  // === 09: Clone Bay UI ===
  await page.keyboard.press('e');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}/09_clonebay_ui.png` });
  console.log('09: Clone Bay UI');

  // === Close, move to Cargo ===
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  await page.click('canvas');
  await page.waitForTimeout(500);

  // From (3,13): right 12 to (15,13)
  await move(page, 'right', 12);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/10_at_cargo.png` });
  console.log('10: At Cargo (15,13)');

  // === 11: Cargo UI ===
  await page.keyboard.press('e');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}/11_cargo_ui.png` });
  console.log('11: Cargo UI');

  await browser.close();
  console.log('Done! Screenshots saved to:', DIR);
}

capture().catch(e => { console.error(e); process.exit(1); });
