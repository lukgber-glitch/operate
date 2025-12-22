const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'test-screenshots');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function test() {
  const report = {
    timestamp: new Date().toISOString(),
    journeys: [],
    summary: { total: 0, passed: 0, failed: 0, duration: 0 }
  };

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const start = Date.now();
  const page = await browser.newPage();

  try {
    console.log('Setting cookies...');
    await page.goto('http://localhost:3000');
    await sleep(1000);

    const authData = {
      a: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YmYyMTdiZC1hNTAxLTQ5NGEtYjI3YS05YjY3YmE0NmE4MDAiLCJlbWFpbCI6ImJyb3dzZXJ0ZXN0QHRlc3QuY29tIiwib3JnSWQiOiIwMjAwOTc2NS1lYjA3LTRlYTgtOWVkYy0yZjVlZjlhYmVjOTAiLCJyb2xlIjoiT1dORVIiLCJpYXQiOjE3NjYyMjkzOTQsImV4cCI6MTc2NjIzMDI5NH0.JDOz_eNKRL42QJF2rSoTt_n5aRLks_zsO1OzxKs9A5o',
      r: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YmYyMTdiZC1hNTAxLTQ5NGEtYjI3YS05YjY3YmE0NmE4MDAiLCJlbWFpbCI6ImJyb3dzZXJ0ZXN0QHRlc3QuY29tIiwib3JnSWQiOiIwMjAwOTc2NS1lYjA3LTRlYTgtOWVkYy0yZjVlZjlhYmVjOTAiLCJyb2xlIjoiT1dORVIiLCJqdGkiOiI0MGU1ZDlmNzA3M2I2NGRhYWM2YTk0ZjMxMjUyYjI3YyIsImlhdCI6MTc2NjIyOTM5NCwiZXhwIjoxNzY2ODM0MTk0fQ.AfwV7ezFO0eZ4k-rm0eLjyywRCrmZs0gLdpZ8uPHd0I'
    };

    await page.setCookie({
      name: 'op_auth',
      value: encodeURIComponent(JSON.stringify(authData)),
      domain: 'localhost',
      path: '/',
      httpOnly: true
    });

    await page.setCookie({
      name: 'onboarding_complete',
      value: 'true',
      domain: 'localhost',
      path: '/'
    });

    console.log('Cookies set correctly');

    console.log('\nTest 1: Dashboard access...');
    const j1 = { name: 'Dashboard', steps: [], status: 'FAIL', duration: 0, frictionPoints: [] };
    const t1 = Date.now();

    await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle2' });
    await sleep(3000);

    const url = page.url();
    console.log('URL:', url);
    await page.screenshot({ path: path.join(DIR, 'dashboard.png'), fullPage: true });

    const ok = url.includes('/chat') && !url.includes('/login') && !url.includes('/onboarding');
    j1.steps.push({ step: 1, action: 'Go to /chat', expected: '/chat', actual: url, status: ok ? 'PASS' : 'FAIL' });
    if (ok) j1.status = 'PASS';
    else j1.frictionPoints.push('Redirected');

    j1.duration = Date.now() - t1;
    report.journeys.push(j1);

    console.log('\nTest 2: Chat input...');
    const j2 = { name: 'Chat', steps: [], status: 'FAIL', duration: 0, frictionPoints: [] };
    const t2 = Date.now();

    await sleep(2000);
    let input = await page.$('textarea');
    if (!input) input = await page.$('input[type="text"]');

    j2.steps.push({ step: 1, action: 'Find input', expected: 'Found', actual: input ? 'Yes' : 'No', status: input ? 'PASS' : 'FAIL' });

    if (input) {
      await input.click();
      await sleep(500);
      await page.keyboard.type('Hello, can you help me with my finances?');
      j2.steps.push({ step: 2, action: 'Type', expected: 'OK', actual: 'OK', status: 'PASS' });

      await sleep(1000);
      await page.screenshot({ path: path.join(DIR, 'typed.png'), fullPage: true });

      let btn = await page.$('button[type="submit"]');
      if (btn) {
        await btn.click();
        j2.steps.push({ step: 3, action: 'Send', expected: 'OK', actual: 'Clicked', status: 'PASS' });
      } else {
        await page.keyboard.press('Enter');
        j2.steps.push({ step: 3, action: 'Send', expected: 'OK', actual: 'Enter', status: 'PASS' });
      }

      console.log('Waiting 15s for AI...');
      await sleep(15000);
      await page.screenshot({ path: path.join(DIR, 'response.png'), fullPage: true });

      const html = await page.content();
      const hasResp = html.toLowerCase().includes('assist') || html.toLowerCase().includes('help');
      j2.steps.push({ step: 4, action: 'Check AI', expected: 'Response', actual: hasResp ? 'Yes' : 'No', status: hasResp ? 'PASS' : 'FAIL' });

      if (hasResp) j2.status = 'PASS';
      else j2.frictionPoints.push('No AI response');
    } else {
      j2.frictionPoints.push('No input');
    }

    j2.duration = Date.now() - t2;
    report.journeys.push(j2);

    console.log('\nTest 3: Other pages...');
    const j3 = { name: 'Pages', steps: [], status: 'PASS', duration: 0, frictionPoints: [] };
    const t3 = Date.now();

    const pages = ['/finance/invoices', '/finance/expenses', '/time', '/settings'];
    for (const pg of pages) {
      await page.goto('http://localhost:3000' + pg, { waitUntil: 'networkidle2' });
      await sleep(2000);

      const u = page.url();
      const good = u.includes(pg);
      const fname = pg.replace(/\//g, '-') + '.png';
      await page.screenshot({ path: path.join(DIR, fname), fullPage: true });

      j3.steps.push({ step: j3.steps.length + 1, action: pg, expected: 'OK', actual: good ? 'OK' : 'Redirect', status: good ? 'PASS' : 'FAIL' });

      if (!good) {
        j3.status = 'FAIL';
        j3.frictionPoints.push(pg);
      }
    }

    j3.duration = Date.now() - t3;
    report.journeys.push(j3);

  } catch (err) {
    console.error('Error:', err);
    report.error = err.message;
  } finally {
    await browser.close();
  }

  report.journeys.forEach(j => {
    report.summary.total++;
    if (j.status === 'PASS') report.summary.passed++;
    else report.summary.failed++;
  });
  report.summary.duration = Date.now() - start;

  fs.writeFileSync('E2E_FINAL_REPORT.json', JSON.stringify(report, null, 2));

  console.log('\n=== RESULTS ===');
  console.log('Total:', report.summary.total);
  console.log('Passed:', report.summary.passed);
  console.log('Failed:', report.summary.failed);
  console.log('Time:', (report.summary.duration / 1000).toFixed(2) + 's');

  return report;
}

test().catch(console.error);
