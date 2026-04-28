"use client";

import { useState, useEffect, useRef } from "react";
import {
  Menu, X, Phone, Mail, MapPin, Star, Check, Cctv,
  BookOpen, Activity, Monitor, Gamepad2, Trophy,
  Music2, Users, Bus, ArrowRight, Send, GraduationCap,
  Shield, Heart, ChevronUp
} from "lucide-react";

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
      style={{
        transition: "opacity 0.7s, transform 0.7s",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(2rem)",
      }}
      className={className}
    >
      {children}
    </section>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
function Badge({ children, color = "orange" }) {
  const styles = {
    orange: { background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" },
    red: { background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3" },
    yellow: { background: "#fefce8", color: "#a16207", border: "1px solid #fef08a" },
    green: { background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" },
  };
  return (
    <span style={{
      ...styles[color],
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 12px",
      borderRadius: "9999px",
      fontSize: "12px",
      fontWeight: 700,
    }}>
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
    <nav style={{
      position: "fixed",
      inset: "0 0 auto 0",
      zIndex: 50,
      background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.92)",
      backdropFilter: "blur(12px)",
      boxShadow: scrolled ? "0 2px 20px rgba(249,115,22,0.12)" : "none",
      transition: "all 0.3s",
    }}>
      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        {/* Logo */}
        <a href="#home" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #f97316, #dc2626)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
          }}>
            <GraduationCap size={18} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#ea580c", letterSpacing: "0.05em", lineHeight: 1.2 }}>MAULI SCHOOL</div>
            <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>CBSE Pattern</div>
          </div>
        </a>

        {/* Desktop links */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }} className="hidden-mobile">
          {links.map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{
              padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "#4b5563",
              borderRadius: 8, textDecoration: "none", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.target.style.color = "#ea580c"; e.target.style.background = "#fff7ed"; }}
              onMouseLeave={e => { e.target.style.color = "#4b5563"; e.target.style.background = "transparent"; }}>
              {l}
            </a>
          ))}
          <a href="#admission" style={{
            marginLeft: 8, padding: "8px 20px",
            background: "linear-gradient(135deg, #f97316, #dc2626)",
            color: "white", fontSize: 13, fontWeight: 700,
            borderRadius: 9999, textDecoration: "none",
            boxShadow: "0 4px 12px rgba(249,115,22,0.35)",
            transition: "all 0.2s",
          }}>Apply Now</a>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(v => !v)} style={{
          width: 36, height: 36, border: "none", background: "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 8, color: "#374151",
        }} className="show-mobile">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div style={{
        overflow: "hidden",
        maxHeight: open ? 320 : 0,
        transition: "max-height 0.3s",
        background: "white",
        borderTop: open ? "1px solid #fed7aa" : "none",
      }} className="show-mobile">
        <div style={{ padding: "8px 16px 12px" }}>
          {links.map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setOpen(false)} style={{
              display: "block", padding: "10px 12px", fontSize: 14, fontWeight: 600,
              color: "#4b5563", textDecoration: "none", borderRadius: 8,
            }}>
              {l}
            </a>
          ))}
          <a href="#admission" onClick={() => setOpen(false)} style={{
            display: "block", marginTop: 4, padding: "10px 12px",
            background: "linear-gradient(135deg, #f97316, #dc2626)",
            color: "white", fontSize: 14, fontWeight: 700,
            borderRadius: 12, textDecoration: "none", textAlign: "center",
          }}>Apply Now</a>
        </div>
      </div>
    </nav>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section id="home" style={{
      position: "relative",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      overflow: "hidden",
      background: "linear-gradient(135deg, #fffbeb 0%, #fff7ed 50%, #fef2f2 100%)",
      paddingTop: 64,
    }}>
      <div style={{
        position: "absolute", top: -128, right: -128,
        width: 500, height: 500,
        background: "radial-gradient(circle, rgba(251,146,60,0.2), rgba(239,68,68,0.15))",
        borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -128, left: -128,
        width: 400, height: 400,
        background: "radial-gradient(circle, rgba(253,224,71,0.15), rgba(249,115,22,0.15))",
        borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "80px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center", width: "100%" }} className="hero-grid">
        {/* Text */}
        <div style={{ textAlign: "left" }} className="hero-text">
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#fff7ed", color: "#c2410c", fontSize: 12,
            fontWeight: 700, padding: "6px 16px", borderRadius: 9999,
            border: "1px solid #fed7aa", marginBottom: 24,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f97316", display: "inline-block", animation: "pulse 2s infinite" }} />
            Admissions Open 2025–26
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, color: "#111827", lineHeight: 1.1, margin: "0 0 16px" }}>
            <span style={{ display: "block", background: "linear-gradient(135deg, #ea580c, #dc2626, #e11d48)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>MAULI</span>
            <span style={{ display: "block" }}>English Medium</span>
            <span style={{ display: "block", fontSize: "clamp(1.4rem, 3.5vw, 2.2rem)", fontWeight: 700, color: "#6b7280" }}>School & College</span>
          </h1>
          <p style={{ fontSize: 15, color: "#6b7280", fontWeight: 500, marginBottom: 24, lineHeight: 1.6 }}>
            <strong style={{ color: "#ea580c" }}>CBSE Pattern</strong> · Sanvid Pratishthan Sanchalit<br />
            Somatane Phata, Talegaon Dabhade, Pune
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
            <Badge color="green">✅ No Donation</Badge>
            <Badge color="orange">🎉 50% Discount</Badge>
            <Badge color="red">👶 Pre-Primary & Primary</Badge>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="#admission" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 28px",
              background: "linear-gradient(135deg, #f97316, #dc2626)",
              color: "white", fontWeight: 700, borderRadius: 16,
              textDecoration: "none", fontSize: 14,
              boxShadow: "0 8px 24px rgba(249,115,22,0.35)",
              transition: "all 0.2s",
            }}>
              Apply Now <ArrowRight size={16} />
            </a>
            <a href="#contact" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 28px",
              background: "white", color: "#ea580c", fontWeight: 700,
              borderRadius: 16, border: "2px solid #fed7aa",
              textDecoration: "none", fontSize: 14,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}>
              <Phone size={16} /> Call Us
            </a>
          </div>
        </div>

        {/* Visual card */}
        <div style={{ display: "flex", justifyContent: "flex-end" }} className="hero-card-wrap">
          <div style={{ position: "relative", width: "100%", maxWidth: 360 }}>
            <div style={{
              background: "white", borderRadius: 24,
              boxShadow: "0 24px 64px rgba(249,115,22,0.15)",
              padding: 32, border: "1px solid #fed7aa",
            }}>
              <div style={{
                width: 80, height: 80, margin: "0 auto 16px",
                borderRadius: 20,
                background: "linear-gradient(135deg, #fb923c, #dc2626)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 24px rgba(249,115,22,0.4)",
              }}>
                <GraduationCap size={40} color="white" />
              </div>
              <h3 style={{ textAlign: "center", fontWeight: 900, fontSize: 20, color: "#111827", margin: "0 0 4px" }}>Mauli School</h3>
              <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af", fontWeight: 500, margin: "0 0 20px" }}>Nurturing young minds since day one</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {["Caring & Qualified Teachers", "Safe & Secure Campus", "CBSE Curriculum", "Activity-Based Learning"].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#374151" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check size={12} color="#16a34a" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              position: "absolute", top: -16, left: -24,
              background: "#f97316", color: "white",
              fontSize: 12, fontWeight: 700,
              padding: "8px 12px", borderRadius: 12,
              boxShadow: "0 4px 12px rgba(249,115,22,0.4)",
            }}>🏆 Best School</div>
            <div style={{
              position: "absolute", bottom: -16, right: -16,
              background: "white", border: "1px solid #fed7aa",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              borderRadius: 12, padding: "8px 12px",
              fontSize: 12, fontWeight: 700, color: "#ea580c",
            }}>50% Discount 🎉</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── ABOUT ────────────────────────────────────────────────────────────────────
