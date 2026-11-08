//  ContentView.swift — Kaizen for iPhone
//
//  What this app does:
//  • Kaizen lives inside the app (the Web.bundle folder). No Shopify, no internet needed, opens instantly.
//  • To update the app, replace Web.bundle with a new build and press Run again.
//  • Real reminders: the Reminders button in Kaizen now schedules iPhone notifications
//    (morning nudge + an 8 PM rescue that is skipped on days you finish every goal).
//  • Real haptics on every check-off, and Back up / Share open the iPhone share sheet.
//  • Your animals can talk: Apple's on-device model (iPhone 15 Pro or newer, iOS 26+) writes their
//    little questions from your goals. Private, free, no internet. Other iPhones use written lines.

import SwiftUI
import WebKit
import UIKit
import AVFoundation
import AudioToolbox
import UserNotifications
import StoreKit

// Kaizen runs from files inside the app, served at kaizen://app/ so its saved data has one stable home.
let kaizenHome = URL(string: "kaizen://app/")!

// Backgrounds (dark only since Oct 23; the colours still resolve correctly if a light style is ever added back)
let kzBackground = UIColor { $0.userInterfaceStyle == .light ? UIColor(red: 242 / 255, green: 242 / 255, blue: 247 / 255, alpha: 1) : UIColor(red: 11 / 255, green: 11 / 255, blue: 13 / 255, alpha: 1) }   // Nov 6: off-black, same as the pages (kzbg-1106.css)
let kzRaised = UIColor { $0.userInterfaceStyle == .light ? .white : UIColor(red: 28 / 255, green: 28 / 255, blue: 30 / 255, alpha: 1) }
// Oct 21: two-tone black split down the middle (same line as the logo's seam): left pure black, right a touch lighter
let kzBackgroundRight = kzBackground   // Oct 22 (later): one colour, no two-tone
let kzGold = UIColor(red: 226 / 255, green: 185 / 255, blue: 59 / 255, alpha: 1)

struct ContentView: View {
    // Oct 26: launch skeleton (James picked B): grey shapes in Today's layout from the very first frame,
    // faded out the moment Today has finished drawing (or after 2.5 s at most). Nothing old ever flashes.
    @State private var launched = false
    var body: some View {
        ZStack {
            KaizenWeb()
                .ignoresSafeArea()
                .background(HStack(spacing: 0) { Color(kzBackground); Color(kzBackgroundRight) }.ignoresSafeArea())
            if !launched {
                KaizenLaunchSkeleton()
                    .allowsHitTesting(false)
                    .transition(.opacity)
                    .zIndex(1)
            }
        }
        .preferredColorScheme(.dark)   // Oct 23: light mode removed (James); the app is dark only
        .onReceive(NotificationCenter.default.publisher(for: .kzFirstPaint)) { _ in reveal() }
        .task {
            try? await Task.sleep(nanoseconds: 2_500_000_000)
            reveal()
        }
    }
    private func reveal() {
        guard !launched else { return }
        withAnimation(.easeOut(duration: 0.22)) { launched = true }
    }
}

extension Notification.Name {
    /// Posted when the screen you're looking at has finished drawing (the web page's "painted").
    static let kzFirstPaint = Notification.Name("kzFirstPaint")
}

/// The launch skeleton: the same shapes and positions as Today (header, Kaizen 66 card, to-do list, goals),
/// pinned to the top safe area and the 20 pt side margins, so it lines up on every iPhone size.
struct KaizenLaunchSkeleton: View {
    private let block = Color(red: 28 / 255, green: 28 / 255, blue: 30 / 255)    // #1C1C1E
    private let faint = Color(red: 20 / 255, green: 20 / 255, blue: 22 / 255)    // #141416
    private let card = Color(red: 18 / 255, green: 18 / 255, blue: 20 / 255)     // #121214
    private let gold = Color(red: 42 / 255, green: 38 / 255, blue: 21 / 255)     // #2A2615 (dim gold)
    private let line = Color(red: 26 / 255, green: 26 / 255, blue: 28 / 255)     // #1A1A1C
    private let rowWidths: [CGFloat] = [110, 90, 66, 76, 110]

    var body: some View {
        ZStack(alignment: .top) {
            Color(kzBackground).ignoresSafeArea()
            VStack(alignment: .leading, spacing: 0) {
                // header: title, date, two pills, the gold +
                HStack(spacing: 10) {
                    bar(76, 20, block); bar(46, 14, faint)
                    Spacer(minLength: 0)
                    Capsule().fill(faint).frame(width: 42, height: 34)
                    Capsule().fill(faint).frame(width: 56, height: 34)
                    Circle().fill(gold).frame(width: 44, height: 44)
                }
                .frame(height: 48).padding(.top, 4)
                // Kaizen 66 card
                RoundedRectangle(cornerRadius: 22, style: .continuous).fill(card)
                    .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(gold, lineWidth: 1))
                    .overlay(
                        HStack(spacing: 14) {
                            RoundedRectangle(cornerRadius: 14, style: .continuous).fill(block).frame(width: 60, height: 60)
                            VStack(alignment: .leading, spacing: 9) {
                                bar(96, 10, gold); bar(190, 16, block); bar(130, 12, faint)
                            }
                            Spacer(minLength: 0)
                        }.padding(.horizontal, 16)
                    )
                    .frame(height: 100).padding(.top, 11)
                // To-dos heading + list
                HStack(spacing: 10) { bar(86, 22, block); bar(44, 15, faint) }.frame(height: 44).padding(.top, 28)
                VStack(spacing: 0) {
                    ForEach(0..<5, id: \.self) { i in
                        HStack(spacing: 22) {
                            bar(56, 12, block); bar(rowWidths[i], 15, block)
                            Spacer(minLength: 0)
                            Circle().fill(block).frame(width: 40, height: 40)
                        }
                        .frame(height: 52)
                        .overlay(alignment: .bottom) { if i < 4 { line.frame(height: 1) } }
                    }
                }
                .padding(.horizontal, 14).padding(.top, 4).padding(.bottom, 6)
                .background(RoundedRectangle(cornerRadius: 22, style: .continuous).fill(card))
                .padding(.top, 18)
                // Goals heading + card
                HStack(spacing: 10) { bar(70, 22, block); bar(40, 15, faint) }.frame(height: 44).padding(.top, 22)
                RoundedRectangle(cornerRadius: 22, style: .continuous).fill(card).frame(height: 137).padding(.top, 18)
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 20)
        }
        .accessibilityHidden(true)
    }

    private func bar(_ w: CGFloat, _ h: CGFloat, _ c: Color) -> some View {
        RoundedRectangle(cornerRadius: 7, style: .continuous).fill(c).frame(width: w, height: h)
    }
}

// MARK: - The web view

struct KaizenWeb: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> KaizenTabs { KaizenTabs() }
    func updateUIViewController(_ controller: KaizenTabs, context: Context) {}
}

/// One Kaizen screen (one web page) inside a tab's stack.
@MainActor
final class KaizenPage: UIViewController {
    let web: WKWebView
    init(web: WKWebView) { self.web = web; super.init(nibName: nil, bundle: nil) }
    required init?(coder: NSCoder) { fatalError("not used") }
    override func loadView() { let v = UIView(); v.backgroundColor = kzBackground; view = v }
    var showsBack = false
    weak var backBtn: UIButton?   // Oct 27: hidden while a sheet is open on this page (see KaizenTabs.overlay)
    override func viewDidLoad() {
        super.viewDidLoad()
        attach()
        guard showsBack else { return }
        // Native back button (deeper pages): 44pt round, top left, like Hevy and Strava
        let b = UIButton(type: .system)
        b.translatesAutoresizingMaskIntoConstraints = false
        b.setImage(UIImage(systemName: "chevron.left", withConfiguration: UIImage.SymbolConfiguration(pointSize: 15, weight: .semibold)), for: .normal)
        b.tintColor = .label
        // Oct 26 (James): the grey circle is 34pt (was the full 44pt); the button itself stays a 44pt target.
        // Oct 27: the circle sits BEHIND the button, in the page view. Inside the button it covered the chevron (UIButton adds
        // its image view later, under subviews inserted earlier), so the back buttons showed an empty circle.
        // Oct 27 (James): no circle behind the back arrow any more; a soft shadow keeps the chevron readable over any page.
        b.layer.shadowColor = UIColor.black.cgColor
        b.layer.shadowOpacity = 0.6
        b.layer.shadowRadius = 6
        b.layer.shadowOffset = .zero
        b.accessibilityLabel = "Back"
        b.addAction(UIAction { [weak self] _ in
            UIImpactFeedbackGenerator(style: .light).impactOccurred(intensity: 0.7)
            self?.navigationController?.popViewController(animated: true)
        }, for: .touchUpInside)
        view.addSubview(b)
        backBtn = b
        NSLayoutConstraint.activate([
            b.widthAnchor.constraint(equalToConstant: 44), b.heightAnchor.constraint(equalToConstant: 44),
            b.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 9),   // the 34pt circle starts 14pt from the edge
            b.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 2),
        ])
    }
    func attach() {
        loadViewIfNeeded()
        guard web.superview !== view else { return }
        web.removeFromSuperview()
        web.frame = view.bounds
        web.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.insertSubview(web, at: 0)   // under the back button
    }
}

