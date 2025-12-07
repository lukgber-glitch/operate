const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // Set Arabic locale
    await page.setCookie({
      name: 'NEXT_LOCALE',
      value: 'ar',
      domain: 'operate.guru',
      path: '/'
    });

    await page.goto('https://operate.guru/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check RTL implementation
    const rtlCheck = await page.evaluate(() => {
      return {
        htmlDir: document.documentElement.dir,
        htmlLang: document.documentElement.lang,
        bodyClass: document.body.className,
        bodyDir: document.body.getAttribute('dir'),

        // Check for RTL-specific CSS
        hasRTLClass: document.body.classList.contains('rtl'),
        hasLTRClass: document.body.classList.contains('ltr'),

        // Check computed styles
        containerDirection: window.getComputedStyle(document.querySelector('main') || document.body).direction,

        // Check text alignment
        headingAlignment: window.getComputedStyle(document.querySelector('h1') || document.body).textAlign,

        // Check for logical properties
        computedStyles: {
          paddingInlineStart: window.getComputedStyle(document.body).paddingInlineStart,
          marginInlineEnd: window.getComputedStyle(document.body).marginInlineEnd,
        },

        // Sample element positions
        buttonPositions: Array.from(document.querySelectorAll('button')).slice(0, 3).map(btn => {
          const rect = btn.getBoundingClientRect();
          return {
            text: btn.innerText.trim(),
            left: rect.left,
            right: rect.right
          };
        })
      };
    });

    console.log('=== ARABIC (RTL) TEST RESULTS ===\n');
    console.log('HTML Direction:', rtlCheck.htmlDir);
    console.log('HTML Lang:', rtlCheck.htmlLang);
    console.log('Body Direction:', rtlCheck.bodyDir);
    console.log('Body Classes:', rtlCheck.bodyClass);
    console.log('Has RTL Class:', rtlCheck.hasRTLClass);
    console.log('Has LTR Class:', rtlCheck.hasLTRClass);
    console.log('Container Direction:', rtlCheck.containerDirection);
    console.log('Heading Alignment:', rtlCheck.headingAlignment);
    console.log('\nComputed Styles:');
    console.log('  paddingInlineStart:', rtlCheck.computedStyles.paddingInlineStart);
    console.log('  marginInlineEnd:', rtlCheck.computedStyles.marginInlineEnd);
    console.log('\nButton Positions:');
    rtlCheck.buttonPositions.forEach(btn => {
      console.log(`  ${btn.text}: left=${btn.left}, right=${btn.right}`);
    });

    // Take screenshot
    await page.screenshot({
      path: 'arabic-rtl-test.png',
      fullPage: true
    });
    console.log('\nScreenshot saved as arabic-rtl-test.png');

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
})();
