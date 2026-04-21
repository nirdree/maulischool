"use client";

import { useState, useEffect, useRef } from "react";

// ─── ICONS (inline SVG to avoid react-icons dependency) ───────────────────────
const IconMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.09 4.18 2 2 0 015.07 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L9.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
  </svg>
);
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconMapPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconCamera = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
const IconActivity = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
  </svg>
);
const IconMonitor = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);
const IconVolume = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" />
    <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
  </svg>
);
const IconTree = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
    <path d="M17 14V2M9 18.12L10 14H4l4-6H3l5-8h4L18 8h-5l4 6h-6l1 4.12" /><path d="M17 22v-8" />
  </svg>
);
const IconCircle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconGift = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
    <polyline points="20,12 20,22 4,22 4,12" /><rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
  </svg>
);
const IconMusic = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
  </svg>
);
const IconTruck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
    <rect x="1" y="3" width="15" height="13" /><polygon points="16,8 20,8 23,11 23,16 16,16 16,8" />
    <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-5 h-5">
    <polyline points="20,6 9,17 4,12" />
  </svg>
);
const IconChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <polyline points="9,18 15,12 9,6" />
  </svg>
);

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["Home", "About", "Facilities", "Admission", "Contact"];

  const scrollTo = (id) => {
    setOpen(false);
    const el = document.getElementById(id.toLowerCase());
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white shadow-lg shadow-orange-100"
          : "bg-white/95 backdrop-blur"
      }`}
    >
      {/* Top strip */}
      <div className="bg-gradient-to-r from-orange-600 via-red-500 to-yellow-500 text-white text-xs text-center py-1.5 font-semibold tracking-wide">
        🎉 Admissions Open for 2024–25 &nbsp;|&nbsp; Call: 9130415350
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollTo("home")}>
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <div>
              <div className="font-bold text-orange-700 text-sm leading-tight">MAULI ENGLISH MEDIUM</div>
              <div className="text-xs text-gray-500 leading-tight">School & College</div>
            </div>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <button
                key={link}
                onClick={() => scrollTo(link)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200"
              >
                {link}
              </button>
            ))}
            <button
              onClick={() => scrollTo("admission")}
              className="ml-3 px-5 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-full shadow hover:shadow-orange-300 hover:scale-105 transition-all duration-200"
            >
              Apply Now
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-orange-600 p-2 rounded-lg hover:bg-orange-50"
            onClick={() => setOpen(!open)}
          >
            {open ? <IconX /> : <IconMenu />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden bg-white border-t border-orange-100 overflow-hidden transition-all duration-300 ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-3 flex flex-col gap-1">
          {links.map((link) => (
            <button
              key={link}
              onClick={() => scrollTo(link)}
              className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
            >
              {link}
            </button>
          ))}
          <button
            onClick={() => scrollTo("admission")}
            className="mt-2 w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow"
          >
            Apply Now
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24"
      style={{
        background:
          "linear-gradient(135deg, #fff8ed 0%, #fff3e0 30%, #ffe0b2 60%, #ffccbc 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-orange-300 rounded-full opacity-20 blur-3xl -z-0" />
      <div className="absolute bottom-10 left-0 w-80 h-80 bg-yellow-300 rounded-full opacity-20 blur-3xl -z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-200 rounded-full opacity-10 blur-3xl -z-0" />

      {/* Floating stars */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute text-yellow-400 opacity-60 animate-bounce-slow"
          style={{
            top: `${15 + i * 12}%`,
            left: `${5 + i * 15}%`,
            animationDelay: `${i * 0.4}s`,
            fontSize: `${12 + (i % 3) * 6}px`,
          }}
        >
          ★
        </div>
      ))}

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Org tag */}
        <div className="inline-block mb-4 px-4 py-1.5 bg-orange-100 border border-orange-300 rounded-full text-orange-700 text-xs font-bold tracking-widest uppercase">
          Sanvid Pratishthan Sanchalit
        </div>

        {/* Main heading */}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-4"
          style={{
            background: "linear-gradient(135deg, #c2410c, #ea580c, #f97316, #eab308)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontFamily: "Georgia, serif",
          }}
        >
          MAULI ENGLISH MEDIUM
        </h1>
        <h2
          className="text-3xl sm:text-4xl md:text-5xl font-black mb-2"
          style={{
            background: "linear-gradient(135deg, #7c2d12, #c2410c, #ea580c)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontFamily: "Georgia, serif",
          }}
        >
          SCHOOL & COLLEGE
        </h2>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-orange-700 font-semibold mb-8 tracking-wide">
          🎓 CBSE Pattern Education
        </p>

        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            { label: "No Donation", emoji: "🚫💰" },
            { label: "50% Discount", emoji: "🏷️" },
            { label: "Pre-Primary & Primary", emoji: "🌟" },
          ].map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-orange-400 rounded-full shadow-md text-orange-700 font-bold text-sm hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-300 hover:scale-105 cursor-default"
            >
              <span>{badge.emoji}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => document.getElementById("admission").scrollIntoView({ behavior: "smooth" })}
            className="px-10 py-4 bg-gradient-to-r from-orange-600 via-red-500 to-red-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-orange-300 hover:shadow-orange-400 hover:scale-105 transition-all duration-300"
          >
            Apply Now →
          </button>
          <button
            onClick={() => document.getElementById("about").scrollIntoView({ behavior: "smooth" })}
            className="px-10 py-4 bg-white border-2 border-orange-400 text-orange-600 font-bold text-lg rounded-2xl hover:bg-orange-50 hover:scale-105 transition-all duration-300"
          >
            Learn More
          </button>
        </div>

        {/* Stats row */}
        <div className="mt-14 grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { num: "500+", label: "Students" },
            { num: "20+", label: "Teachers" },
            { num: "10+", label: "Years" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/70 backdrop-blur rounded-2xl py-4 shadow-md border border-orange-100">
              <div className="text-2xl font-black text-orange-600">{stat.num}</div>
              <div className="text-xs font-semibold text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg">
          <path fill="#ffffff" d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </div>
    </section>
  );
}

// ─── ABOUT ────────────────────────────────────────────────────────────────────
function About() {
  const points = [
    { icon: <IconStar />, title: "Caring Teachers", desc: "Passionate educators dedicated to nurturing every child's unique potential with love and patience." },
    { icon: <IconShield />, title: "Safe Environment", desc: "Fully secured campus with CCTV monitoring and trained staff ensuring your child's safety at all times." },
    { icon: <IconCheck />, title: "Trained Staff", desc: "Professionally qualified staff committed to delivering high-quality education in a supportive setting." },
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-xs font-bold tracking-widest text-orange-500 uppercase">Who We Are</span>
          <h2 className="text-4xl sm:text-5xl font-black mt-2 mb-4" style={{ fontFamily: "Georgia, serif", color: "#c2410c" }}>
            About Our School
          </h2>
          <div className="w-16 h-1.5 bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full mx-auto mb-6" />
          <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
            Mauli English Medium School & College, run under <strong className="text-orange-600">Sanvid Pratishthan Sanchalit</strong>,
            is a premier educational institution following the CBSE pattern. We are committed to delivering holistic education
            that shapes young minds for a bright future — academically, socially, and emotionally.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8">
          {points.map((p, i) => (
            <div
              key={i}
              className="group p-8 rounded-3xl border-2 border-orange-100 hover:border-orange-400 bg-orange-50/40 hover:bg-gradient-to-br hover:from-orange-500 hover:to-red-500 transition-all duration-400 hover:shadow-2xl hover:shadow-orange-200 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 group-hover:from-white group-hover:to-orange-100 flex items-center justify-center text-white group-hover:text-orange-600 mb-5 shadow-md transition-all duration-300">
                {p.icon}
              </div>
              <h3 className="text-xl font-black mb-2 text-orange-700 group-hover:text-white transition-colors">{p.title}</h3>
              <p className="text-gray-600 group-hover:text-orange-100 text-sm leading-relaxed transition-colors">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FACILITIES ───────────────────────────────────────────────────────────────
function Facilities() {
  const facilities = [
    { icon: <IconCamera />, title: "CCTV Surveillance", desc: "24/7 campus monitoring for complete safety" },
    { icon: <IconActivity />, title: "Activity Room", desc: "Dedicated space for creative and physical activities" },
    { icon: <IconMonitor />, title: "Smart Desks", desc: "Modern, tech-enabled classrooms for better learning" },
    { icon: <IconVolume />, title: "Audio/Video Room", desc: "Immersive AV learning environment" },
    { icon: <IconTree />, title: "Playground", desc: "Slides, swings & outdoor fun for kids" },
    { icon: <IconCircle />, title: "Basketball Court", desc: "Full-size court for sports & fitness" },
    { icon: <IconGift />, title: "Learning Toys", desc: "Educational toys to spark curiosity" },
    { icon: <IconMusic />, title: "Cultural Hall", desc: "Stage for events, performances & celebrations" },
    { icon: <IconTruck />, title: "Transport", desc: "Safe and reliable school bus service" },
  ];

  return (
    <section id="facilities" className="py-20 bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-xs font-bold tracking-widest text-orange-500 uppercase">What We Offer</span>
          <h2 className="text-4xl sm:text-5xl font-black mt-2 mb-4" style={{ fontFamily: "Georgia, serif", color: "#c2410c" }}>
            World-Class Facilities
          </h2>
          <div className="w-16 h-1.5 bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full mx-auto" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((f, i) => (
            <div
              key={i}
              className="group relative bg-white rounded-2xl p-6 border border-orange-100 hover:border-transparent shadow-sm hover:shadow-xl hover:shadow-orange-100 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Hover background */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0" />

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-orange-100 group-hover:bg-white/20 flex items-center justify-center text-orange-600 group-hover:text-white mb-4 transition-all duration-300">
                  {f.icon}
                </div>
                <h3 className="text-lg font-black text-gray-800 group-hover:text-white mb-1 transition-colors">{f.title}</h3>
                <p className="text-sm text-gray-500 group-hover:text-orange-100 transition-colors">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CLASSES ──────────────────────────────────────────────────────────────────
function Classes() {
  const classes = [
    { name: "Playgroup", age: "2+", emoji: "🧸", color: "from-yellow-400 to-orange-400" },
    { name: "Nursery", age: "3+", emoji: "🌻", color: "from-orange-400 to-red-400" },
    { name: "Jr. KG", age: "4+", emoji: "🎨", color: "from-red-400 to-pink-400" },
    { name: "Sr. KG", age: "5+", emoji: "📚", color: "from-orange-500 to-yellow-500" },
    { name: "Class 1–8", age: "6+", emoji: "🎓", color: "from-red-500 to-orange-600" },
  ];

  return (
    <section id="classes" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-xs font-bold tracking-widest text-orange-500 uppercase">Academics</span>
          <h2 className="text-4xl sm:text-5xl font-black mt-2 mb-4" style={{ fontFamily: "Georgia, serif", color: "#c2410c" }}>
            Classes We Offer
          </h2>
          <div className="w-16 h-1.5 bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full mx-auto" />
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {classes.map((c, i) => (
            <div
              key={i}
              className={`group relative bg-gradient-to-br ${c.color} rounded-3xl p-8 text-white text-center shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 min-w-[160px] cursor-default`}
            >
              <div className="text-5xl mb-3">{c.emoji}</div>
              <div className="text-2xl font-black">{c.name}</div>
              <div className="mt-2 px-4 py-1 bg-white/30 rounded-full text-sm font-bold">
                Age {c.age}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── GALLERY ──────────────────────────────────────────────────────────────────
function Gallery() {
  const colors = [
    "from-orange-400 to-yellow-400",
    "from-red-400 to-orange-500",
    "from-yellow-400 to-orange-300",
    "from-orange-500 to-red-600",
    "from-amber-400 to-orange-500",
    "from-red-500 to-pink-500",
  ];
  const labels = [
    "Annual Day 🎭", "Sports Day 🏅", "Classroom 📖",
    "Science Fair 🔬", "Cultural Fest 🎶", "Playground 🏃",
  ];

  return (
    <section id="gallery" className="py-20 bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-xs font-bold tracking-widest text-orange-500 uppercase">Memories</span>
          <h2 className="text-4xl sm:text-5xl font-black mt-2 mb-4" style={{ fontFamily: "Georgia, serif", color: "#c2410c" }}>
            School Gallery
          </h2>
          <div className="w-16 h-1.5 bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full mx-auto" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {colors.map((grad, i) => (
            <div
              key={i}
              className="group relative rounded-2xl overflow-hidden aspect-video shadow-md hover:shadow-xl hover:shadow-orange-200 transition-all duration-300"
            >
              <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-black text-lg group-hover:scale-110 transition-transform duration-500`}>
                {labels[i]}
              </div>
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white text-4xl">🔍</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          📸 Replace these with actual school images from <code className="bg-gray-100 px-2 py-0.5 rounded">/public/gallery/</code>
        </p>
      </div>
    </section>
  );
}