// MARK: - Live tabs + native screens (Oct 22, phases 1 and 2)
// Each of the 5 tabs (Today, Plan, Tree, Progress, Me) is its own live screen that loads once and stays built,
// so switching tabs is instant. Deeper pages (Manage goals, a goal, Journal, Settings rows) slide in with the
// real iOS push and the real edge swipe to go back. A new page is fully drawn before it slides in, so it never
// shows half-built. When you change something, every screen you can't see quietly reloads so it's fresh.
@MainActor
final class KaizenTabs: UITabBarController, UITabBarControllerDelegate, UIGestureRecognizerDelegate, UINavigationControllerDelegate {
    static let roots = ["", "pages/plan", "pages/profile", "pages/calendar", "pages/me"]
    private var navs: [UINavigationController?] = Array(repeating: nil, count: 5)
    var current: Int { selectedIndex }
    static let items: [(String, String)] = [("Today", "checkmark.circle"), ("Plan", "list.bullet.clipboard"), ("Growth", "mountain.2"), ("Progress", "chart.bar"), ("Me", "person.crop.circle")]
    private var dirty = Set<ObjectIdentifier>()
    private var refreshTask: Task<Void, Never>?
    private var pending: (page: KaizenPage, nav: UINavigationController)?
    private var notifyBridge: KaizenBridge?
    // Nov 6 (James: tabs went black, Progress flashed an old look): a tab only shows once its page has drawn.
    // Tapping a tab that isn't drawn yet waits on the current screen (at most ~1.2 s), then switches.
    private var drawn = Set<ObjectIdentifier>()
    private var waitingTab: Int?
    private var waitTask: Task<Void, Never>?

    static func rootURL(_ i: Int) -> URL { URL(string: "kaizen://app/" + roots[i])! }

    /// Which tab a Kaizen address belongs to, if it's one of the 5 tab screens.
    static func tab(for url: URL) -> Int? {
        guard url.scheme?.lowercased() == "kaizen" else { return nil }
        var path = url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        if path == "index.html" { path = "" }
        return roots.firstIndex(of: path)
    }

