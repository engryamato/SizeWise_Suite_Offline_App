import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();
try {
  // Navigate to dev server
  await page.goto('http://localhost:5173');

  // Create project
  await page.click('button:has-text("New Project")');
  await page.fill('#name', 'E2E Project');
  await page.fill('#startDate', '2024-01-01');
  await page.fill('#dueDate', '2024-01-10');
  await page.click('button:has-text("Create Project")');
  await page.waitForSelector('text=E2E Project');

  // Open task manager
  await page.click(`button[aria-label="Manage tasks for E2E Project"]`);
  await page.click('button:has-text("Add Task")');
  await page.fill('input[type="text"]', 'First Task');
  await page.click('button:has-text("Create Task")');
  await page.waitForSelector('text=First Task');
} catch (err) {
  console.error('E2E test failed:', err);
} finally {
  await browser.close();
}