// ─── ADMISSION ────────────────────────────────────────────────────────────────
function Admission() {
  return (
    <section id="admission" className="py-20 relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: "linear-gradient(135deg, #c2410c 0%, #ea580c 40%, #f97316 70%, #eab308 100%)",
        }}
      />
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
        <div className="inline-block px-5 py-2 bg-white/20 rounded-full text-white font-bold text-sm tracking-widest uppercase mb-4 border border-white/30">
          🎉 Admissions Open 2024–25
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6" style={{ fontFamily: "Georgia, serif" }}>
          Secure Your Child's Future Today
        </h2>

        <p className="text-orange-100 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
          Limited seats available. Give your child the best head start with quality education, caring teachers, and world-class facilities.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {["✅ No Donation", "🏷️ 50% Discount", "📚 CBSE Pattern", "🔒 Safe Campus"].map((b) => (
            <div key={b} className="px-5 py-2.5 bg-white/20 border border-white/40 rounded-full text-white font-semibold text-sm backdrop-blur">
              {b}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="tel:9130415350"
            className="px-10 py-4 bg-white text-orange-600 font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            📞 Call to Enroll
          </a>
          <button
            onClick={() => document.getElementById("contact").scrollIntoView({ behavior: "smooth" })}
            className="px-10 py-4 bg-transparent border-2 border-white text-white font-bold text-lg rounded-2xl hover:bg-white/10 hover:scale-105 transition-all duration-300"
          >
            Contact Us
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── CONTACT ──────────────────────────────────────────────────────────────────
function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setForm({ name: "", phone: "", message: "" });
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-xs font-bold tracking-widest text-orange-500 uppercase">Get In Touch</span>
          <h2 className="text-4xl sm:text-5xl font-black mt-2 mb-4" style={{ fontFamily: "Georgia, serif", color: "#c2410c" }}>
            Contact Us
          </h2>
          <div className="w-16 h-1.5 bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full mx-auto" />
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Info */}
          <div>
            <h3 className="text-2xl font-black text-orange-700 mb-6">We'd Love to Hear From You</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Visit us, call us, or drop a message. Our admission team is ready to guide you through the enrollment process.
            </p>

            <div className="space-y-5">
              {[
                { icon: <IconPhone />, label: "Phone", values: ["9130415350", "8180993047"] },
                { icon: <IconMail />, label: "Email", values: ["erakidmauli@gmail.com"] },
                { icon: <IconMapPin />, label: "Address", values: ["Somatane Phata, Talegaon Dabhade, Pune"] },
              ].map((item) => (
                <div key={item.label} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">{item.label}</div>
                    {item.values.map((v) => (
                      <div key={v} className="font-semibold text-gray-800">{v}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-3xl p-8 border border-orange-100 shadow-sm">
            <h3 className="text-xl font-black text-orange-700 mb-6">Send Us a Message</h3>

            {sent && (
              <div className="mb-5 px-4 py-3 bg-green-100 border border-green-300 text-green-700 rounded-xl font-semibold text-sm">
                ✅ Message sent! We'll contact you soon.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1.5">Your Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-3 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1.5">Message</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Your message or inquiry..."
                  className="w-full px-4 py-3 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white text-gray-800 placeholder-gray-400 transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-black text-lg rounded-xl shadow-md hover:shadow-orange-300 hover:scale-[1.02] transition-all duration-300"
              >
                Send Message →
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  const links = ["Home", "About", "Facilities", "Admission", "Contact"];

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-orange-950 to-gray-900 text-gray-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-2xl">M</span>
              </div>
              <div>
                <div className="text-white font-black text-sm leading-tight">MAULI ENGLISH MEDIUM</div>
                <div className="text-orange-400 text-xs">School & College</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Sanvid Pratishthan Sanchalit. Empowering young minds with quality CBSE-pattern education since our founding.
            </p>
            <div className="flex gap-3">
              {["📘", "📸", "🐦", "▶️"].map((s, i) => (
                <div key={i} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-orange-500 flex items-center justify-center cursor-pointer transition-all duration-200 text-sm">
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-black mb-4 text-sm tracking-wide uppercase">Quick Links</h4>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l}>
                  <button
                    onClick={() => document.getElementById(l.toLowerCase())?.scrollIntoView({ behavior: "smooth" })}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-orange-400 transition-colors group"
                  >
                    <IconChevronRight />
                    {l}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-black mb-4 text-sm tracking-wide uppercase">Contact</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <IconPhone />
                <div>
                  <div>9130415350</div>
                  <div>8180993047</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <IconMail />
                <span>erakidmauli@gmail.com</span>
              </div>
              <div className="flex items-start gap-3">
                <IconMapPin />
                <span>Somatane Phata, Talegaon Dabhade, Pune</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <div>© 2024 Mauli English Medium School & College. All rights reserved.</div>
          <div className="text-orange-500 font-semibold">CBSE Pattern | Admissions Open</div>
        </div>
      </div>
    </footer>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Trebuchet MS', Verdana, sans-serif; background: #fff8ed; }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
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
    </>
  );
}