    private static func samePage(_ a: URL?, _ b: URL) -> Bool {
        guard let a else { return false }
        return a.path == b.path && (a.query ?? "") == (b.query ?? "")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        // Oct 27 (James): opening Kaizen must not stop your music. The app's sounds (the check-off chime) mix with whatever
        // is playing and follow the silent switch, like a game's effects, instead of taking over audio.
        try? AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default, options: [.mixWithOthers])
        view.backgroundColor = kzBackground
        delegate = self
        // Oct 22 (pro pass): Apple's own tab bar. On iOS 26 it's the floating glass bar, the same one Hevy and Strava use.
        tabBar.tintColor = kzGold
        tabBar.unselectedItemTintColor = UIColor(red: 142 / 255, green: 142 / 255, blue: 147 / 255, alpha: 1)
        if #unavailable(iOS 26.0) {
            let look = UITabBarAppearance()
            look.configureWithOpaqueBackground()
            look.backgroundColor = kzBackground
            tabBar.standardAppearance = look
            tabBar.scrollEdgeAppearance = look
        }
        let list = (0..<5).map { makeNav($0) }
        navs = list
        setViewControllers(list, animated: false)
        selectedIndex = 0
        if let w = rootWeb(0) { load(w, Self.rootURL(0)) }
        // Build the other tabs in the background right after launch, one at a time, so the first tap on each is instant too
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 1_200_000_000)
            for i in 1..<5 {
                guard let self else { return }
                if let w = self.rootWeb(i) { self.load(w, Self.rootURL(i)) }
                self.prewarm(i)
                try? await Task.sleep(nanoseconds: 450_000_000)
            }
            // Oct 23: then build the deeper pages you open most, so they slide in instantly (no loading screen)
            try? await Task.sleep(nanoseconds: 600_000_000)
            for path in Self.warmPaths {
                guard let self else { return }
                self.buildWarm(path)
                try? await Task.sleep(nanoseconds: 450_000_000)
            }
        }
    }

    private func makeNav(_ i: Int) -> UINavigationController {
        let page = KaizenPage(web: makeWeb(tab: i, pushed: false))
        let n = UINavigationController(rootViewController: page)
        n.setNavigationBarHidden(true, animated: false)
        n.view.backgroundColor = kzBackground
        n.delegate = self
        n.interactivePopGestureRecognizer?.delegate = self
        let item = Self.items[i]
        n.tabBarItem = UITabBarItem(title: item.0, image: UIImage(systemName: item.1) ?? UIImage(systemName: "leaf"), tag: i)
        return n
    }

    /// A tab you haven't opened yet draws itself once just off screen, so the first time you tap it there's no blank frame.
    private func prewarm(_ i: Int) {
        guard let n = navs[i], n !== selectedViewController, n.view.superview == nil else { return }
        n.view.frame = view.bounds.offsetBy(dx: view.bounds.width + 40, dy: 0)
        view.insertSubview(n.view, at: 0)
        (n.viewControllers.first as? KaizenPage)?.attach()
        n.view.layoutIfNeeded()
        Task { @MainActor [weak self, weak n] in
            try? await Task.sleep(nanoseconds: 1_600_000_000)
            guard let self, let n, n !== self.selectedViewController, n.view.superview === self.view else { return }
            n.view.removeFromSuperview()
        }
    }

    func tabBarController(_ tabBarController: UITabBarController, shouldSelect viewController: UIViewController) -> Bool {
        UIImpactFeedbackGenerator(style: .light).impactOccurred(intensity: 0.7)
        // Tapping the tab you're on: back to its main screen (iOS does that), or scroll to the top if you're already there
        if viewController === selectedViewController, let n = viewController as? UINavigationController, n.viewControllers.count == 1 {
            (n.topViewController as? KaizenPage)?.web.evaluateJavaScript("window.scrollTo({top:0,behavior:'smooth'})", completionHandler: nil)
        }
        // Oct 27 (James): switching to another tab always opens it at the top (it used to keep where you'd scrolled to)
        if viewController !== selectedViewController, let n = viewController as? UINavigationController, let w = (n.topViewController as? KaizenPage)?.web {
            w.scrollView.setContentOffset(.zero, animated: false)
            w.evaluateJavaScript("window.scrollTo(0,0)", completionHandler: nil)
            // Nov 6 (James: "sometimes it doesn't let me" switch tabs): a tab that hasn't drawn yet gets a short head start
            // (at most 0.5 s from the FIRST tap, never reset by more taps), and tapping it again switches at once.
            // A tab whose data changed is no longer held back: it swaps to the fresh copy with a quick cross-fade.
            if let i = navs.firstIndex(where: { $0 === n }) {
                if w.url == nil && !w.isLoading, n.viewControllers.count == 1 { load(w, Self.rootURL(i)) }   // not started yet: start it now
                if !drawn.contains(ObjectIdentifier(w)) && waitingTab != i {
                    waitingTab = i
                    waitTask?.cancel()
                    waitTask = Task { @MainActor [weak self] in
                        try? await Task.sleep(nanoseconds: 500_000_000)
                        guard let self, !Task.isCancelled else { return }
                        self.finishWait(i)
                    }
                    return false
                }
            }
        }
        waitingTab = nil; waitTask?.cancel()
        return true
    }

    private func finishWait(_ i: Int) {
        guard waitingTab == i else { return }
        waitingTab = nil; waitTask?.cancel()
        selectedIndex = i
        refreshIfStale(visibleWeb); settleOverlay()
    }

    func tabBarController(_ tabBarController: UITabBarController, didSelect viewController: UIViewController) {
        refreshIfStale(visibleWeb); settleOverlay()
    }

    private func makeWeb(tab: Int, pushed: Bool) -> WKWebView {
        let bridge = KaizenBridge()
        bridge.tabs = self
        bridge.tab = tab
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()          // your data lives in the app and survives updates (shared by every screen)
        config.allowsInlineMediaPlayback = true
        config.applicationNameForUserAgent = "Mobile/15E148 KaizenApp/1"
        config.setURLSchemeHandler(KaizenFiles(), forURLScheme: "kaizen")
        // Oct 22: hand the page its on-device backup first, so it can restore itself if the web storage was ever wiped
        if let boot = KaizenVault.bootScript() {
            config.userContentController.addUserScript(WKUserScript(source: boot, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }
        config.userContentController.addUserScript(
            WKUserScript(source: KaizenBridge.script, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        // Oct 27: the page's own audio is "ambient" too (WebKit's Audio Session API), so a chime never pauses music
        config.userContentController.addUserScript(
            WKUserScript(source: "try{if(navigator.audioSession)navigator.audioSession.type='ambient'}catch(e){}", injectionTime: .atDocumentStart, forMainFrameOnly: false))
        config.mediaTypesRequiringUserActionForPlayback = .all
        config.userContentController.add(bridge, name: "kaizen")
        // The tab bar is native now: hide the page's own one and leave room for Apple's (none on deeper pages)
        let room = pushed ? "env(safe-area-inset-bottom,0px)" : "calc(64px + env(safe-area-inset-bottom,0px))"
        let shell = "window.__kzSolid=1;(function(){var s=document.createElement('style');s.textContent='.kz-tabbar{display:none!important}html:root:not(#kz-none){--tabh:\(room)}';document.documentElement.appendChild(s);" + (pushed ? "document.documentElement.classList.add('kz-pushed');var b=document.createElement('style');b.textContent='html.kz-pushed .kz-h49 .kz-hbar{padding-left:64px!important}html.kz-pushed .kz-lg-back{visibility:hidden!important}';document.documentElement.appendChild(b);" : "") + "})();"
        config.userContentController.addUserScript(WKUserScript(source: shell, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        // Oct 23: the gold launch animation plays once, on Today at a cold launch. Every other screen skips it.
        if pushed || tab != 0 {
            let quiet = "try{sessionStorage.setItem('kz_splash','1')}catch(e){};(function(){var s=document.createElement('style');s.textContent='#kz-splash{display:none!important}';document.documentElement.appendChild(s);})();"
            config.userContentController.addUserScript(WKUserScript(source: quiet, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }
        #if DEBUG
        // Recording kit (promo videos): only in Debug builds. App Store (Release) builds never load it, and the
        // release web bundle doesn't even contain kz-demo.js.
        config.userContentController.addUserScript(WKUserScript(source: KaizenBridge.debugFlags, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        if let url = Bundle.main.url(forResource: "Web", withExtension: "bundle")?.appendingPathComponent("kz-demo.js"),
           let js = try? String(contentsOf: url, encoding: .utf8) {
            config.userContentController.addUserScript(WKUserScript(source: js, injectionTime: .atDocumentEnd, forMainFrameOnly: true))
        }
        #endif

        let web = WKWebView(frame: view.bounds, configuration: config)
        web.isOpaque = true                       // Oct 22: solid background between pages, so nothing flashes through
        web.backgroundColor = kzBackground
        web.scrollView.backgroundColor = kzBackground
        web.underPageBackgroundColor = kzBackground
        web.scrollView.contentInsetAdjustmentBehavior = .never   // the theme handles the notch itself
        web.allowsBackForwardNavigationGestures = false          // going back is the native swipe now
        web.navigationDelegate = bridge
        web.uiDelegate = bridge
        bridge.web = web
        bridge.keepStillForKeyboard(web)   // Oct 22: tapping a text box only brings up the keyboard; nothing else moves
        KaizenNoKeyboardBar.apply(to: web)  // Oct 22: no ^ v ✓ bar above the keyboard (like Instagram and native apps)
        if notifyBridge == nil { notifyBridge = bridge; UNUserNotificationCenter.current().delegate = bridge }
        return web
    }

    private func load(_ web: WKWebView, _ url: URL) {
        drawn.remove(ObjectIdentifier(web))
        (web.navigationDelegate as? KaizenBridge)?.allowNext = true
        web.load(URLRequest(url: url))
    }

    private func nav(_ i: Int) -> UINavigationController { navs[i]! }

    private func rootWeb(_ i: Int) -> WKWebView? { (navs[i]?.viewControllers.first as? KaizenPage)?.web }
    private func webs(_ n: UINavigationController?) -> [WKWebView] { n?.viewControllers.compactMap { ($0 as? KaizenPage)?.web } ?? [] }
    var visibleWeb: WKWebView? { (navs[current]?.topViewController as? KaizenPage)?.web }

    /// Show tab i. Instant: the screen is already built.
    func show(_ i: Int) {
        selectedIndex = i
        refreshIfStale(visibleWeb)
    }

    /// Every Kaizen link goes through here. Returns true when the app handled it (the page shouldn't load it itself).
    func route(_ url: URL, from web: WKWebView, tab t: Int) -> Bool {
        let n = nav(t)
        if Self.samePage(web.url, url) || web.url?.path == url.path { return false }   // same page, only the #part changes
        let extra = url.fragment != nil || url.query != nil
        let fromRoot = rootWeb(t) === web
        if let to = Self.tab(for: url) {
            if to == t {
                if fromRoot { return false }
                n.popToRootViewController(animated: true)
                if extra, let r = rootWeb(t) { load(r, url) }
                return true
            }
            let target = nav(to)
            if extra, let r = rootWeb(to) { load(r, url) }   // like /#journal or /pages/plan#tomorrow: open that thing on the tab
            target.popToRootViewController(animated: false)
            show(to)
            if !fromRoot { n.popToRootViewController(animated: false) }
            return true
        }
        // A deeper page. Already one screen back? Go back to it. Otherwise slide a new screen in.
        if let back = n.viewControllers.dropLast().last(where: { Self.samePage(($0 as? KaizenPage)?.web.url, url) }) {
            n.popToViewController(back, animated: true)
            return true
        }
        push(url, on: n, tab: t)
        return true
    }

    // MARK: Prebuilt deeper pages (Oct 23)
    static let warmPaths = ["pages/my-goals", "pages/goal", "pages/journal", "pages/archived-goals", "pages/growth"]
    private var warm: [String: KaizenPage] = [:]
    private var switching = false   // a prebuilt goal screen is switching goals; ignore extra taps meanwhile
    private lazy var warmHost: UIView = {
        let v = UIView(frame: view.bounds.offsetBy(dx: view.bounds.width + 40, dy: 0))
        v.isUserInteractionEnabled = false
        v.backgroundColor = kzBackground
        view.insertSubview(v, at: 0)
        return v
    }()

    /// Build one deeper page off screen (inside the window, so it's fully drawn) and keep it ready.
    private func buildWarm(_ path: String) {
        guard warm[path] == nil else { return }
        let web = makeWeb(tab: 0, pushed: true)
        let page = KaizenPage(web: web)
        page.hidesBottomBarWhenPushed = true
        page.showsBack = true
        warmHost.frame = view.bounds.offsetBy(dx: view.bounds.width + 40, dy: 0)
        web.frame = warmHost.bounds
        warmHost.addSubview(web)
        warm[path] = page
        load(web, URL(string: "kaizen://app/" + path)!)
    }

    private func refill(_ path: String) {
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 1_200_000_000)
            self?.buildWarm(path)
        }
    }

    private func push(_ url: URL, on n: UINavigationController, tab t: Int) {
        guard pending == nil, !switching, n.transitionCoordinator == nil else { return }   // double taps never open a page twice
        let key = url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let goalID = key == "pages/goal" ? (URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems?.first(where: { $0.name == "id" })?.value) : nil
        let plain = url.fragment == nil && url.query == nil
        if (plain || goalID != nil), let page = warm.removeValue(forKey: key) {
            let w = page.web
            (w.navigationDelegate as? KaizenBridge)?.tab = t
            refill(key)
            let stale = dirty.remove(ObjectIdentifier(w)) != nil
            if stale {
                // something changed since it was built: reload it first, then slide it in when drawn
                pending = (page, n)
                if let goalID { load(w, URL(string: "kaizen://app/pages/goal?id=" + (goalID.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? goalID))!) } else { reloadQuietly(w) }
                Task { @MainActor [weak self] in
                    try? await Task.sleep(nanoseconds: 900_000_000)
                    self?.finishPush(w)
                }
                return
            }
            let slide = { [weak self] in
                guard self != nil, n.transitionCoordinator == nil else { return }
                page.attach()
                n.pushViewController(page, animated: true)
            }
            if let goalID {
                // the prebuilt goal screen just switches to this goal (no page load)
                switching = true
                w.evaluateJavaScript("window.__kzShowGoal ? (window.__kzShowGoal(\(KaizenBridge.jsString(goalID))), 1) : 0") { [weak self] r, _ in
                    self?.switching = false
                    if (r as? Int) == 1 {
                        // Oct 25 w: wait until the switched goal has fully drawn (tree picture, add-ons), then slide in
                        w.callAsyncJavaScript("return await (window.__kzSettle ? window.__kzSettle(500) : 1)", arguments: [:], in: nil, in: .page) { _ in slide() }
                    } else if let self {   // older page without the hook: load it normally
                        self.pending = (page, n)
                        self.load(w, url)
                        Task { @MainActor [weak self] in try? await Task.sleep(nanoseconds: 900_000_000); self?.finishPush(w) }
                    }
                }
            } else {
                w.evaluateJavaScript("window.scrollTo(0,0)", completionHandler: nil)
                slide()
            }
            return
        }
        let web = makeWeb(tab: t, pushed: true)
        let page = KaizenPage(web: web)
        page.hidesBottomBarWhenPushed = true   // deeper pages get the whole screen, like Hevy and Strava
        page.showsBack = true
        // Build it inside the window, just past the right edge, so it's fully drawn before it slides in
        let host: UIView = n.topViewController?.view ?? view
        web.frame = host.bounds.offsetBy(dx: host.bounds.width + 40, dy: 0)
        host.addSubview(web)
        pending = (page, n)
        load(web, url)
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 900_000_000)   // slow page: slide it in anyway rather than wait
            self?.finishPush(web)
        }
    }

    /// The page says its first frame is drawn.
    func pageReady(_ web: WKWebView?) {
        if let web {
            drawn.insert(ObjectIdentifier(web))
            if let i = waitingTab, let n = navs[i], (n.topViewController as? KaizenPage)?.web === web { finishWait(i) }
        }
        // Oct 26: the screen you're looking at has finished drawing: the launch skeleton can fade out
        if let web, web === visibleWeb { NotificationCenter.default.post(name: .kzFirstPaint, object: nil) }
        if let web, bufferReady(web) { return }; finishPush(web)
    }

    private func finishPush(_ web: WKWebView?) {
        guard let p = pending, let web, p.page.web === web else { return }
        pending = nil
        p.page.attach()
        p.nav.pushViewController(p.page, animated: true)
    }

    // Swipe from the left edge goes back, only when there's somewhere to go back to
    func gestureRecognizerShouldBegin(_ g: UIGestureRecognizer) -> Bool {
        guard let n = navs[current] else { return false }
        return n.viewControllers.count > 1 && n.transitionCoordinator == nil
    }

    func navigationController(_ n: UINavigationController, didShow vc: UIViewController, animated: Bool) {
        if n === navs[current] { refreshIfStale((vc as? KaizenPage)?.web); settleOverlay() }
    }

    /// Something you did on the screen you're looking at changed your saved data: every other screen reloads quietly.
    /// Oct 23: a sheet or pop-up on the visible screen hides the tab bar while it's open (iOS sheets cover the tab bar too).
    // Oct 27 t11f: the open state is remembered per screen and applied idempotently. Before, a close that arrived while
    // another screen was on top was dropped, the tab bar stayed "disabled" and the next sheet couldn't hide it
    // (James saw the tab bar sitting over the Add to-do button).
    private weak var overlayWeb: WKWebView?
    func overlay(open: Bool, from web: WKWebView?) {
        guard let web else { return }
        if open { guard web === visibleWeb else { return }; overlayWeb = web }
        else { guard web === overlayWeb || web === visibleWeb || overlayWeb == nil else { return }; overlayWeb = nil }
        applyOverlay(open, web: web)
    }
    /// Shows the tab bar again if the screen that hid it isn't the one on screen any more.
    func settleOverlay() {
        if let o = overlayWeb, o === visibleWeb { return }
        overlayWeb = nil
        if !tabBar.isUserInteractionEnabled || tabBar.alpha < 1 { applyOverlay(false, web: visibleWeb) }
    }
    private func applyOverlay(_ open: Bool, web: WKWebView?) {
        tabBar.isUserInteractionEnabled = !open
        // Oct 27: the native back arrow sat on top of sheets (over "Edit goal"); it steps aside with the tab bar
        let back = (navs[current]?.viewControllers.compactMap { $0 as? KaizenPage }.first { $0.web === web })?.backBtn
        back?.isUserInteractionEnabled = !open
        // Oct 28 (James's screen recording): a sheet slides up over the tab bar's spot at once, so the tab bar has to be gone
        // almost at once too (it sat on top of the notes sheet for the first frames); coming back keeps the gentle fade
        let opts: UIView.AnimationOptions = open ? [.beginFromCurrentState, .allowUserInteraction, .curveEaseOut] : [.beginFromCurrentState, .allowUserInteraction]
        UIView.animate(withDuration: open ? 0.08 : 0.22, delay: 0, options: opts) { self.tabBar.alpha = open ? 0 : 1; back?.alpha = open ? 0 : 1 }
    }

    func changed(from web: WKWebView?) {
        guard let web, web === visibleWeb else { return }   // hidden screens saving on load never trigger this (no reload loops)
        for w in allWebs() where w !== web { dirty.insert(ObjectIdentifier(w)) }
        refreshTask?.cancel()
        refreshTask = Task { @MainActor [weak self] in
            // Oct 27 t11: wait until the check-off animation and haptics have fully finished (and any quick
            // follow-up taps), so rebuilding hidden screens never competes with the one you're using
            try? await Task.sleep(nanoseconds: 1_200_000_000)
            guard let self, !Task.isCancelled else { return }
            let seen = self.visibleWeb
            for w in self.allWebs() where w !== seen && self.dirty.remove(ObjectIdentifier(w)) != nil {
                self.reloadQuietly(w)
                try? await Task.sleep(nanoseconds: 220_000_000)   // one screen at a time, so the one you're on stays smooth
                if Task.isCancelled { return }
            }
        }
    }

    private func allWebs() -> [WKWebView] { navs.flatMap { webs($0) } + warm.values.map { $0.web } }

    private func refreshIfStale(_ web: WKWebView?) {
        guard let web, dirty.remove(ObjectIdentifier(web)) != nil else { return }
        reloadQuietly(web)
    }

    private func reloadQuietly(_ w: WKWebView) {
        // Oct 25 v: a tab's main screen is rebuilt off screen and swapped in once it's fully drawn, so switching tabs
        // quickly never lands on a half-loaded page (James: "the add task thing isn't there / didn't load in quick enough")
        if let i = (0..<5).first(where: { rootWeb($0) === w }), navs[i]?.viewControllers.count == 1 { rebuild(i); return }
        // no slide-in animation on a quiet reload
        drawn.remove(ObjectIdentifier(w))
        w.evaluateJavaScript("try{sessionStorage.removeItem('kz_vtdir')}catch(e){}") { _, _ in w.reload() }
    }

    // MARK: Buffered refresh of the 5 tab screens (Oct 25 v)
    private var buffers: [Int: KaizenPage] = [:]
    private var rebuffer = Set<Int>()

    private func rebuild(_ i: Int) {
        if buffers[i] != nil { rebuffer.insert(i); return }   // one fresh copy at a time; again once it lands
        let web = makeWeb(tab: i, pushed: false)
        let page = KaizenPage(web: web)
        warmHost.frame = view.bounds.offsetBy(dx: view.bounds.width + 40, dy: 0)
        web.frame = warmHost.bounds
        warmHost.addSubview(web)
        buffers[i] = page
        load(web, Self.rootURL(i))
        // if the page never says it's drawn, swap anyway after a moment
        Task { @MainActor [weak self, weak web] in
            try? await Task.sleep(nanoseconds: 2_500_000_000)
            if let self, let web { _ = self.bufferReady(web) }
        }
    }

    /// The fresh copy has drawn its first frame: put it in place of the old one (cross-fade if you're looking at it).
    @discardableResult
    func bufferReady(_ web: WKWebView) -> Bool {
        guard let i = buffers.first(where: { $0.value.web === web })?.key, let page = buffers.removeValue(forKey: i), let n = navs[i] else { return false }
        let old = rootWeb(i)
        if n.viewControllers.count == 1 {
            let swap = {
                n.setViewControllers([page], animated: false)
                page.attach()
                page.view.layoutIfNeeded()
            }
            if n === selectedViewController, n.view.window != nil {
                UIView.transition(with: n.view, duration: 0.16, options: [.transitionCrossDissolve, .allowUserInteraction], animations: swap)
            } else { swap() }
            if let old, old !== page.web { retire(old, for: page.web) }
        } else {
            retire(page.web, for: nil)   // a deeper page was opened meanwhile: keep what's there, it reloads the old way
            if let old { old.evaluateJavaScript("try{sessionStorage.removeItem('kz_vtdir')}catch(e){}") { _, _ in old.reload() } }
        }
        if rebuffer.remove(i) != nil { rebuild(i) }
        if waitingTab == i { finishWait(i) }
        return true
    }

    private func retire(_ w: WKWebView, for replacement: WKWebView?) {
        dirty.remove(ObjectIdentifier(w))
        if let nb = notifyBridge, nb.web === w || nb.web == nil, let r = replacement, let b = r.navigationDelegate as? KaizenBridge {
            notifyBridge = b; UNUserNotificationCenter.current().delegate = b
        }
        w.stopLoading()
        w.configuration.userContentController.removeAllScriptMessageHandlers()
        w.removeFromSuperview()
    }

    /// iOS killed one screen's page (low memory): rebuild just that screen.
    func restart(_ web: WKWebView, tab: Int) {
        if rootWeb(tab) === web { load(web, Self.rootURL(tab)) } else { web.reload() }
    }
}

// MARK: - Bridge between the Kaizen page and iPhone features

@MainActor
final class KaizenBridge: NSObject, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate, UNUserNotificationCenterDelegate {
    weak var web: WKWebView?
    weak var tabs: KaizenTabs?
    var tab = 0
    var allowNext = false   // the app itself asked this screen to load a page

    // MARK: Keyboard: nothing moves (Oct 22)
    // iOS normally slides the whole web view (header, background, everything) to "reveal" the box you tapped.
    // From the tap until the keyboard has finished opening (or closing), the scroll position is held exactly
    // where it was. Afterwards the page checks the box itself and lifts only that box's sheet if the keyboard covers it.
    private var kbHold: CGPoint?
    private var kbWatch: NSKeyValueObservation?
    private var kbToken = 0

    func keepStillForKeyboard(_ web: WKWebView) {
        kbWatch = web.scrollView.observe(\.contentOffset, options: [.new]) { [weak self] sv, _ in
            MainActor.assumeIsolated {
                guard let self, let hold = self.kbHold, sv.contentOffset != hold else { return }
                sv.contentOffset = hold
            }
        }
        let nc = NotificationCenter.default
        nc.addObserver(self, selector: #selector(kbWillMove(_:)), name: UIResponder.keyboardWillShowNotification, object: nil)
        nc.addObserver(self, selector: #selector(kbWillMove(_:)), name: UIResponder.keyboardWillHideNotification, object: nil)
        nc.addObserver(self, selector: #selector(kbDidShow(_:)), name: UIResponder.keyboardDidShowNotification, object: nil)
        nc.addObserver(self, selector: #selector(kbDidHide(_:)), name: UIResponder.keyboardDidHideNotification, object: nil)
    }

    private func holdScroll(for seconds: Double) {
        if kbHold == nil, let w = web { kbHold = w.scrollView.contentOffset }
        kbToken += 1
        let token = kbToken
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
            guard let self, self.kbToken == token else { return }
            self.kbHold = nil
        }
    }

    @objc private func kbWillMove(_ n: Notification) { holdScroll(for: 1.2) }

    @objc private func kbDidShow(_ n: Notification) {
        holdScroll(for: 0.12)
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 150_000_000)
            self?.web?.evaluateJavaScript("window.__kzKbShown && window.__kzKbShown()", completionHandler: nil)
        }
    }

    @objc private func kbDidHide(_ n: Notification) { holdScroll(for: 0.12) }

    // Runs inside the page before Kaizen's own code. It makes the existing theme use native features
    // without changing the theme: vibrate -> haptics, share/download -> share sheet, "installed" mode on.
    static let script = """
    (function () {
      if (window.KaizenNative) return;
      var post = function (m) { try { window.webkit.messageHandlers.kaizen.postMessage(m); } catch (e) {} };
      window.KaizenNative = { version: 1 };
      var def = function (name, value) { try { Object.defineProperty(Navigator.prototype, name, { configurable: true, value: value }); } catch (e) {} };
      try { Object.defineProperty(Navigator.prototype, 'standalone', { configurable: true, get: function () { return true; } }); } catch (e) {}
      def('vibrate', function (p) { post({ type: 'haptic', n: Array.isArray(p) ? p.length : 1 }); return true; });
      var toB64 = function (blob) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1] || ''); }; r.onerror = rej; r.readAsDataURL(blob); }); };
      var sendFile = function (blob, name, text) { return toB64(blob).then(function (d) { post({ type: 'file', name: name || 'kaizen-file', data: d, text: text || '' }); }); };
      def('canShare', function (d) { return !!d; });
      def('share', function (d) {
        d = d || {}; var f = d.files && d.files[0], text = [d.text, d.url].filter(Boolean).join(' ');
        if (f) return sendFile(f, f.name, text);
        post({ type: 'text', text: text }); return Promise.resolve();
      });
      var click = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        if (this.download && /^blob:/.test(this.href)) { var name = this.download; fetch(this.href).then(function (r) { return r.blob(); }).then(function (b) { return sendFile(b, name); }); return; }
        return click.apply(this, arguments);
      };
      // Oct 22: on-device backup. If the page's storage is empty but the app holds a backup, put it back before Kaizen starts.
      // After that, every change is mirrored to a file inside the app (debounced, and right away when you leave the app).
      var KEEP = /^(kz_|kzreset$|kzreset_done$)/;
      var snap = function () { try { var o = {}; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (KEEP.test(k)) o[k] = localStorage.getItem(k); } return JSON.stringify(o); } catch (e) { return null; } };
      try {
        var V = window.__kzVaultData, has = false;
        for (var i = 0; i < localStorage.length; i++) { if (KEEP.test(localStorage.key(i) || '')) { has = true; break; } }
        var wiped = false; try { wiped = localStorage.getItem('kzvault_wiped') === '1'; } catch (e) {}
        if (!has && !wiped && V && typeof V === 'object') { var n = 0; for (var k in V) { if (KEEP.test(k) && typeof V[k] === 'string') { localStorage.setItem(k, V[k]); n++; } } if (n) post({ type: 'log', msg: 'KZ restored ' + n + ' items from the on-device backup' }); }
      } catch (e) {}
      window.__kzVaultData = null;
      var last = snap(), vt = 0;
      var flush = function () { clearTimeout(vt); vt = 0; var s = snap(); if (s !== null && s !== last) { last = s; post({ type: 'vault', data: s }); } };
      var soon = function () { if (!vt) vt = setTimeout(flush, 1200); };
      // Oct 22 (live tabs): a real change you made (right after a tap) tells the app, so the other tabs refresh
      var touched = 0, dt = 0; ['touchend', 'click', 'keyup', 'change'].forEach(function (ev) { document.addEventListener(ev, function () { touched = Date.now(); }, true); });
      var dirty = function () { if (dt || Date.now() - touched > 4000) return; dt = setTimeout(function () { dt = 0; post({ type: 'dirty' }); }, 250); };
      try { var SP = Storage.prototype; ['setItem', 'removeItem', 'clear'].forEach(function (m) { var f = SP[m]; SP[m] = function (k, v) { var ls = false, before = null; try { ls = this === window.localStorage; if (ls && m === 'setItem') before = this.getItem(k); } catch (e) {} var r = f.apply(this, arguments); try { if (ls) { soon(); if (m !== 'setItem' || (/^kz_/.test(String(k)) && before !== String(v))) dirty(); } } catch (e) {} return r; }; }); } catch (e) {}
      document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); });
      window.addEventListener('pagehide', flush);
      var demo = function () { try { return localStorage.getItem('kzdemo_on') === '1'; } catch (e) { return false; } };
      document.addEventListener('kz:alldone', function () { if (!demo()) post({ type: 'alldone' }); });
      window.addEventListener('error', function (e) { if (!e.target || e.target === window) post({ type: 'log', msg: 'KZJS ' + e.message + ' @' + e.lineno }); }, true);
      // Oct 22: tell the app once the first frame is drawn, so a new screen only slides in when it's ready
      // Oct 25 w: "drawn" means settled: the pictures on screen have loaded and nothing has changed for ~90 ms (late parts
      // added by the page's add-ons included), at most 700 ms. Screens slide in, and refreshed tabs swap in, only then.
      window.__kzSettle = function (max) {
        return new Promise(function (done) {
          var t0 = Date.now(), last = Date.now(), mo = null, cap = max || 700, gate = function () { return !window.__kzGate || document.documentElement.classList.contains('kz-dressed'); };
          if (window.__kzGate) cap = Math.max(cap, 3200);   // Oct 28: the page says when it's finished (kzgate-1028.js); wait for that, up to 1.7 s
          try { mo = new MutationObserver(function () { last = Date.now(); }); mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true }); } catch (e) {}
          var imgs = function () { var h = innerHeight, ok = true; Array.prototype.forEach.call(document.images, function (i) { var r = i.getBoundingClientRect(); if (r.width && r.bottom > 0 && r.top < h && !i.complete) ok = false; }); return ok; };
          var check = function () { var now = Date.now(); if ((now - last > 90 && imgs() && gate()) || now - t0 > cap) { if (mo) mo.disconnect(); done(1); } else requestAnimationFrame(check); };
          requestAnimationFrame(function () { requestAnimationFrame(check); });
        });
      };
      var painted = function () { window.__kzSettle(700).then(function () { post({ type: 'painted' }); }); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', painted); else painted();
      var ready = function () {
        try { document.documentElement.classList.add('kz-native', 'kz-standalone'); } catch (e) {}
        var s = document.createElement('style'); s.textContent = '.kz-native [data-kz-open-install]{display:none!important}'; document.head.appendChild(s);
        setTimeout(function () { try { var K = window.KZ; if (!demo() && K && K.get && K.get('alldone', '') === K.key(K.today())) post({ type: 'alldone' }); } catch (e) {} }, 800);
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
    })();
    """

    #if DEBUG
    // Debug only: mark the build, and in demo mode switch off the XP test boost so the fake account shows real numbers
    static let debugFlags = """
    window.KZ_DEBUG = 1;
    try { if (localStorage.getItem('kzdemo_on') === '1') Object.defineProperty(window, 'KZ_DEV_XP', { get: function () { return 0; }, set: function () {}, configurable: false }); } catch (e) {}
    """
    #endif

    // Messages from the page
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        // Security (Oct 21): only Kaizen's own top-level page may use the bridge — never an iframe or a website
        guard message.frameInfo.isMainFrame, message.frameInfo.request.url?.scheme?.lowercased() == "kaizen" else { return }
        guard let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        switch type {
        case "tick":   // every button press: a light tap
            UIImpactFeedbackGenerator(style: .light).impactOccurred(intensity: 0.7)
        case "buzz":   // Oct 30: the timer's alarm, "Buzz only" or with sound. The phone's real vibration, stronger than a tap.
            AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
        case "haptic":
            if (body["n"] as? Int ?? 1) > 1 {
                UINotificationFeedbackGenerator().notificationOccurred(.success)
            } else {
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            }
        case "file":
            // Security (Oct 25): share files are at most 12 MB
            guard let name = body["name"] as? String, let b64 = body["data"] as? String, b64.utf8.count < 16_000_000,
                  let data = Data(base64Encoded: b64), data.count < 12_000_000 else { return }
            // Security (Oct 21): keep only the file name, so a name like "../../x" can't write outside the temp folder
            let safeName = (name as NSString).lastPathComponent
            guard !safeName.isEmpty, safeName != ".", safeName != ".." else { return }
            let url = FileManager.default.temporaryDirectory.appendingPathComponent(safeName)
            try? data.write(to: url, options: .atomic)
            var items: [Any] = [url]
            if let text = body["text"] as? String, !text.isEmpty { items.append(KaizenLinks.cleanShare(text)) }
            presentShare(items)
        case "text":
            if let text = body["text"] as? String, !text.isEmpty { presentShare([KaizenLinks.cleanShare(text)]) }
        case "log":
            #if DEBUG
            print(String(((body["msg"] as? String) ?? "").prefix(500)))
            #endif
        case "vault":   // Oct 22: on-device backup of the page's saved data
            if let data = body["data"] as? String { KaizenVault.save(data) }
        case "wipe":    // Oct 22: "Delete my data" - also clear everything Kaizen keeps outside the page
            KaizenVault.save("{}")
            let defaults = UserDefaults.standard
            for key in defaults.dictionaryRepresentation().keys where key.hasPrefix("kz.") { defaults.removeObject(forKey: key) }
            let center = UNUserNotificationCenter.current()
            center.removeAllPendingNotificationRequests()
            center.removeAllDeliveredNotifications()
            let tmp = FileManager.default.temporaryDirectory
            if let files = try? FileManager.default.contentsOfDirectory(at: tmp, includingPropertiesForKeys: nil) {
                for f in files { try? FileManager.default.removeItem(at: f) }
            }
        case "review":   // Oct 22: Apple's rating prompt - the page only asks right after a real win, at most every 120 days
            // Security (Oct 25): at most once per app launch, whatever the page asks
            if !KaizenLinks.reviewAsked, let scene = UIApplication.shared.connectedScenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
                KaizenLinks.reviewAsked = true
                AppStore.requestReview(in: scene)
            }
        case "trialReminder":   // Oct 22: 2 days before a free trial ends (only the paywall sends this, once it exists)
            if let ms = body["ends"] as? Double, let price = body["price"] as? String, !price.isEmpty {
                KaizenTrialReminder.schedule(ends: Date(timeIntervalSince1970: ms / 1000), price: price)
            }
        case "trialReminderOff":
            UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [KaizenTrialReminder.id])
        case "pageScroll":   // Oct 22: while a sheet or pop-up is open, the page behind it can't scroll at all
            let on = (body["on"] as? Bool) ?? true
            web?.scrollView.isScrollEnabled = on
            // Oct 23: and the tab bar steps aside, like any iOS sheet, so the sheet's bottom buttons (Lock in, Add goal, Share...) can be tapped
            tabs?.overlay(open: !on, from: message.webView)
        case "kbHold":   // Oct 22: a text box was just tapped - hold the view still until the keyboard is up
            holdScroll(for: 0.7)
        case "dirty":   // Oct 22 (live tabs): saved data changed on this screen
            tabs?.changed(from: message.webView)
        case "painted":   // Oct 22: the page has drawn its first frame (a new screen can slide in now)
            tabs?.pageReady(message.webView)
        case "alldone":
            KaizenReminders.skipTonight()
        case "remindersOff":   // "Turn off reminders" in the Reminders sheet
            KaizenReminders.disable()
        case "notifySync":
            // Oct 25 r: reminders you set (Me → Reminders). The page sends the exact reminders for the coming days, already
            // written with only what's left; the phone checks them and keeps exactly those (ids "kzn-"). Sent again after
            // every check-off, so finishing everything removes the rest of today's.
            let items = body["items"] as? [[String: Any]] ?? []
            let on = body["on"] as? Bool ?? false
            let ask = body["ask"] as? Bool ?? false
            KaizenNotify.sync(items, on: on, ask: ask) { [weak self] ok in
                if ask && !ok { self?.notificationsOff() }
            }
        case "todoSync":
            // To-dos with a set time: the page sends every upcoming reminder; the phone keeps exactly those
            let items = body["items"] as? [[String: Any]] ?? []
            let ask = body["ask"] as? Bool ?? false
            KaizenTodoReminders.sync(items, ask: ask) { [weak self] ok in
                if ask && !ok { self?.notificationsOff() }
            }
        default:
            break
        }
    }

    // Links: Kaizen's own pages stay in the app, every website (like the Shop) opens in Safari.
    // The Reminders button opens a calendar file; here it schedules real notifications instead.
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction) async -> WKNavigationActionPolicy {
        guard let url = navigationAction.request.url else { return .allow }
        if handleReminderLink(url) { return .cancel }
        let scheme = url.scheme?.lowercased() ?? ""
        // Oct 22 (live tabs + native screens): tab links switch tabs, deeper pages slide in as their own screen
        if scheme == "kaizen", navigationAction.targetFrame?.isMainFrame ?? true {
            if allowNext { allowNext = false; return .allow }
            if navigationAction.navigationType != .reload, navigationAction.navigationType != .backForward,
               let tabs, tabs.route(url, from: webView, tab: tab) { return .cancel }
        }
        if scheme == "kaizen" || scheme == "about" || scheme == "blob" || scheme == "data" { return .allow }
        if scheme != "http" && scheme != "https" {
            // Security (Oct 25): only mail, messages and phone links may leave the app; any other app's link is dropped
            if KaizenLinks.external(url) { _ = await UIApplication.shared.open(url) }
            return .cancel
        }
        let isMainFrame = navigationAction.targetFrame?.isMainFrame ?? true
        if isMainFrame {
            _ = await UIApplication.shared.open(url)
            return .cancel
        }
        // Security (Oct 25): Kaizen never shows a website inside a page (no iframes from the internet)
        return .cancel
    }

    // window.open(...) and target="_blank"
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        guard let url = navigationAction.request.url else { return nil }
        if handleReminderLink(url) { return nil }
        if url.scheme == "kaizen" { if let tabs, tabs.route(url, from: webView, tab: tab) { return nil }; webView.load(URLRequest(url: url)) } else if KaizenLinks.external(url) { UIApplication.shared.open(url) }   // Security (Oct 25): same allowlist as links
        return nil
    }

    // If iOS ever kills the page's web process (low memory in the background, a crash), load it again
    // instead of leaving a blank screen. Your data lives in local storage, so nothing is lost.
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        if let tabs { tabs.restart(webView, tab: tab) } else { webView.load(URLRequest(url: kaizenHome)) }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if let tabs, tabs.visibleWeb !== webView { return }   // quiet background reloads do not need to reschedule
        KaizenReminders.refresh()   // keeps the next two weeks of reminders scheduled
    }

    // Show alerts and confirm() dialogs from the page as iPhone alerts
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo) async {
        await withCheckedContinuation { (done: CheckedContinuation<Void, Never>) in
            let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            a.addAction(UIAlertAction(title: "OK", style: .default) { _ in done.resume() })
            if !present(a) { done.resume() }
        }
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo) async -> Bool {
        await withCheckedContinuation { (done: CheckedContinuation<Bool, Never>) in
            let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            a.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in done.resume(returning: false) })
            a.addAction(UIAlertAction(title: "OK", style: .default) { _ in done.resume(returning: true) })
            if !present(a) { done.resume(returning: false) }
        }
    }

    // Show reminders even while the app is open
    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        [.banner, .sound]
    }

    // MARK: helpers

    /// Kaizen's reminder files are named kaizen-remind-HHMM.ics (with evening rescue) or kaizen-remind-HHMM-am.ics.
    private func handleReminderLink(_ url: URL) -> Bool {
        let file = url.lastPathComponent
        guard file.hasPrefix("kaizen-remind-"), file.hasSuffix(".ics") else { return false }
        let code = file.dropFirst("kaizen-remind-".count).prefix(4)
        guard code.count == 4, let hhmm = Int(code) else { return false }
        let hour = hhmm / 100, minute = hhmm % 100, evening = !file.hasSuffix("-am.ics")
        web?.evaluateJavaScript("(window.KZ && KZ.treeNamed && KZ.treeNamed()) ? KZ.treeName() : ''") { [weak self] result, _ in
            let name = (result as? String).flatMap { $0.isEmpty ? nil : $0 } ?? "your tree"
            KaizenReminders.enable(hour: hour, minute: minute, evening: evening, treeName: name) { granted in
                self?.confirmReminders(granted: granted, hour: hour, minute: minute, evening: evening)
            }
        }
        return true
    }

    private func confirmReminders(granted: Bool, hour: Int, minute: Int, evening: Bool) {
        let time = KaizenReminders.label(hour: hour, minute: minute)
        let text = granted
            ? "Reminders on: \(time) every morning" + (evening ? ", plus 8:00 PM on days you still have goals left." : ".")
            : "Notifications are off for Kaizen. Turn them on in iPhone Settings → Notifications → Kaizen."
        let js = "document.querySelectorAll('[data-kz-rem-done]').forEach(function(e){e.hidden=false;e.textContent=\(Self.jsString(text));});"
        web?.evaluateJavaScript(js, completionHandler: nil)
        if granted { UINotificationFeedbackGenerator().notificationOccurred(.success) }
        if !granted, let settings = URL(string: UIApplication.openSettingsURLString) {
            let a = UIAlertController(title: "Turn on notifications", message: text, preferredStyle: .alert)
            a.addAction(UIAlertAction(title: "Not now", style: .cancel))
            a.addAction(UIAlertAction(title: "Open Settings", style: .default) { _ in UIApplication.shared.open(settings) })
            _ = present(a)
        }
    }

    private func notificationsOff() {
        guard let settings = URL(string: UIApplication.openSettingsURLString) else { return }
        let a = UIAlertController(title: "Turn on notifications",
                                  message: "Kaizen can't remind you about this to-do until notifications are on. iPhone Settings → Notifications → Kaizen.",
                                  preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "Not now", style: .cancel))
        a.addAction(UIAlertAction(title: "Open Settings", style: .default) { _ in UIApplication.shared.open(settings) })
        _ = present(a)
    }

    static func jsString(_ s: String) -> String {
        let data = try? JSONSerialization.data(withJSONObject: [s])
        let arr = data.flatMap { String(data: $0, encoding: .utf8) } ?? "[\"\"]"
        return String(arr.dropFirst().dropLast())
    }

    private func presentShare(_ items: [Any]) {
        // Security (Oct 25): one share sheet at a time, at most one every 1.5 s
        guard Date().timeIntervalSince(KaizenLinks.lastShare) > 1.5 else { return }
        KaizenLinks.lastShare = Date()
        let sheet = UIActivityViewController(activityItems: items, applicationActivities: nil)
        if let pop = sheet.popoverPresentationController, let v = web {
            pop.sourceView = v
            pop.sourceRect = CGRect(x: v.bounds.midX, y: v.bounds.maxY - 80, width: 1, height: 1)
        }
        _ = present(sheet)
    }

    @discardableResult
    private func present(_ vc: UIViewController) -> Bool {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        guard var top = scenes.flatMap({ $0.windows }).first(where: { $0.isKeyWindow })?.rootViewController else { return false }
        while let next = top.presentedViewController { top = next }
        top.present(vc, animated: true)
        return true
    }
}