function About() {
  const points = [
    { icon: <Users size={22} />, title: "Caring Teachers", desc: "Experienced, trained educators who nurture every child individually.", bg: "#fff7ed", color: "#ea580c" },
    { icon: <Shield size={22} />, title: "Safe Environment", desc: "CCTV-monitored, child-safe campus with a secure and friendly atmosphere.", bg: "#fff1f2", color: "#be123c" },
    { icon: <Heart size={22} />, title: "Holistic Growth", desc: "Academic excellence paired with sports, arts, and cultural activities.", bg: "#fefce8", color: "#a16207" },
  ];
  return (
    <Section id="about" style={{ padding: "80px 0", background: "white" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Badge color="orange">About Us</Badge>
          <h2 style={{ marginTop: 12, fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 900, color: "#111827" }}>
            Why Choose <span style={{ background: "linear-gradient(135deg, #f97316, #dc2626)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Mauli School?</span>
          </h2>
          <p style={{ marginTop: 12, color: "#6b7280", maxWidth: 480, margin: "12px auto 0", fontSize: 14, lineHeight: 1.7 }}>
            Established under <strong style={{ color: "#374151" }}>Sanvid Pratishthan Sanchalit</strong>, we provide quality CBSE-pattern education with a focus on character building and academic excellence for students from Pre-Primary to Class 8.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {points.map((p) => (
            <div key={p.title} style={{
              background: "linear-gradient(180deg, #f9fafb, white)",
              borderRadius: 20, padding: 24,
              border: "1px solid #f3f4f6",
              transition: "all 0.3s",
              cursor: "default",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#fed7aa"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(249,115,22,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#f3f4f6"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: p.bg, color: p.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                {p.icon}
              </div>
              <h3 style={{ fontWeight: 700, color: "#111827", marginBottom: 8, fontSize: 16 }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>{p.desc}</p>
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
    { icon: <Cctv size={20} color="white" />, title: "CCTV Surveillance", desc: "Complete 24/7 campus monitoring", grad: "linear-gradient(135deg,#f97316,#eab308)" },
    { icon: <Activity size={20} color="white" />, title: "Activity Room", desc: "Creative & play-based learning space", grad: "linear-gradient(135deg,#ef4444,#f43f5e)" },
    { icon: <Monitor size={20} color="white" />, title: "Smart Desks", desc: "Modern ergonomic classroom furniture", grad: "linear-gradient(135deg,#f59e0b,#fcd34d)" },
    { icon: <Music2 size={20} color="white" />, title: "Audio / Video Room", desc: "Digital multimedia learning lab", grad: "linear-gradient(135deg,#ea580c,#ef4444)" },
    { icon: <Gamepad2 size={20} color="white" />, title: "Playground", desc: "Slides, swings & outdoor play area", grad: "linear-gradient(135deg,#f43f5e,#fb7185)" },
    { icon: <Trophy size={20} color="white" />, title: "Basketball Court", desc: "Full-size court for sports activities", grad: "linear-gradient(135deg,#f97316,#ef4444)" },
    { icon: <Star size={20} color="white" />, title: "Learning Toys", desc: "Educational toys for early learners", grad: "linear-gradient(135deg,#eab308,#f97316)" },
    { icon: <BookOpen size={20} color="white" />, title: "Cultural Hall", desc: "Events, performances & ceremonies", grad: "linear-gradient(135deg,#f97316,#dc2626)" },
    { icon: <Bus size={20} color="white" />, title: "Transport", desc: "Safe school bus facility available", grad: "linear-gradient(135deg,#fbbf24,#f97316)" },
  ];
  return (
    <Section id="facilities" style={{ padding: "80px 0", background: "linear-gradient(180deg, rgba(255,247,237,0.6), white)" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Badge color="red">Our Facilities</Badge>
          <h2 style={{ marginTop: 12, fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 900, color: "#111827" }}>
            World-Class <span style={{ background: "linear-gradient(135deg, #f97316, #dc2626)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Infrastructure</span>
          </h2>
          <p style={{ marginTop: 12, color: "#6b7280", maxWidth: 440, margin: "12px auto 0", fontSize: 14 }}>Everything a child needs to learn, play, and grow in a safe and stimulating environment.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
          {items.map((item) => (
            <div key={item.title} style={{
              background: "white", borderRadius: 20, padding: 20,
              border: "1px solid #f3f4f6", cursor: "default",
              transition: "all 0.3s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#fed7aa"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(249,115,22,0.15)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#f3f4f6"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: item.grad,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 12, boxShadow: "0 4px 12px rgba(249,115,22,0.25)",
              }}>
                {item.icon}
              </div>
              <h3 style={{ fontWeight: 700, color: "#111827", fontSize: 14, marginBottom: 4 }}>{item.title}</h3>
              <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>{item.desc}</p>
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
    { name: "Playgroup", age: "2+ Years", emoji: "🍼", bg: "#fefce8", border: "#fef08a", color: "#a16207" },
    { name: "Nursery", age: "3+ Years", emoji: "🌱", bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d" },
    { name: "Jr. KG", age: "4 Years", emoji: "🎨", bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8" },
    { name: "Sr. KG", age: "5 Years", emoji: "⭐", bg: "#faf5ff", border: "#e9d5ff", color: "#7c3aed" },
    { name: "Class 1–4", age: "6–9 Years", emoji: "📚", bg: "#fff7ed", border: "#fed7aa", color: "#c2410c" },
    { name: "Class 5–8", age: "10+ Years", emoji: "🎓", bg: "#fff1f2", border: "#fecdd3", color: "#be123c" },
  ];
  return (
    <Section id="classes" style={{ padding: "80px 0", background: "white" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Badge color="yellow">Classes Offered</Badge>
          <h2 style={{ marginTop: 12, fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 900, color: "#111827" }}>
            Programs <span style={{ background: "linear-gradient(135deg, #f97316, #dc2626)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>We Offer</span>
          </h2>
          <p style={{ marginTop: 12, color: "#6b7280", maxWidth: 400, margin: "12px auto 0", fontSize: 14 }}>From playgroup to Class 8 — we shape every stage of your child's early education journey.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
          {classes.map((cls) => (
            <div key={cls.name} style={{
              background: cls.bg, borderRadius: 20,
              border: `2px solid ${cls.border}`,
              color: cls.color, textAlign: "center",
              padding: 20, cursor: "default",
              transition: "all 0.3s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-8px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{cls.emoji}</div>
              <div style={{ fontWeight: 900, fontSize: 15 }}>{cls.name}</div>
              <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.7, marginTop: 4 }}>{cls.age}</div>
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
    { bg: "linear-gradient(135deg,#fb923c,#fbbf24)", label: "Classroom Activities", emoji: "🎨" },
    { bg: "linear-gradient(135deg,#f87171,#f43f5e)", label: "Sports Day", emoji: "🏀" },
    { bg: "linear-gradient(135deg,#fcd34d,#f97316)", label: "Cultural Program", emoji: "🎭" },
    { bg: "linear-gradient(135deg,#fbbf24,#ef4444)", label: "Annual Day", emoji: "🏆" },
    { bg: "linear-gradient(135deg,#f97316,#dc2626)", label: "Science Expo", emoji: "🔬" },
    { bg: "linear-gradient(135deg,#fca5a5,#f97316)", label: "Playground Fun", emoji: "🎠" },
  ];
  return (
    <Section id="gallery" style={{ padding: "80px 0", background: "linear-gradient(180deg, rgba(255,247,237,0.4), white)" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Badge color="orange">Gallery</Badge>
          <h2 style={{ marginTop: 12, fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 900, color: "#111827" }}>
            Life at <span style={{ background: "linear-gradient(135deg, #f97316, #dc2626)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Mauli School</span>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {photos.map((p, i) => (
            <div key={i} style={{
              position: "relative", height: 200, borderRadius: 20,
              background: p.bg, overflow: "hidden", cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              transition: "all 0.3s",
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.2)"; e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.querySelector(".label").style.transform = "translateY(0)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.querySelector(".label").style.transform = "translateY(100%)"; }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>{p.emoji}</div>
              <div className="label" style={{
                position: "absolute", inset: "auto 0 0",
                background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)",
                padding: 12, textAlign: "center",
                transform: "translateY(100%)",
                transition: "transform 0.3s",
              }}>
                <p style={{ color: "white", fontSize: 13, fontWeight: 700, margin: 0 }}>{p.label}</p>
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
    <Section id="admission" style={{ padding: "80px 0" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px" }}>
        <div style={{
          position: "relative",
          background: "linear-gradient(135deg, #f97316, #dc2626, #e11d48)",
          borderRadius: 28, padding: "48px 40px",
          overflow: "hidden", color: "white",
          boxShadow: "0 20px 60px rgba(249,115,22,0.4)",
        }}>
          <div style={{ position: "absolute", top: -64, right: -64, width: 256, height: 256, background: "rgba(255,255,255,0.08)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", bottom: -40, left: -40, width: 192, height: 192, background: "rgba(255,255,255,0.08)", borderRadius: "50%" }} />
          <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }} className="admission-grid">
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.2)", color: "white",
                fontSize: 12, fontWeight: 700, padding: "6px 14px",
                borderRadius: 9999, marginBottom: 16,
              }}>
                <span style={{ width: 8, height: 8, background: "#fde047", borderRadius: "50%", display: "inline-block" }} />
                Admissions Now Open
              </div>
              <h2 style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)", fontWeight: 900, margin: "0 0 12px", lineHeight: 1.2 }}>Secure Your Child's<br />Future Today</h2>
              <p style={{ color: "rgba(255,237,213,0.9)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>Limited seats available for the academic year 2025–26. Apply early to avail special discounts.</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href="#contact" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 24px", background: "white", color: "#ea580c",
                  fontWeight: 700, borderRadius: 12, textDecoration: "none", fontSize: 14,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                }}>
                  Apply Now <ArrowRight size={16} />
                </a>
                <a href="tel:9130415350" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 24px", background: "rgba(255,255,255,0.2)",
                  color: "white", fontWeight: 700, borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.3)", textDecoration: "none", fontSize: 14,
                }}>
                  <Phone size={15} /> Call Now
                </a>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {benefits.map((b) => (
                <div key={b} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  background: "rgba(255,255,255,0.15)", borderRadius: 14,
                  padding: "10px 16px",
                }}>
                  <Check size={16} color="#fde047" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{b}</span>
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
    { icon: <Phone size={18} color="white" />, label: "Phone", value: "9130415350 / 8180993047", href: "tel:9130415350" },
    { icon: <Mail size={18} color="white" />, label: "Email", value: "erakidmauli@gmail.com", href: "mailto:erakidmauli@gmail.com" },
    { icon: <MapPin size={18} color="white" />, label: "Address", value: "Somatane Phata, Talegaon Dabhade, Pune", href: "#" },
  ];
  const inputStyle = {
    width: "100%", padding: "10px 16px", borderRadius: 12,
    border: "1.5px solid #e5e7eb", outline: "none",
    fontSize: 14, fontFamily: "inherit", boxSizing: "border-box",
    transition: "border-color 0.2s",
  };
  return (
    <Section id="contact" style={{ padding: "80px 0", background: "linear-gradient(180deg, rgba(255,247,237,0.4), white)" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Badge color="red">Contact Us</Badge>
          <h2 style={{ marginTop: 12, fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 900, color: "#111827" }}>
            Get in <span style={{ background: "linear-gradient(135deg, #f97316, #dc2626)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Touch</span>
          </h2>
          <p style={{ marginTop: 12, color: "#6b7280", fontSize: 14 }}>We'd love to hear from you. Reach out for admissions or any enquiries.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }} className="contact-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {info.map((item) => (
              <a key={item.label} href={item.href} style={{
                display: "flex", alignItems: "flex-start", gap: 16,
                padding: 20, background: "white", borderRadius: 20,
                border: "1px solid #f3f4f6", textDecoration: "none",
                transition: "all 0.3s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#fed7aa"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(249,115,22,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#f3f4f6"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: "linear-gradient(135deg, #f97316, #dc2626)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
                }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{item.value}</div>
                </div>
              </a>
            ))}
            <div style={{ padding: 20, background: "linear-gradient(135deg, #fff7ed, #fefce8)", borderRadius: 20, border: "1px solid #fed7aa" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#c2410c", margin: "0 0 4px" }}>School Hours</p>
              <p style={{ fontSize: 14, color: "#374151", margin: "0 0 4px" }}>Mon – Sat: 8:00 AM – 2:00 PM</p>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Admission office open till 4:00 PM</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ background: "white", borderRadius: 20, border: "1px solid #f3f4f6", padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontWeight: 900, color: "#111827", fontSize: 20, margin: "0 0 20px" }}>Send an Enquiry</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Your Name</label>
              <input type="text" required value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
                placeholder="Parent / Guardian Name" style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#f97316"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Phone Number</label>
              <input type="tel" required value={form.phone} onChange={e => setForm(v => ({ ...v, phone: e.target.value }))}
                placeholder="10-digit mobile number" style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#f97316"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Message</label>
              <textarea rows={4} value={form.message} onChange={e => setForm(v => ({ ...v, message: e.target.value }))}
                placeholder="Your enquiry or message..." style={{ ...inputStyle, resize: "none" }}
                onFocus={e => e.target.style.borderColor = "#f97316"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            </div>
            <button type="submit" style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "12px 0", background: "linear-gradient(135deg, #f97316, #dc2626)",
              color: "white", fontWeight: 700, borderRadius: 14, border: "none",
              cursor: "pointer", fontSize: 14, fontFamily: "inherit",
              boxShadow: "0 4px 16px rgba(249,115,22,0.35)",
              transition: "all 0.2s",
            }}>
              {sent ? "✅ Message Sent!" : <><Send size={16} /> Send Message</>}
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
    <footer style={{ background: "#030712", color: "#9ca3af" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32, marginBottom: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #f97316, #dc2626)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <GraduationCap size={18} color="white" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "white", letterSpacing: "0.05em" }}>MAULI SCHOOL</div>
                <div style={{ fontSize: 9, color: "#4b5563", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>CBSE Pattern</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.7, margin: 0 }}>
              Sanvid Pratishthan Sanchalit<br />Quality education from Pre-Primary to Class 8.
            </p>
          </div>
          <div>
            <h4 style={{ color: "white", fontWeight: 700, fontSize: 13, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Quick Links</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {["Home", "About", "Facilities", "Classes", "Admission", "Contact"].map((l) => (
                <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: 12, color: "#4b5563", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => e.target.style.color = "#fb923c"}
                  onMouseLeave={e => e.target.style.color = "#4b5563"}>{l}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ color: "white", fontWeight: 700, fontSize: 13, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Contact</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a href="tel:9130415350" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#4b5563", textDecoration: "none" }}><Phone size={13} /> 9130415350 / 8180993047</a>
              <a href="mailto:erakidmauli@gmail.com" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#4b5563", textDecoration: "none" }}><Mail size={13} /> erakidmauli@gmail.com</a>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "#4b5563" }}><MapPin size={13} style={{ flexShrink: 0, marginTop: 1 }} /> Somatane Phata, Talegaon Dabhade, Pune</div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #111827", paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: 12, color: "#374151" }}>
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} Mauli English Medium School & College. All rights reserved.</p>
          <p style={{ margin: 0 }}>Admissions Open · CBSE Pattern · No Donation</p>
        </div>
      </div>
    </footer>
  );
}

// ─── SCROLL TO TOP ────────────────────────────────────────────────────────────
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
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 50,
        width: 44, height: 44, borderRadius: "50%",
        background: "linear-gradient(135deg, #f97316, #dc2626)",
        color: "white", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 16px rgba(249,115,22,0.5)",
        transition: "transform 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
    >
      <ChevronUp size={20} />
    </button>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        /* Responsive */
        .hidden-mobile { display: flex; }
        .show-mobile { display: none; }
        .hero-grid { grid-template-columns: 1fr 1fr; }
        .hero-text { text-align: left; }
        .hero-card-wrap { display: flex; }
        .admission-grid { grid-template-columns: 1fr 1fr; }
        .contact-grid { grid-template-columns: 1fr 1fr; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-text { text-align: center !important; }
          .hero-card-wrap { justify-content: center !important; }
          .admission-grid { grid-template-columns: 1fr !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
        }
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
