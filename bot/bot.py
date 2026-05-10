import os
import sys
import time
import json
from playwright.sync_api import sync_playwright


def run_playwright_bot(meeting_id, meeting_pwd, bot_name, transcript_path, status_path):
    print("Starting Playwright...", flush=True)

    p = sync_playwright().start()
    browser = p.chromium.launch(
        headless=True,
        args=[
            "--use-fake-ui-for-media-stream",
            "--use-fake-device-for-media-stream",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
        ],
    )
    context = browser.new_context(
        permissions=["microphone", "camera"],
        user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        viewport={"width": 1280, "height": 720},
    )
    page = context.new_page()
    page.on("console", lambda msg: print(f"[browser] {msg.text}", flush=True))

    # Navigate to Zoom
    url = f"https://app.zoom.us/wc/join/{meeting_id}"
    print(f"Navigating to {url}", flush=True)
    page.goto(url, wait_until="networkidle", timeout=60000)
    time.sleep(3)
    page.screenshot(path="/data/debug_01_initial.png")

    # -- Fill passcode and name via coordinates --
    if meeting_pwd:
        print("Filling passcode...", flush=True)
        page.mouse.click(900, 240)
        time.sleep(0.3)
        page.keyboard.press("Control+a")
        page.keyboard.type(meeting_pwd, delay=30)

    print(f"Filling name '{bot_name}'...", flush=True)
    page.mouse.click(900, 330)
    time.sleep(0.3)
    page.keyboard.press("Control+a")
    page.keyboard.type(bot_name, delay=30)
    time.sleep(0.3)

    page.screenshot(path="/data/debug_02_filled.png")

    # -- Click Join --
    print("Clicking Join...", flush=True)
    page.mouse.click(900, 420)
    time.sleep(1)
    page.keyboard.press("Enter")

    # Wait for meeting to load (reduced from 15s)
    print("Waiting for meeting...", flush=True)
    time.sleep(8)
    page.screenshot(path="/data/debug_03_joined.png")

    # -- Handle audio modal --
    for attempt in range(3):
        page.mouse.click(640, 400)
        time.sleep(0.5)
        page.keyboard.press("Enter")
        time.sleep(1)

    page.screenshot(path="/data/debug_04_in_meeting.png")

    # -- Wait until actually in the meeting (not waiting room) --
    print("Checking if in meeting...", flush=True)
    in_meeting = False
    for wait in range(30):  # up to 60s waiting for host
        try:
            body = page.evaluate("() => document.body?.innerText || ''")
            if "Waiting for the host" in body:
                if wait % 5 == 0:
                    print(f"  Still in waiting room ({wait*2}s)...", flush=True)
                time.sleep(2)
                continue
            elif "Enter Meeting Info" in body:
                time.sleep(2)
                continue
            else:
                in_meeting = True
                print("In the meeting!", flush=True)
                break
        except Exception:
            time.sleep(2)

    if not in_meeting:
        print("Never entered meeting. Saving empty transcript.", flush=True)
        with open(transcript_path, "w") as f:
            json.dump({"segments": []}, f)
        with open(status_path, "w") as f:
            json.dump({"status": "completed"}, f)
        browser.close()
        p.stop()
        return

    page.screenshot(path="/data/debug_05_meeting_active.png")

    # -- Enable captions by clicking CC in the toolbar --
    print("Enabling captions...", flush=True)
    enable_captions_in_meeting(page)
    time.sleep(2)
    page.screenshot(path="/data/debug_06_captions_enabled.png")

    # -- Collect captions --
    print("Collecting transcript...", flush=True)
    segments = collect_captions(page, max_duration=300)

    with open(transcript_path, "w") as f:
        json.dump({"segments": segments}, f, indent=2)
    with open(status_path, "w") as f:
        json.dump({"status": "completed"}, f)

    print(f"Done. {len(segments)} segments saved.", flush=True)
    page.screenshot(path="/data/debug_07_final.png")
    browser.close()
    p.stop()