// MARK: - Reminders (iPhone notifications, scheduled on the phone itself)

@MainActor
enum KaizenReminders {
    private static let store = UserDefaults.standard
    private static let days = 14   // keeps 14 days scheduled; refreshed every time you open the app

    static func label(hour: Int, minute: Int) -> String {
        let h12 = hour % 12 == 0 ? 12 : hour % 12
        return "\(h12):" + String(format: "%02d", minute) + (hour >= 12 ? " PM" : " AM")
    }

    static func enable(hour: Int, minute: Int, evening: Bool, treeName: String, done: @escaping (Bool) -> Void) {
        store.set(true, forKey: "kz.rem.on")
        store.set(hour, forKey: "kz.rem.h")
        store.set(minute, forKey: "kz.rem.m")
        store.set(evening, forKey: "kz.rem.eve")
        store.set(treeName, forKey: "kz.rem.tree")
        Task { @MainActor in
            let granted = (try? await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge])) ?? false
            if granted { refresh() }
            done(granted)
        }
    }

    /// Turns the daily reminders off and cancels every one already scheduled (to-do reminders are separate: "kzt-").
    static func disable() {
        store.set(false, forKey: "kz.rem.on")
        let center = UNUserNotificationCenter.current()
        Task { @MainActor in
            let pending = await center.pendingNotificationRequests()
            center.removePendingNotificationRequests(withIdentifiers: pending.map(\.identifier).filter { $0.hasPrefix("kz-am-") || $0.hasPrefix("kz-eve-") })
        }
    }

    /// Call when every goal is done today: removes tonight's rescue reminder.
    static func skipTonight() {
        let today = dayKey(Date())
        store.set(today, forKey: "kz.rem.skip")
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["kz-eve-\(today)"])
    }

    static func refresh() {
        guard store.bool(forKey: "kz.rem.on") else { return }
        let center = UNUserNotificationCenter.current()
        let hour = store.integer(forKey: "kz.rem.h"), minute = store.integer(forKey: "kz.rem.m")
        let evening = store.bool(forKey: "kz.rem.eve")
        let skip = store.string(forKey: "kz.rem.skip") ?? ""
        Task { @MainActor in
            let pending = await center.pendingNotificationRequests()
            let old = pending.map(\.identifier).filter { $0.hasPrefix("kz-") }
            center.removePendingNotificationRequests(withIdentifiers: old)
            let cal = Calendar.current, now = Date()
            // Oct 23 (Phase 3): never more than two a day. These are planned every time Kaizen opens, so "offset" is also
            // how many days you've been away on that day. Days 0-2: the morning nudge, plus the 8 PM rescue (skipped tonight
            // once every goal is done). From day 3 away: one gentle "welcome back" in the morning, no rescue, and from day 7
            // only every third day. Nothing past two weeks.
            for offset in 0..<days {
                guard let day = cal.date(byAdding: .day, value: offset, to: cal.startOfDay(for: now)) else { continue }
                let key = dayKey(day)
                if offset >= 3 {
                    if offset >= 7 && (offset - 7) % 3 != 0 { continue }
                    add(center, id: "kz-am-\(key)", day: day, hour: hour, minute: minute, now: now,
                        title: "Welcome back whenever you're ready", body: "You haven't lost a single foot. One check-off is enough to start climbing again.")
                    continue
                }
                add(center, id: "kz-am-\(key)", day: day, hour: hour, minute: minute, now: now,
                    title: "Plan today", body: "Check today's goals. Every check-off climbs 131 ft.")
                if evening && key != skip {
                    add(center, id: "kz-eve-\(key)", day: day, hour: 20, minute: 0, now: now,
                        title: "Goals left today", body: "There's still time. One check-off climbs 131 ft.")
                }
            }
        }
    }

    private static func add(_ center: UNUserNotificationCenter, id: String, day: Date, hour: Int, minute: Int,
                            now: Date, title: String, body: String) {
        var parts = Calendar.current.dateComponents([.year, .month, .day], from: day)
        parts.hour = hour
        parts.minute = minute
        guard let fire = Calendar.current.date(from: parts), fire > now else { return }
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        let trigger = UNCalendarNotificationTrigger(dateMatching: parts, repeats: false)
        center.add(UNNotificationRequest(identifier: id, content: content, trigger: trigger), withCompletionHandler: nil)
    }

    private static func dayKey(_ d: Date) -> String {
        let c = Calendar.current.dateComponents([.year, .month, .day], from: d)
        return String(format: "%04d%02d%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }
}

// MARK: - On-device backup (Oct 22)
// A copy of everything Kaizen saves, kept in the app's own Application Support folder (included in iPhone backups).
// If iOS ever clears the web view's storage, the page restores itself from this copy on the next launch.
// Deleting your data in Kaizen also empties this copy.
enum KaizenVault {
    private static let queue = DispatchQueue(label: "kaizen.vault", qos: .utility)
    static var url: URL? {
        guard let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first?
            .appendingPathComponent("Kaizen", isDirectory: true) else { return nil }
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("data.json")
    }
    static func save(_ json: String) {
        guard json.utf8.count < 8_000_000, let data = json.data(using: .utf8) else { return }
        queue.async {
            guard (try? JSONSerialization.jsonObject(with: data)) is [String: Any], let url else { return }
            try? data.write(to: url, options: [.atomic, .completeFileProtection])   // Security (Oct 25, James): locked whenever the phone is locked
        }
    }
    static func bootScript() -> String? {
        guard let url, let data = try? Data(contentsOf: url), data.count < 8_000_000,
              (try? JSONSerialization.jsonObject(with: data)) is [String: Any],
              let json = String(data: data, encoding: .utf8) else { return nil }
        return "window.__kzVaultData = " + json + ";"
    }
}

// MARK: - Security (Oct 25): which links may leave the app, and share text clean-up

@MainActor
enum KaizenLinks {
    static var lastShare = Date.distantPast
    static var reviewAsked = false
    /// Only mail, messages and phone links open other apps. Web links open in Safari (handled by the caller).
    static func external(_ url: URL) -> Bool {
        let s = url.scheme?.lowercased() ?? ""
        return s == "mailto" || s == "sms" || s == "tel" || s == "https" || s == "http"
    }
    /// The old Shopify test-store address never goes out in a share.
    static func cleanShare(_ text: String) -> String {
        let t = String(text.prefix(4000))
        guard let re = try? NSRegularExpression(pattern: "https?://[^\\s]*myshopify\\.com[^\\s]*", options: [.caseInsensitive]) else { return t }
        return re.stringByReplacingMatches(in: t, range: NSRange(t.startIndex..., in: t), withTemplate: "").trimmingCharacters(in: .whitespaces)
    }
}

// MARK: - Serves Kaizen's files from inside the app

@MainActor
final class KaizenFiles: NSObject, WKURLSchemeHandler {
    private let root = Bundle.main.url(forResource: "Web", withExtension: "bundle")
    nonisolated(unsafe) private static let memory: NSCache<NSString, NSData> = { let c = NSCache<NSString, NSData>(); c.totalCostLimit = 24 * 1024 * 1024; return c }()
    private static let routes = [
        "": "index.html", "pages/plan": "plan.html", "pages/me": "me.html", "pages/profile": "profile.html", "pages/calendar": "calendar.html",
        "pages/my-goals": "goals.html", "pages/journal": "journal.html", "pages/archived-goals": "archive.html",
        "pages/goal": "goal.html", "pages/growth": "growth.html", "pages/account": "account.html",
    ]
    private static let types = [
        "html": "text/html; charset=utf-8", "js": "text/javascript; charset=utf-8", "css": "text/css; charset=utf-8",
        "woff2": "font/woff2", "png": "image/png", "svg": "image/svg+xml", "json": "application/json", "webp": "image/webp",
    ]

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url, let root else {
            task.didFailWithError(URLError(.fileDoesNotExist)); return
        }
        let path = url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        var file = root.appendingPathComponent(Self.routes[path] ?? path).standardizedFileURL
        // Security (Oct 21): never serve anything outside Web.bundle (blocks "../" paths)
        let rootPath = root.standardizedFileURL.path
        if !file.path.hasPrefix(rootPath + "/") || !FileManager.default.fileExists(atPath: file.path) { file = root.appendingPathComponent("index.html") }
        // Oct 22 (speed): shared files are read from disk once, then served from memory
        let isPage = file.pathExtension.lowercased() == "html"
        let cacheKey = file.path as NSString
        var loaded = isPage ? nil : Self.memory.object(forKey: cacheKey) as Data?
        if loaded == nil { loaded = try? Data(contentsOf: file); if let d = loaded, !isPage { Self.memory.setObject(d as NSData, forKey: cacheKey, cost: d.count) } }
        guard let data = loaded else {
            task.didFailWithError(URLError(.fileDoesNotExist)); return
        }
        let type = Self.types[file.pathExtension.lowercased()] ?? "application/octet-stream"
        // Pages always load fresh; shared core files have a content hash in their name, so the web view may keep them
        let cache = isPage ? "no-cache" : (file.path.contains("/core/") ? "max-age=31536000, immutable" : "max-age=3600")
        let headers = ["Content-Type": type, "Content-Length": String(data.count), "Cache-Control": cache]
        if let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers) {
            task.didReceive(response)
        }
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
}

