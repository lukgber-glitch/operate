const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots-e2e');
const testPages = JSON.parse(fs.readFileSync('test-pages-config.json', 'utf8'));

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const results = { timestamp: new Date().toISOString(), pages: [], summary: { total: 0, passed: 0, failed: 0 } };

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function testPage(browser, pageSpec, index) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const result = { route: pageSpec.route, name: pageSpec.name, status: 'UNKNOWN', errors: [], inputs: [] };
  const errors = [];
  
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.toString()));
  
  try {
    console.log((index + 1) + '. Testing: ' + pageSpec.name + ' - ' + pageSpec.route);
    
    const response = await page.goto(BASE_URL + pageSpec.route, { waitUntil: 'networkidle0', timeout: 30000 });
    result.httpStatus = response.status();
    result.finalUrl = page.url();
    
    await wait(3000);
    
    const ssName = String(index + 1).padStart(2, '0') + '-' + pageSpec.route.replace(///g, '-').replace(/^-/, '') + '.png';
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, ssName), fullPage: true });
    console.log('   Screenshot: ' + ssName);
    result.screenshot = ssName;
    
    if (pageSpec.inputs && pageSpec.inputs.length > 0) {
      for (const selector of pageSpec.inputs) {
        try {
          const inputs = await page.$$(selector);
          if (inputs.length > 0) {
            console.log('   Found ' + inputs.length + ' ' + selector);
            for (let i = 0; i < Math.min(inputs.length, 2); i++) {
              const input = inputs[i];
              const type = await input.evaluate(el => el.type);
              if (type !== 'submit' && type !== 'button' && type !== 'hidden') {
                await input.click();
                await input.type('test');
                await wait(500);
                console.log('   Tested input: ' + selector + '[' + i + ']');
                result.inputs.push({ selector, index: i, status: 'OK' });
              }
            }
          } else {
            console.log('   No ' + selector + ' found');
            result.inputs.push({ selector, status: 'NOT_FOUND' });
          }
        } catch (e) {
          console.log('   Error testing ' + selector + ': ' + e.message);
          result.inputs.push({ selector, status: 'ERROR', error: e.message });
        }
      }
    }
    
    result.errors = errors;
    result.status = (result.httpStatus === 200 || result.httpStatus === 307) && errors.length === 0 ? 'PASS' : 'FAIL';
    console.log('   Status: ' + result.status + '
');
    
  } catch (error) {
    result.status = 'FAIL';
    result.error = error.message;
    console.log('   ERROR: ' + error.message + '
');
  }
  
  await page.close();
  return result;
}

async function run() {
  console.log('
Comprehensive E2E Test Suite');
  console.log('=============================
');
  console.log('Base URL: ' + BASE_URL);
  console.log('Pages to test: ' + testPages.length);
  console.log('Screenshots: ' + SCREENSHOT_DIR + '
');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
    defaultViewport: null
  });
  
  for (let i = 0; i < testPages.length; i++) {
    const result = await testPage(browser, testPages[i], i);
    results.pages.push(result);
    results.summary.total++;
    if (result.status === 'PASS') results.summary.passed++;
    else results.summary.failed++;
    await wait(1000);
  }
  
  await browser.close();
  
  fs.writeFileSync('COMPREHENSIVE_E2E_RESULTS.json', JSON.stringify(results, null, 2));
  
  console.log('
=============================');
  console.log('SUMMARY');
  console.log('=============================');
  console.log('Total: ' + results.summary.total);
  console.log('Passed: ' + results.summary.passed);
  console.log('Failed: ' + results.summary.failed);
  console.log('Success Rate: ' + ((results.summary.passed / results.summary.total) * 100).toFixed(1) + '%');
  console.log('
Results: COMPREHENSIVE_E2E_RESULTS.json');
  console.log('Screenshots: ' + SCREENSHOT_DIR);
  
  generateReport();
}

function generateReport() {
  let md = '# BROWSER-E2E Test Report

';
  md += '**Date:** ' + results.timestamp + '
';
  md += '**Base URL:** ' + BASE_URL + '

';
  md += '## Summary

';
  md += '| Metric | Value |
|--------|-------|
';
  md += '| Total Pages | ' + results.summary.total + ' |
';
  md += '| Passed | ' + results.summary.passed + ' |
';
  md += '| Failed | ' + results.summary.failed + ' |
';
  md += '| Success Rate | ' + ((results.summary.passed / results.summary.total) * 100).toFixed(1) + '% |

';
  md += '## Pages Tested

';
  
  results.pages.forEach((p, i) => {
    md += '### ' + (i + 1) + '. ' + p.name + '

';
    md += '**Route:** ' + p.route + '
';
    md += '**Status:** ' + p.status + '
';
    md += '**HTTP Status:** ' + (p.httpStatus || 'N/A') + '
';
    md += '**Screenshot:** ' + p.screenshot + '

';
    
    if (p.inputs && p.inputs.length > 0) {
      md += '**Inputs Tested:**
';
      p.inputs.forEach(inp => {
        md += '- ' + inp.selector + ': ' + inp.status + '
';
      });
      md += '
';
    }
    
    if (p.errors && p.errors.length > 0) {
      md += '**Errors:**
';
      p.errors.slice(0, 3).forEach(e => md += '- ' + e + '
');
      md += '
';
    }
    
    if (p.error) {
      md += '**Error:** ' + p.error + '

';
    }
  });
  
  md += '## Critical Issues

';
  const failed = results.pages.filter(p => p.status === 'FAIL');
  if (failed.length > 0) {
    failed.forEach(p => {
      md += '- **' + p.name + '** (' + p.route + '): ' + (p.error || 'Check errors above') + '
';
    });
  } else {
    md += 'No critical issues found.
';
  }
  
  fs.writeFileSync('COMPREHENSIVE_E2E_REPORT.md', md);
  console.log('Report: COMPREHENSIVE_E2E_REPORT.md
');
}

run().catch(console.error);