def enable_captions_in_meeting(page):
    """Click the CC / Live Transcript button in Zoom's bottom toolbar."""
    # The toolbar is at the bottom of the screen.
    # Try clicking CC button - typically near bottom center of the meeting window.

    # Method 1: Find by aria-label or text
    cc_selectors = [
        'button[aria-label*="caption" i]',
        'button[aria-label*="Caption" i]',
        'button[aria-label*="transcript" i]',
        'button[aria-label*="Transcript" i]',
        'button[aria-label*="CC" i]',
        'button:has-text("CC")',
        'button:has-text("Live Transcript")',
        '[class*="captions-btn"]',
        '[class*="closed-caption"]',
    ]
    for sel in cc_selectors:
        try:
            btn = page.locator(sel)
            if btn.count() > 0 and btn.first.is_visible():
                btn.first.click()
                print(f"Clicked CC button: {sel}", flush=True)
                time.sleep(1)
                # If submenu, click "Show Captions"
                sub_items = [
                    'text="Show Captions"',
                    'text="Enable Captions"',
                    'text="View Full Transcript"',
                    ':text("Show Captions")',
                ]
                for sub in sub_items:
                    try:
                        el = page.locator(sub)
                        if el.count() > 0:
                            el.first.click()
                            print(f"  Clicked submenu: {sub}", flush=True)
                    except Exception:
                        continue
                return
        except Exception:
            continue

    # Method 2: Move mouse to bottom to reveal toolbar, then search
    print("Hovering bottom toolbar to reveal controls...", flush=True)
    page.mouse.move(640, 700)
    time.sleep(2)
    page.screenshot(path="/data/debug_toolbar.png")

    # Try again after hover
    for sel in cc_selectors:
        try:
            btn = page.locator(sel)
            if btn.count() > 0:
                btn.first.click()
                print(f"Clicked CC after hover: {sel}", flush=True)
                time.sleep(1)
                return
        except Exception:
            continue

    # Method 3: Try keyboard shortcut Alt+F12 or Alt+C
    print("Trying keyboard shortcuts for captions...", flush=True)
    page.keyboard.press("Alt+c")
    time.sleep(0.5)
    page.keyboard.press("Alt+F12")
    time.sleep(0.5)

    # Method 4: dump all buttons for debugging
    try:
        buttons = page.evaluate('''() => {
            return Array.from(document.querySelectorAll("button")).map(b => ({
                text: b.innerText.substring(0, 50),
                ariaLabel: b.getAttribute("aria-label") || "",
                className: b.className.substring(0, 80),
                visible: b.offsetParent !== null
            })).filter(b => b.visible);
        }''')
        print(f"Visible buttons ({len(buttons)}):", flush=True)
        for b in buttons:
            print(f"  btn: text='{b['text']}' aria='{b['ariaLabel']}' class='{b['className']}'", flush=True)
    except Exception as e:
        print(f"Could not dump buttons: {e}", flush=True)


def collect_captions(page, max_duration=300):
    """Scrape captions and detect meeting end."""
    segments = []
    seen_texts = set()
    start_time = time.time()
    screenshot_count = 0

    while time.time() - start_time < max_duration:
        elapsed = time.time() - start_time

        # Periodic screenshot for debugging (every 30s, max 5)
        if screenshot_count < 5 and int(elapsed) % 30 == 0 and int(elapsed) > 0:
            page.screenshot(path=f"/data/debug_caption_{screenshot_count}.png")
            screenshot_count += 1

        # Check if meeting ended
        try:
            body = page.evaluate("() => document.body?.innerText || ''")

            if any(phrase in body for phrase in [
                "This meeting has been ended",
                "The host has ended",
                "Meeting has ended",
                "meeting has been ended by host",
            ]):
                print(f"Meeting ended at {round(elapsed)}s", flush=True)
                break
        except Exception:
            pass

        # Scrape ALL visible text nodes looking for caption content
        try:
            new_texts = page.evaluate('''() => {
                const results = [];
                // Look for caption-specific elements
                const selectors = [
                    '[class*="caption"]',
                    '[class*="Caption"]',
                    '[class*="subtitle"]',
                    '[class*="Subtitle"]',
                    '[class*="transcript"]',
                    '[class*="Transcript"]',
                    '[class*="closed-caption"]',
                    '[data-type*="caption"]',
                    '[role="log"]',
                    '[role="status"]',
                    '[aria-live]',
                ];
                for (const sel of selectors) {
                    try {
                        document.querySelectorAll(sel).forEach(el => {
                            const text = el.innerText?.trim();
                            if (text && text.length > 1 && text.length < 500) {
                                results.push({text, className: el.className?.substring(0,80) || ""});
                            }
                        });
                    } catch(e) {}
                }
                return results;
            }''')

            for item in new_texts:
                text = item["text"]
                if text not in seen_texts:
                    seen_texts.add(text)
                    segments.append({
                        "start": round(elapsed, 2),
                        "end": round(elapsed + 1, 2),
                        "text": text,
                        "speaker": "Unknown",
                    })
                    print(f"  [{round(elapsed)}s] (class: {item['className'][:40]}) {text[:100]}", flush=True)
        except Exception:
            pass

        time.sleep(2)

    return segments


def main():
    meeting_id = os.environ.get("MEETING_ID")
    meeting_pwd = os.environ.get("MEETING_PWD", "")
    bot_name = os.environ.get("BOT_NAME", "Meno Bot")

    if not meeting_id:
        print("Missing MEETING_ID", flush=True)
        sys.exit(1)

    transcript_path = f"/data/{meeting_id}_transcript.json"
    status_path = f"/data/{meeting_id}_status.json"

    try:
        run_playwright_bot(meeting_id, meeting_pwd, bot_name, transcript_path, status_path)
    except Exception as e:
        print(f"Failed: {e}", flush=True)
        import traceback
        traceback.print_exc()
        with open(status_path, "w") as f:
            json.dump({"status": "failed", "error": str(e)}, f)
        sys.exit(1)


if __name__ == "__main__":
    main()