// MARK: - To-do reminders (one notification per to-do with a set time, scheduled on the phone)

@MainActor
// MARK: - Reminders you set (Oct 25 r)
// The page (core/kznotify-1025r.js) works out every reminder: when, title, and what's left. This only checks them and
// schedules them. Never more than 50 (iOS keeps 64 per app; timed to-dos use the rest). Debounced: the last message in
// 400 ms wins, so ticking off five things quickly reschedules once.
enum KaizenNotify {
    nonisolated(unsafe) private static var pendingWork: DispatchWorkItem?

    static func sync(_ items: [[String: Any]], on: Bool, ask: Bool, done: @escaping (Bool) -> Void) {
        pendingWork?.cancel()
        let work = DispatchWorkItem { apply(items, on: on, ask: ask, done: done) }
        pendingWork = work
        DispatchQueue.main.asyncAfter(deadline: .now() + (ask ? 0 : 0.4), execute: work)
    }

    private static func clean(_ s: Any?, max: Int) -> String {
        let t = (s as? String ?? "").replacingOccurrences(of: "<", with: "").replacingOccurrences(of: ">", with: "")
        return String(t.prefix(max))
    }

    private static func apply(_ items: [[String: Any]], on: Bool, ask: Bool, done: @escaping (Bool) -> Void) {
        Task { @MainActor in
            let center = UNUserNotificationCenter.current()
            let pending = await center.pendingNotificationRequests()
            center.removePendingNotificationRequests(withIdentifiers: pending.map(\.identifier).filter { $0.hasPrefix("kzn-") })
            guard on else { done(true); return }
            KaizenReminders.disable()   // the old morning/evening reminders step aside: one system, no doubles
            var settings = await center.notificationSettings()
            if settings.authorizationStatus == .notDetermined && ask {
                _ = try? await center.requestAuthorization(options: [.alert, .sound, .badge])
                settings = await center.notificationSettings()
            }
            let ok = settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional
            guard ok else { done(false); return }
            let now = Date().timeIntervalSince1970, horizon = now + 8 * 86400
            var seen = Set<String>()
            for item in items.prefix(50) {
                guard let rawId = item["id"] as? String, rawId.hasPrefix("kzn-"), rawId.count <= 40,
                      rawId.allSatisfy({ $0.isLetter || $0.isNumber || $0 == "-" }), !seen.contains(rawId),
                      let atMs = (item["at"] as? NSNumber)?.doubleValue else { continue }
                let at = atMs / 1000
                guard at > now + 1, at < horizon else { continue }
                seen.insert(rawId)
                let content = UNMutableNotificationContent()
                content.title = clean(item["title"], max: 80)
                content.body = clean(item["body"], max: 240)
                if content.title.isEmpty { content.title = "Kaizen" }
                content.sound = .default
                content.threadIdentifier = "kz-today"
                let comps = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: Date(timeIntervalSince1970: at))
                let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: false)
                try? await center.add(UNNotificationRequest(identifier: rawId, content: content, trigger: trigger))
            }
            done(true)
        }
    }
}

