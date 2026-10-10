from playwright.sync_api import sync_playwright
import time

def take_screenshot():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Navigate to the app
        page.goto('http://localhost:3000')
        # Wait for the app to load
        page.wait_for_load_state("networkidle")

        # Override the api fetch functions so they don't hit the real google api
        page.evaluate('''() => {
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                if (args[0].includes('/api/history')) {
                    return new Response(JSON.stringify({
                        visitorTips: ["test"],
                        historicalTimeline: [],
                        hiddenSecrets: [],
                        searchSources: [],
                        narratedMonologue: "Test"
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                if (args[0].includes('/api/tts') || args[0].includes('/api/narrate')) {
                    return new Response(JSON.stringify({
                        audioBase64: "",
                        mimeType: "audio/wav",
                        voiceName: "test"
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                return originalFetch(...args);
            };
        }''')

        print("clicking sample image")
        page.evaluate('''() => {
            const btn = document.querySelector('button[aria-label^="Test recognition with preset image of"]');
            if (btn) btn.click();
        }''')

        # Wait for VR View button to appear
        try:
            page.wait_for_selector('#vr-view-toggle-btn', timeout=10000)
            print("clicking VR View")
            page.click('#vr-view-toggle-btn')
            time.sleep(2) # wait for VR View

            # Take a screenshot
            page.screenshot(path='screenshot.png')
            print("Screenshot taken.")
        except Exception as e:
            print("Failed to click VR view:", e)
            page.screenshot(path='screenshot_failed.png')
        browser.close()

take_screenshot()
