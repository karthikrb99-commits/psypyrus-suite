import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function capture() {
    console.log("Starting screenshot capture...");

    const screenshotsDir = path.join(__dirname, 'public', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
        console.log("Created directory:", screenshotsDir);
    }

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 900 });

        // Navigate to the local server
        console.log("Navigating to landing page...");
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
        
        // Take Landing Page screenshot
        console.log("Capturing landing page...");
        await page.screenshot({ path: path.join(screenshotsDir, 'landing_page.png') });

        // Click "Launch Portal" button
        console.log("Clicking 'Launch Portal'...");
        await page.waitForSelector('button.nav-cta-btn', { timeout: 5000 });
        await page.click('button.nav-cta-btn');

        // Wait for Biometric Lock Screen
        console.log("Waiting for lock screen...");
        await page.waitForSelector('#biometric-lock-screen', { timeout: 5000 });
        await page.screenshot({ path: path.join(screenshotsDir, 'lock_screen.png') });

        // Trigger biometric authentication
        console.log("Triggering biometric scan...");
        await page.click('#lock-scanner-trigger');

        // Wait for Clinician Dashboard
        console.log("Waiting for Clinician Dashboard...");
        await new Promise(resolve => setTimeout(resolve, 3000)); // wait for unlock transition
        await page.waitForSelector('.user-profile-widget', { timeout: 5000 });
        await page.screenshot({ path: path.join(screenshotsDir, 'clinician_dashboard.png') });

        // Navigate to Diagnostics
        console.log("Navigating to Diagnostics...");
        await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.nav-item-link'));
            const diag = items.find(el => el.textContent.includes('Diagnostics'));
            if (diag) diag.click();
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await page.screenshot({ path: path.join(screenshotsDir, 'diagnostics_suite.png') });

        // Navigate to Therapeutic Contracts
        console.log("Navigating to Therapeutic Contracts...");
        await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.nav-item-link'));
            const contract = items.find(el => el.textContent.includes('Therapeutic Contracts'));
            if (contract) contract.click();
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await page.screenshot({ path: path.join(screenshotsDir, 'therapeutic_contracts.png') });

        // Navigate to AI Copilot (SOAP Notes)
        console.log("Navigating to AI Copilot...");
        await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.nav-item-link'));
            const copilot = items.find(el => el.textContent.includes('AI Copilot'));
            if (copilot) copilot.click();
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await page.screenshot({ path: path.join(screenshotsDir, 'soap_copilot.png') });

        // Navigate to Teletherapy
        console.log("Navigating to Teletherapy...");
        await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.nav-item-link'));
            const tele = items.find(el => el.textContent.includes('Teletherapy'));
            if (tele) tele.click();
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await page.screenshot({ path: path.join(screenshotsDir, 'telehealth_session.png') });

        console.log("Screenshots captured successfully!");

    } catch (err) {
        console.error("Error during screenshot capture:", err);
    } finally {
        await browser.close();
    }
}

capture();