enum KaizenTodoReminders {
    static func sync(_ items: [[String: Any]], ask: Bool, done: @escaping (Bool) -> Void) {
        Task { @MainActor in
            let center = UNUserNotificationCenter.current()
            var settings = await center.notificationSettings()
            if settings.authorizationStatus == .notDetermined && ask && !items.isEmpty {
                _ = try? await center.requestAuthorization(options: [.alert, .sound, .badge])
                settings = await center.notificationSettings()
            }
            let ok = settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional
            let pending = await center.pendingNotificationRequests()
            center.removePendingNotificationRequests(withIdentifiers: pending.map(\.identifier).filter { $0.hasPrefix("kzt-") })
            if ok {
                let now = Date().timeIntervalSince1970
                for item in items.prefix(60) {
                    guard let id = item["id"] as? String, let at = (item["at"] as? NSNumber)?.doubleValue else { continue }
                    let seconds = at / 1000 - now
                    if seconds < 1 { continue }
                    let content = UNMutableNotificationContent()
                    content.title = item["title"] as? String ?? "To-do"
                    content.body = item["body"] as? String ?? ""
                    // Oct 30: the timer's "Buzz only" sends sound: false, so its notification arrives silently
                    content.sound = (item["sound"] as? Bool) == false ? nil : .default
                    let trigger = UNTimeIntervalNotificationTrigger(timeInterval: seconds, repeats: false)
                    try? await center.add(UNNotificationRequest(identifier: "kzt-\(id)", content: content, trigger: trigger))
                }
            }
            done(ok)
        }
    }
}


