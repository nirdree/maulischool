"use client";

import { useState, useEffect, useRef } from "react";

// ─── ICONS (inline SVG, no external dep needed) ───────────────────────────────
const Icon = ({ d, size = 22, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d={d} />
  </svg>
);

const ICONS = {
  menu: "M3 12h18M3 6h18M3 18h18",
  close: "M6 18L18 6M6 6l12 12",
  phone: "M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm16 2l-8 5-8-5m0 12h16V9l-8 5-8-5v9z",
  location: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  cctv: "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z",
  book: "M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  desk: "M20 6H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-9 7H5v-2h6v2zm8 0h-2v-2h2v2zm0-4H5V8h14v1z",
  audio: "M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1c0-2 4-3.1 6-3.1S18 15 18 17v1z",
  playground: "M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 10c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z",
  basketball: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4.07 13H7.1c.15 1.56.6 3.02 1.31 4.27A8.01 8.01 0 0 1 4.07 13zm0-2A8.01 8.01 0 0 1 8.41 6.73C7.7 7.98 7.25 9.44 7.1 11H4.07zm7.93 8.93c-.67-.98-1.41-2.5-1.75-4.93h3.5c-.34 2.43-1.08 3.95-1.75 4.93zm0-6.93H9.27c.16-1.38.59-2.74 1.22-3.85.41-.72.87-1.27 1.51-1.56.64.29 1.1.84 1.51 1.56.63 1.11 1.06 2.47 1.22 3.85zm5.9 0h-3.03c-.15-1.56-.6-3.02-1.31-4.27A8.01 8.01 0 0 1 19.9 11h.03zM12.55 4.07c.67.98 1.41 2.5 1.75 4.93h-3.5c.34-2.43 1.08-3.95 1.75-4.93zM15.59 17.27C16.3 16.02 16.75 14.56 16.9 13h3.03a8.01 8.01 0 0 1-4.34 4.27z",
  toy: "M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z",
  culture: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
  bus: "M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z",
  arrow: "M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z",
  grad: "M12 3L1 9l4 2.18V16c0 1.1 3.13 3 7 3 3.86 0 7-1.9 7-3v-4.82L23 9 12 3zm6 12.91c-.93.55-3.02 1.09-6 1.09s-5.08-.54-6-1.09V12.3l6 3.27 6-3.27v3.61zM12 13.73L4.39 9.73 12 5.81l7.61 3.92L12 13.73z",
  heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  shield: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z",
  users: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  send: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z",
};

// SVG path for hamburger / close (stroke-based)
const LineIcon = ({ paths, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    {paths.map((d, i) => <path key={i} d={d} />)}
  </svg>
);

// ─── SECTION WRAPPER ──────────────────────────────────────────────────────────
function Section({ id, className = "", children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section
      id={id}
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
    >
      {children}
    </section>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
function Badge({ children, color = "orange" }) {
  const colors = {
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    red: "bg-red-100 text-red-700 border-red-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    green: "bg-green-100 text-green-700 border-green-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colors[color]}`}>
      {children}
    </span>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const links = ["Home", "About", "Facilities", "Classes", "Admission", "Contact"];
  return (
    <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur shadow-md shadow-orange-100/60" : "bg-white/90 backdrop-blur-sm"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 md:h-18">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 flex items-center justify-center shadow-md group-hover:shadow-orange-300 transition-all group-hover:scale-105">
            <Icon d={ICONS.grad} size={18} className="text-white" />
          </div>
          <div>
            <div className="text-[13px] font-black text-orange-600 leading-tight tracking-wide">MAULI SCHOOL</div>
            <div className="text-[9px] text-gray-400 font-semibold tracking-widest uppercase leading-none">CBSE Pattern</div>
          </div>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-0.5">
          {links.map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} className="px-3 py-2 text-[13px] font-semibold text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all">
              {l}
            </a>
          ))}
          <a href="#admission" className="ml-2 px-5 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[13px] font-bold rounded-full shadow hover:shadow-orange-300 hover:scale-105 transition-all">
            Apply Now
          </a>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(v => !v)} className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-orange-50 text-gray-600">
          {open
            ? <LineIcon paths={["M6 18L18 6", "M6 6l12 12"]} />
            : <LineIcon paths={["M3 12h18", "M3 6h18", "M3 18h18"]} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${open ? "max-h-80" : "max-h-0"}`}>
        <div className="bg-white border-t border-orange-100 px-4 py-2 space-y-0.5">
          {links.map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setOpen(false)}
              className="block px-3 py-2.5 text-sm font-semibold text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all">
              {l}
            </a>
          ))}
          <a href="#admission" onClick={() => setOpen(false)}
            className="block mt-1 px-3 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-xl text-center">
            Apply Now
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 pt-16">
      {/* Decorative blobs */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-orange-300/25 to-red-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-gradient-to-tr from-yellow-300/20 to-orange-300/20 rounded-full blur-3xl pointer-events-none" />
      {/* Floating shapes */}
      <div className="absolute top-24 left-10 w-4 h-4 rounded-full bg-orange-400/40 animate-bounce" style={{ animationDelay: "0s", animationDuration: "3s" }} />
      <div className="absolute top-40 right-20 w-3 h-3 rounded-full bg-red-400/40 animate-bounce" style={{ animationDelay: "1s", animationDuration: "2.5s" }} />
      <div className="absolute bottom-40 left-20 w-5 h-5 rounded-full bg-yellow-400/50 animate-bounce" style={{ animationDelay: "0.5s", animationDuration: "3.5s" }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 grid md:grid-cols-2 gap-12 items-center w-full">
        {/* Text */}
        <div className="text-center md:text-left space-y-6">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-xs font-bold px-4 py-1.5 rounded-full border border-orange-200">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Admissions Open 2025–26
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 leading-tight">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-red-500 to-rose-600">MAULI</span>
            <span className="block">English Medium</span>
            <span className="block text-2xl sm:text-3xl font-bold text-gray-600">School & College</span>
          </h1>
          <p className="text-base text-gray-500 font-medium">
            <span className="text-orange-600 font-bold">CBSE Pattern</span> · Sanvid Pratishthan Sanchalit<br />
            Somatane Phata, Talegaon Dabhade, Pune
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <Badge color="green">✅ No Donation</Badge>
            <Badge color="orange">🎉 50% Discount</Badge>
            <Badge color="red">👶 Pre-Primary & Primary</Badge>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <a href="#admission"
              className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:scale-105 transition-all text-sm">
              Apply Now
              <Icon d={ICONS.arrow} size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#contact"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-orange-600 font-bold rounded-2xl border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all text-sm shadow">
              <Icon d={ICONS.phone} size={16} />
              Call Us
            </a>
          </div>
        </div>

        {/* Visual card */}
        <div className="relative flex justify-center md:justify-end">
          <div className="relative w-full max-w-sm">
            {/* Main card */}
            <div className="bg-white rounded-3xl shadow-2xl shadow-orange-100 p-8 border border-orange-100">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                <Icon d={ICONS.grad} size={40} className="text-white" />
              </div>
              <h3 className="text-center font-black text-xl text-gray-900 mb-1">Mauli School</h3>
              <p className="text-center text-sm text-gray-400 font-medium mb-5">Nurturing young minds since day one</p>
              <div className="space-y-2">
                {["Caring & Qualified Teachers", "Safe & Secure Campus", "CBSE Curriculum", "Activity-Based Learning"].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Icon d={ICONS.check} size={12} className="text-green-600" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            {/* Floating stat cards */}
            <div className="absolute -top-4 -left-6 bg-orange-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg">
              🏆 Best School
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white border border-orange-100 shadow-lg rounded-xl px-3 py-2 text-xs font-bold text-orange-600">
              50% Discount 🎉
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── ABOUT ────────────────────────────────────────────────────────────────────
function About() {
  const points = [
    { icon: ICONS.users, title: "Caring Teachers", desc: "Experienced, trained educators who nurture every child individually.", color: "orange" },
    { icon: ICONS.shield, title: "Safe Environment", desc: "CCTV-monitored, child-safe campus with a secure and friendly atmosphere.", color: "red" },
    { icon: ICONS.heart, title: "Holistic Growth", desc: "Academic excellence paired with sports, arts, and cultural activities.", color: "yellow" },
  ];
  const clr = { orange: "bg-orange-100 text-orange-600", red: "bg-red-100 text-red-600", yellow: "bg-amber-100 text-amber-600" };
  return (
    <Section id="about" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <Badge color="orange">About Us</Badge>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black text-gray-900">Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Mauli School?</span></h2>
          <p className="mt-3 text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            Established under <strong className="text-gray-700">Sanvid Pratishthan Sanchalit</strong>, we provide quality CBSE-pattern education with a focus on character building and academic excellence for students from Pre-Primary to Class 8.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {points.map((p) => (
            <div key={p.title} className="group bg-gradient-to-b from-gray-50 to-white rounded-2xl p-6 border border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50 transition-all duration-300">
              <div className={`w-12 h-12 rounded-xl ${clr[p.color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon d={p.icon} size={22} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{p.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── FACILITIES ───────────────────────────────────────────────────────────────
function Facilities() {
  const items = [
    { icon: ICONS.cctv, title: "CCTV Surveillance", desc: "Complete 24/7 campus monitoring" },
    { icon: ICONS.activity, title: "Activity Room", desc: "Creative & play-based learning space" },
    { icon: ICONS.desk, title: "Smart Desks", desc: "Modern ergonomic classroom furniture" },
    { icon: ICONS.audio, title: "Audio / Video Room", desc: "Digital multimedia learning lab" },
    { icon: ICONS.playground, title: "Playground", desc: "Slides, swings & outdoor play area" },
    { icon: ICONS.basketball, title: "Basketball Court", desc: "Full-size court for sports activities" },
    { icon: ICONS.toy, title: "Learning Toys", desc: "Educational toys for early learners" },
    { icon: ICONS.culture, title: "Cultural Hall", desc: "Events, performances & ceremonies" },
    { icon: ICONS.bus, title: "Transport", desc: "Safe school bus facility available" },
  ];
  const colors = [
    "from-orange-500 to-amber-500",
    "from-red-500 to-rose-500",
    "from-amber-500 to-yellow-400",
    "from-orange-600 to-red-500",
    "from-rose-500 to-pink-500",
    "from-red-400 to-orange-500",
    "from-yellow-500 to-orange-400",
    "from-orange-500 to-red-600",
    "from-amber-400 to-orange-500",
  ];
  return (
    <Section id="facilities" className="py-20 bg-gradient-to-b from-orange-50/60 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <Badge color="red">Our Facilities</Badge>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black text-gray-900">World-Class <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Infrastructure</span></h2>
          <p className="mt-3 text-gray-500 text-sm max-w-lg mx-auto">Everything a child needs to learn, play, and grow in a safe and stimulating environment.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-5">
          {items.map((item, i) => (
            <div key={item.title}
              className="group bg-white rounded-2xl p-5 border border-gray-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/50 hover:-translate-y-1 transition-all duration-300 cursor-default">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[i]} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                <Icon d={item.icon} size={20} className="text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── CLASSES ─────────────────────────────────────────────────────────────────
function Classes() {
  const classes = [
    { name: "Playgroup", age: "2+ Years", emoji: "🍼", color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
    { name: "Nursery", age: "3+ Years", emoji: "🌱", color: "bg-green-50 border-green-200 text-green-700" },
    { name: "Jr. KG", age: "4 Years", emoji: "🎨", color: "bg-blue-50 border-blue-200 text-blue-700" },
    { name: "Sr. KG", age: "5 Years", emoji: "⭐", color: "bg-purple-50 border-purple-200 text-purple-700" },
    { name: "Class 1–4", age: "6–9 Years", emoji: "📚", color: "bg-orange-50 border-orange-200 text-orange-700" },
    { name: "Class 5–8", age: "10+ Years", emoji: "🎓", color: "bg-red-50 border-red-200 text-red-700" },
  ];
  return (
    <Section id="classes" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <Badge color="yellow">Classes Offered</Badge>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black text-gray-900">Programs <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">We Offer</span></h2>
          <p className="mt-3 text-gray-500 text-sm max-w-md mx-auto">From playgroup to Class 8 — we shape every stage of your child's early education journey.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {classes.map((cls) => (
            <div key={cls.name}
              className={`group rounded-2xl p-5 border-2 ${cls.color} text-center hover:-translate-y-2 hover:shadow-lg transition-all duration-300 cursor-default`}>
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{cls.emoji}</div>
              <div className="font-black text-base">{cls.name}</div>
              <div className="text-xs font-medium opacity-70 mt-1">{cls.age}</div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── GALLERY ─────────────────────────────────────────────────────────────────
function Gallery() {
  const photos = [
    { bg: "from-orange-300 to-amber-400", label: "Classroom Activities", emoji: "🎨" },
    { bg: "from-red-400 to-rose-400", label: "Sports Day", emoji: "🏀" },
    { bg: "from-yellow-300 to-orange-400", label: "Cultural Program", emoji: "🎭" },
    { bg: "from-amber-400 to-red-400", label: "Annual Day", emoji: "🏆" },
    { bg: "from-orange-400 to-red-500", label: "Science Expo", emoji: "🔬" },
    { bg: "from-red-300 to-orange-400", label: "Playground Fun", emoji: "🎠" },
  ];
  return (
    <Section id="gallery" className="py-20 bg-gradient-to-b from-orange-50/40 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <Badge color="orange">Gallery</Badge>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black text-gray-900">Life at <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Mauli School</span></h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photos.map((p, i) => (
            <div key={i} className={`group relative h-44 sm:h-56 rounded-2xl bg-gradient-to-br ${p.bg} overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300`}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 group-hover:scale-110 transition-transform duration-300">
                <span className="text-5xl">{p.emoji}</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white text-xs font-bold text-center">{p.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── ADMISSION ────────────────────────────────────────────────────────────────
function Admission() {
  const benefits = [
    "No Donation — Zero hidden charges",
    "50% Discount on fees for deserving students",
    "Trained & caring staff for all classes",
    "CBSE pattern curriculum",
    "Safe, CCTV-monitored campus",
    "Transport facility available",
  ];
  return (
    <Section id="admission" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 rounded-3xl p-8 sm:p-12 overflow-hidden text-white shadow-2xl">
          {/* bg decoration */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/10 rounded-full" />
          <div className="relative z-10 grid sm:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                <span className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse" />
                Admissions Now Open
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-3">Secure Your Child's<br />Future Today</h2>
              <p className="text-orange-100 text-sm mb-6">Limited seats available for the academic year 2025–26. Apply early to avail special discounts.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="#contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-orange-600 font-bold rounded-xl shadow hover:shadow-md hover:scale-105 transition-all text-sm">
                  Apply Now <Icon d={ICONS.arrow} size={16} />
                </a>
                <a href="tel:9130415350"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-all text-sm border border-white/30">
                  <Icon d={ICONS.phone} size={15} /> Call Now
                </a>
              </div>
            </div>
            <div className="space-y-2.5">
              {benefits.map((b) => (
                <div key={b} className="flex items-start gap-2.5 bg-white/15 rounded-xl px-4 py-2.5">
                  <Icon d={ICONS.check} size={16} className="text-yellow-300 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── CONTACT ──────────────────────────────────────────────────────────────────
function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    setForm({ name: "", phone: "", message: "" });
  };
  const info = [
    { icon: ICONS.phone, label: "Phone", value: "9130415350 / 8180993047", href: "tel:9130415350" },
    { icon: ICONS.mail, label: "Email", value: "erakidmauli@gmail.com", href: "mailto:erakidmauli@gmail.com" },
    { icon: ICONS.location, label: "Address", value: "Somatane Phata, Talegaon Dabhade, Pune", href: "#" },
  ];
  return (
    <Section id="contact" className="py-20 bg-gradient-to-b from-orange-50/40 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <Badge color="red">Contact Us</Badge>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black text-gray-900">Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Touch</span></h2>
          <p className="mt-3 text-gray-500 text-sm">We'd love to hear from you. Reach out for admissions or any enquiries.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-8">
          {/* Info */}
          <div className="space-y-4">
            {info.map((item) => (
              <a key={item.label} href={item.href}
                className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md hover:shadow-orange-50 transition-all group">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow group-hover:scale-110 transition-transform flex-shrink-0">
                  <Icon d={item.icon} size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">{item.label}</div>
                  <div className="text-sm font-semibold text-gray-800">{item.value}</div>
                </div>
              </a>
            ))}
            <div className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
              <p className="text-sm font-semibold text-orange-700 mb-1">School Hours</p>
              <p className="text-sm text-gray-600">Mon – Sat: 8:00 AM – 2:00 PM</p>
              <p className="text-xs text-gray-400 mt-1">Admission office open till 4:00 PM</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="font-black text-gray-900 text-lg">Send an Enquiry</h3>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Your Name</label>
              <input type="text" required value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
                placeholder="Parent / Guardian Name"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Phone Number</label>
              <input type="tel" required value={form.phone} onChange={e => setForm(v => ({ ...v, phone: e.target.value }))}
                placeholder="10-digit mobile number"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Message</label>
              <textarea rows={4} value={form.message} onChange={e => setForm(v => ({ ...v, message: e.target.value }))}
                placeholder="Your enquiry or message..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm transition-all resize-none" />
            </div>
            <button type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow hover:shadow-orange-200 hover:scale-[1.02] transition-all text-sm">
              {sent ? "✅ Message Sent!" : <><Icon d={ICONS.send} size={16} /> Send Message</>}
            </button>
          </form>
        </div>
      </div>
    </Section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Icon d={ICONS.grad} size={18} className="text-white" />
              </div>
              <div>
                <div className="text-white font-black text-sm tracking-wide">MAULI SCHOOL</div>
                <div className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">CBSE Pattern</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Sanvid Pratishthan Sanchalit<br />
              Quality education from Pre-Primary to Class 8.
            </p>
          </div>
          {/* Links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3 uppercase tracking-wide">Quick Links</h4>
            <div className="space-y-1.5">
              {["Home", "About", "Facilities", "Classes", "Admission", "Contact"].map((l) => (
                <a key={l} href={`#${l.toLowerCase()}`}
                  className="block text-xs text-gray-500 hover:text-orange-400 transition-colors">
                  {l}
                </a>
              ))}
            </div>
          </div>
          {/* Contact */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3 uppercase tracking-wide">Contact</h4>
            <div className="space-y-2">
              <a href="tel:9130415350" className="flex items-center gap-2 text-xs text-gray-500 hover:text-orange-400 transition-colors">
                <Icon d={ICONS.phone} size={13} /> 9130415350 / 8180993047
              </a>
              <a href="mailto:erakidmauli@gmail.com" className="flex items-center gap-2 text-xs text-gray-500 hover:text-orange-400 transition-colors">
                <Icon d={ICONS.mail} size={13} /> erakidmauli@gmail.com
              </a>
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <Icon d={ICONS.location} size={13} className="flex-shrink-0 mt-0.5" />
                Somatane Phata, Talegaon Dabhade, Pune
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} Mauli English Medium School & College. All rights reserved.</p>
          <p>Admissions Open · CBSE Pattern · No Donation</p>
        </div>
      </div>
    </footer>
  );
}

// ─── SCROLL-TO-TOP ────────────────────────────────────────────────────────────
function ScrollTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const fn = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg hover:scale-110 transition-all flex items-center justify-center"
    >
      ↑
    </button>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; }
        * { box-sizing: border-box; }
      `}</style>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Facilities />
        <Classes />
        <Gallery />
        <Admission />
        <Contact />
      </main>
      <Footer />
      <ScrollTop />
    </>
  );
}