// Oct 22: free-trial reminder - one local notification 2 days before the trial ends, with the date and the price.
@MainActor
enum KaizenTrialReminder {
    static let id = "kz-trial"
    static func schedule(ends: Date, price: String) {
        let fire = ends.addingTimeInterval(-2 * 24 * 60 * 60)
        guard fire > Date().addingTimeInterval(60) else { return }
        let f = DateFormatter()
        f.dateStyle = .long
        f.timeStyle = .none
        let title = "Your Kaizen trial ends in 2 days"
        let text = "On \(f.string(from: ends)) it renews at \(price). Cancel anytime in Settings > your name > Subscriptions."
        let comps = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: fire)
        Task { @MainActor in
            let center = UNUserNotificationCenter.current()
            let granted = (try? await center.requestAuthorization(options: [.alert, .sound])) ?? false
            guard granted else { return }
            let content = UNMutableNotificationContent()
            content.title = title
            content.body = text
            content.sound = .default
            let request = UNNotificationRequest(identifier: id, content: content,
                                                trigger: UNCalendarNotificationTrigger(dateMatching: comps, repeats: false))
            try? await center.add(request)
        }
    }
}

// Oct 22: WebKit puts a ^ v ✓ form bar above the keyboard. Native apps don't have one, so it's removed:
// the web view's content view gets a tiny subclass whose inputAccessoryView is nil. (Return or tapping outside closes the keyboard.)
private final class KaizenNoBarImp: NSObject {
    @objc var inputAccessoryView: AnyObject? { nil }
}

@MainActor
enum KaizenNoKeyboardBar {
    static func apply(to web: WKWebView) {
        guard let content = web.scrollView.subviews.first(where: { String(describing: type(of: $0)).hasPrefix("WKContent") }) else { return }
        let base: AnyClass = type(of: content)
        let name = "\(NSStringFromClass(base))_KaizenNoBar"
        var cls: AnyClass? = NSClassFromString(name)
        if cls == nil, let made = objc_allocateClassPair(base, name, 0),
           let m = class_getInstanceMethod(KaizenNoBarImp.self, #selector(getter: KaizenNoBarImp.inputAccessoryView)) {
            class_addMethod(made, #selector(getter: UIResponder.inputAccessoryView), method_getImplementation(m), method_getTypeEncoding(m))
            objc_registerClassPair(made)
            cls = made
        }
        if let cls { object_setClass(content, cls) }
    }
}
