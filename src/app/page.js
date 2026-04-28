"use client";

import { useState, useEffect, useRef } from "react";
import {
  GraduationCap, Shield, Heart, Camera, Target, Monitor,
  Music, Gamepad2, CircleDot, Star, Theater, Bus,
  Phone, Mail, MapPin, Clock, Send, CheckCircle2,
  Menu, X, ChevronUp, Loader2, LogIn, Flame,
} from "lucide-react";

/* ─────────────────── hooks ─────────────────── */
function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, delay = 0, style: outerStyle = {}, className = "" }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      style={{
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        ...outerStyle,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

/* ─────────────────── data ─────────────────── */
const NAV_LINKS = ["home","about","facilities","classes","gallery","admission","contact"];

const FACILITIES = [
  { Icon: Camera,    label: "CCTV Surveillance", desc: "24/7 campus monitoring"       },
  { Icon: Target,    label: "Activity Room",     desc: "Creative play-based space"    },
  { Icon: Monitor,   label: "Smart Desks",       desc: "Modern ergonomic furniture"   },
  { Icon: Music,     label: "Audio/Video Room",  desc: "Digital multimedia lab"       },
  { Icon: Gamepad2,  label: "Playground",        desc: "Slides, swings & play area"   },
  { Icon: CircleDot, label: "Basketball Court",  desc: "Full-size sports court"       },
  { Icon: Star,      label: "Learning Toys",     desc: "Educational early toys"       },
  { Icon: Theater,   label: "Cultural Hall",     desc: "Events & performances"        },
  { Icon: Bus,       label: "Transport",         desc: "Safe school bus service"      },
];

const CLASSES = [
  { emoji:"🍼", name:"Playgroup", age:"2+ Years" },
  { emoji:"🌱", name:"Nursery",   age:"3+ Years" },
  { emoji:"🎨", name:"Jr. KG",   age:"4 Years"  },
  { emoji:"⭐", name:"Sr. KG",   age:"5 Years"  },
  { emoji:"📚", name:"Class 1–4",age:"6–9 Yrs"  },
  { emoji:"🎓", name:"Class 5–8",age:"10+ Yrs"  },
];

const GALLERY = [
  { emoji:"🎨", label:"Classroom Activities", bg:"#140d2e" },
  { emoji:"🏀", label:"Sports Day",           bg:"#0b1a2e" },
  { emoji:"🎭", label:"Cultural Program",     bg:"#2a1008" },
  { emoji:"🏆", label:"Annual Day",           bg:"#1a0a2e" },
  { emoji:"🔬", label:"Science Expo",         bg:"#062618" },
  { emoji:"🎠", label:"Playground Fun",       bg:"#1a1208" },
];

/* ── shared styles ── */
const S = {
  amber: "#f59e0b",
  amberDim: "rgba(245,158,11,0.12)",
  amberBorder: "rgba(245,158,11,0.18)",
  bg0: "#09090b",
  bg1: "#0c0c0f",
  bg2: "#111113",
  card: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.06)",
  text: "#f4f4f5",
  muted: "#71717a",
  dim: "#52525b",
  sora: "'Sora', sans-serif",
  dm: "'DM Sans', sans-serif",
};

const cardBase = {
  background: `linear-gradient(160deg, ${S.card} 0%, rgba(9,9,11,0.9) 100%)`,
  border: `1px solid ${S.border}`,
  borderRadius: 20,
};

/* ═══════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════ */
export default function MauliSchoolPage() {
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [showTop,    setShowTop]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [formError,  setFormError]  = useState("");

  const blankForm = {
    childName:"", fatherName:"", residentialAddress:"",
    pinCode:"", phoneNo:"", mobileNo:"", email:"",
    gender:"", age:"", dateOfBirth:"",
    preferredAdmissionDate:"", remark:"",
    classApplying:"", academicYear:"",
  };
  const [form, setForm] = useState(blankForm);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    const fn = () => { setScrolled(window.scrollY > 40); setShowTop(window.scrollY > 500); };
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  async function submitEnquiry(e) {
    e.preventDefault();
    setFormError(""); setSubmitting(true);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form, age: Number(form.age),
          dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : undefined,
          preferredAdmissionDate: form.preferredAdmissionDate
            ? new Date(form.preferredAdmissionDate).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Submission failed");
      setSubmitted(true);
      setForm(blankForm);
      setTimeout(() => setSubmitted(false), 6000);
    } catch (err) {
      setFormError(err.message);
    } finally { setSubmitting(false); }
  }

  /* ── nav hover helpers ── */
  const hoverAmber = (e) => { e.currentTarget.style.color = S.amber; e.currentTarget.style.background = S.amberDim; };
  const leaveGray  = (e) => { e.currentTarget.style.color = S.muted;  e.currentTarget.style.background = "transparent"; };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:'DM Sans',sans-serif;background:#09090b;color:#d4d4d8}
        h1,h2,h3,h4{font-family:'Sora',sans-serif}
        a{text-decoration:none;color:inherit}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(245,158,11,0.3);border-radius:4px}

        @keyframes heroUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes shimmer{0%{background-position:-300% center}100%{background-position:300% center}}
        @keyframes ring{0%{box-shadow:0 0 0 0 rgba(245,158,11,0.5)}70%{box-shadow:0 0 0 10px rgba(245,158,11,0)}100%{box-shadow:0 0 0 0 rgba(245,158,11,0)}}
        @keyframes spin{to{transform:rotate(360deg)}}

        .hero-up{animation:heroUp 0.9s cubic-bezier(.16,1,.3,1) both}
        .hero-up-2{animation:heroUp 0.9s 0.18s cubic-bezier(.16,1,.3,1) both}
        .card-float{animation:float 4.5s ease-in-out infinite}
        .fire-text{
          background:linear-gradient(90deg,#f59e0b,#fb923c,#f87171,#fb923c,#f59e0b);
          background-size:300% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
          animation:shimmer 5s linear infinite}
        .ring{animation:ring 2.2s ease infinite}
        .spin{animation:spin 1s linear infinite}

        .fac-card:hover{transform:translateY(-4px)!important;border-color:rgba(245,158,11,0.22)!important;box-shadow:0 12px 40px rgba(0,0,0,0.45)!important}
        .cls-card:hover{transform:translateY(-8px)!important;border-color:rgba(245,158,11,0.28)!important;box-shadow:0 16px 44px rgba(0,0,0,0.55)!important}
        .gal-card:hover{transform:scale(1.03)!important;box-shadow:0 20px 50px rgba(0,0,0,0.7)!important}
        .gal-card:hover .gal-label{transform:translateY(0)!important}
        .about-card:hover{border-color:rgba(245,158,11,0.22)!important;box-shadow:0 8px 32px rgba(245,158,11,0.07)!important}
        .info-link:hover{border-color:rgba(245,158,11,0.22)!important;box-shadow:0 4px 20px rgba(245,158,11,0.07)!important}
        .fd-input:focus{border-color:rgba(245,158,11,0.55)!important;background:#131315!important}

        @media(max-width:768px){
          .hero-grid{grid-template-columns:1fr!important}
          .hero-card-col{display:none}
          .adm-grid{grid-template-columns:1fr!important}
          .contact-grid{grid-template-columns:1fr!important}
          .nav-desktop{display:none!important}
          .nav-mobile-btn{display:flex!important}
        }
        @media(min-width:769px){
          .nav-mobile-btn{display:none!important}
          .mobile-menu-panel{display:none!important}
        }
      `}</style>

      <div style={{ background: S.bg0, minHeight:"100vh" }}>

        {/* ══════ NAV ══════ */}
        <nav style={{
          position:"fixed", inset:"0 0 auto", zIndex:50,
          background: scrolled ? "rgba(9,9,11,0.97)" : "rgba(9,9,11,0.82)",
          backdropFilter:"blur(20px) saturate(1.5)",
          borderBottom: `1px solid ${scrolled ? S.amberBorder : "rgba(255,255,255,0.04)"}`,
          boxShadow: scrolled ? "0 2px 32px rgba(245,158,11,0.07)" : "none",
          transition:"all 0.35s",
        }}>
          <div style={{ maxWidth:1152, margin:"0 auto", padding:"0 24px", height:64,
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>

            <a href="#home" style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{
                width:38, height:38, borderRadius:12,
                background:"linear-gradient(135deg,#f59e0b,#ef4444)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 4px 16px rgba(245,158,11,0.3)",
              }}>
                <Flame size={18} color="white"/>
              </div>
              <div>
                <div style={{ fontFamily:S.sora, fontSize:13, fontWeight:900, color:S.amber, letterSpacing:"0.06em", lineHeight:1 }}>MAULI SCHOOL</div>
                <div style={{ fontSize:9, color:"#3f3f46", fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase" }}>CBSE Pattern</div>
              </div>
            </a>

            {/* desktop */}
            <div className="nav-desktop" style={{ display:"flex", alignItems:"center", gap:2 }}>
              {NAV_LINKS.map(l => (
                <a key={l} href={`#${l}`}
                  onMouseEnter={hoverAmber} onMouseLeave={leaveGray}
                  style={{ padding:"8px 13px", fontSize:13, fontWeight:600, color:S.muted,
                    borderRadius:10, textTransform:"capitalize", transition:"all 0.2s" }}>
                  {l}
                </a>
              ))}
              <a href="/login"
                style={{ marginLeft:8, display:"flex", alignItems:"center", gap:6,
                  padding:"7px 16px", fontSize:13, fontWeight:700, color:"#a1a1aa",
                  background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                  borderRadius:9999, transition:"all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.color="#fff"; e.currentTarget.style.background="rgba(255,255,255,0.09)"; }}
                onMouseLeave={e => { e.currentTarget.style.color="#a1a1aa"; e.currentTarget.style.background="rgba(255,255,255,0.04)"; }}>
                <LogIn size={13}/> Login
              </a>
              <a href="#admission" style={{
                marginLeft:6, padding:"8px 22px", fontSize:13, fontWeight:700, color:"white",
                borderRadius:9999, background:"linear-gradient(135deg,#f59e0b,#ef4444)",
                boxShadow:"0 4px 16px rgba(245,158,11,0.3)",
              }}>Apply Now</a>
            </div>

            {/* mobile toggle */}
            <button className="nav-mobile-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ width:36, height:36, background:"rgba(255,255,255,0.04)",
                border:"1px solid rgba(255,255,255,0.07)", borderRadius:8,
                cursor:"pointer", color:S.muted, alignItems:"center", justifyContent:"center" }}>
              {menuOpen ? <X size={18}/> : <Menu size={18}/>}
            </button>
          </div>

          {menuOpen && (
            <div className="mobile-menu-panel" style={{ background:S.bg0, borderTop:`1px solid ${S.amberBorder}` }}>
              {NAV_LINKS.map(l => (
                <a key={l} href={`#${l}`} onClick={() => setMenuOpen(false)}
                  style={{ display:"block", padding:"12px 24px", fontSize:14, fontWeight:600,
                    color:S.muted, textTransform:"capitalize" }}>{l}</a>
              ))}
              <a href="/login" onClick={() => setMenuOpen(false)}
                style={{ display:"flex", alignItems:"center", gap:6, margin:"6px 16px",
                  padding:"10px 16px", fontSize:14, fontWeight:700, color:"#a1a1aa",
                  background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                  borderRadius:12 }}>
                <LogIn size={14}/> Login
              </a>
              <a href="#admission" onClick={() => setMenuOpen(false)}
                style={{ display:"block", margin:"6px 16px 14px", padding:"10px 16px",
                  textAlign:"center", fontSize:14, fontWeight:700, color:"white", borderRadius:12,
                  background:"linear-gradient(135deg,#f59e0b,#ef4444)" }}>
                Apply Now
              </a>
            </div>
          )}
        </nav>

        {/* ══════ HERO ══════ */}
        <section id="home" style={{
          position:"relative", minHeight:"100vh", display:"flex", alignItems:"center",
          paddingTop:64, overflow:"hidden",
          background:"linear-gradient(150deg,#09090b 0%,#0f0c08 45%,#130f06 70%,#09090b 100%)",
        }}>
          <div style={{ position:"absolute", top:-120, right:-120, width:640, height:640, borderRadius:"50%",
            background:"radial-gradient(circle,rgba(245,158,11,0.13) 0%,transparent 65%)", filter:"blur(50px)", pointerEvents:"none" }}/>
          <div style={{ position:"absolute", bottom:-100, left:-100, width:520, height:520, borderRadius:"50%",
            background:"radial-gradient(circle,rgba(239,68,68,0.07) 0%,transparent 65%)", filter:"blur(40px)", pointerEvents:"none" }}/>
          <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.025,
            backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
            backgroundSize:"80px 80px" }}/>

          <div style={{ maxWidth:1152, margin:"0 auto", padding:"80px 24px", width:"100%" }}>
            <div className="hero-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:56, alignItems:"center" }}>

              {/* left */}
              <div className="hero-up">
                <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"5px 15px",
                  borderRadius:9999, background:S.amberDim, border:`1px solid ${S.amberBorder}`, marginBottom:24 }}>
                  <span className="ring" style={{ width:8, height:8, borderRadius:"50%", background:S.amber, display:"inline-block" }}/>
                  <span style={{ fontSize:12, fontWeight:700, color:S.amber }}>Admissions Open 2025–26</span>
                </div>

                <h1 style={{ lineHeight:1.05, marginBottom:16 }}>
                  <span className="fire-text" style={{ display:"block", fontSize:"clamp(3rem,6vw,4.5rem)", fontWeight:900 }}>MAULI</span>
                  <span style={{ display:"block", fontSize:"clamp(2rem,4vw,3rem)", fontWeight:800, color:S.text }}>English Medium</span>
                  <span style={{ display:"block", fontSize:"clamp(1.2rem,2.5vw,1.7rem)", fontWeight:600, color:S.dim }}>School &amp; College</span>
                </h1>

                <p style={{ fontSize:14, color:S.dim, marginBottom:24, lineHeight:1.7 }}>
                  <strong style={{ color:S.amber }}>CBSE Pattern</strong> · Sanvid Pratishthan Sanchalit<br/>
                  Somatane Phata, Talegaon Dabhade, Pune
                </p>

                <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:28 }}>
                  {[
                    ["✅ No Donation",           "rgba(16,185,129,0.1)","rgba(16,185,129,0.25)","#34d399"],
                    ["🎉 50% Discount",          "rgba(245,158,11,0.1)","rgba(245,158,11,0.25)",S.amber],
                    ["👶 Pre-Primary & Primary", "rgba(239,68,68,0.1)", "rgba(239,68,68,0.25)","#f87171"],
                  ].map(([t,bg,br,tc]) => (
                    <span key={t} style={{ padding:"4px 13px", borderRadius:9999, fontSize:12, fontWeight:700,
                      background:bg, border:`1px solid ${br}`, color:tc }}>{t}</span>
                  ))}
                </div>

                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                  <a href="#admission" style={{ display:"inline-flex", alignItems:"center", gap:8,
                    padding:"12px 28px", background:"linear-gradient(135deg,#f59e0b,#ef4444)",
                    color:"white", fontWeight:700, borderRadius:16, fontSize:14,
                    boxShadow:"0 8px 28px rgba(245,158,11,0.28)" }}>Apply Now →</a>
                  <a href="tel:9130415350" style={{ display:"inline-flex", alignItems:"center", gap:8,
                    padding:"12px 28px", background:"rgba(255,255,255,0.03)",
                    border:`1px solid ${S.amberBorder}`, color:S.amber,
                    fontWeight:700, borderRadius:16, fontSize:14 }}>
                    <Phone size={14}/> Call Us
                  </a>
                </div>
              </div>

              {/* right card */}
              <div className="hero-card-col" style={{ display:"flex", justifyContent:"flex-end" }}>
                <div className="card-float hero-up-2" style={{ position:"relative", width:"100%", maxWidth:340 }}>
                  <div style={{
                    background:"linear-gradient(160deg,rgba(245,158,11,0.05) 0%,rgba(9,9,11,0.97) 100%)",
                    border:`1px solid ${S.amberBorder}`, borderRadius:28, padding:32,
                    boxShadow:"0 32px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}>
                    <div style={{ width:78, height:78, margin:"0 auto 16px", borderRadius:22,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      background:"linear-gradient(135deg,#f59e0b,#ef4444)",
                      boxShadow:"0 8px 32px rgba(245,158,11,0.35)" }}>
                      <GraduationCap size={38} color="white"/>
                    </div>
                    <h3 style={{ textAlign:"center", fontWeight:900, fontSize:20, color:S.text, marginBottom:4 }}>Mauli School</h3>
                    <p style={{ textAlign:"center", fontSize:13, color:S.dim, marginBottom:24 }}>Nurturing young minds since day one</p>
                    {["Caring & Qualified Teachers","Safe & Secure Campus","CBSE Curriculum","Activity-Based Learning"].map(t => (
                      <div key={t} style={{ display:"flex", alignItems:"center", gap:10, fontSize:14, color:"#a1a1aa", marginBottom:12 }}>
                        <div style={{ width:20, height:20, borderRadius:"50%",
                          background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)",
                          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <CheckCircle2 size={11} color="#34d399"/>
                        </div>
                        {t}
                      </div>
                    ))}
                  </div>
                  <div style={{ position:"absolute", top:-16, left:-20,
                    background:"linear-gradient(135deg,#f59e0b,#ef4444)", color:"white",
                    fontSize:12, fontWeight:700, padding:"8px 14px", borderRadius:12,
                    boxShadow:"0 4px 16px rgba(245,158,11,0.4)" }}>🏆 Best School</div>
                  <div style={{ position:"absolute", bottom:-16, right:-16,
                    background:"rgba(9,9,11,0.95)", border:`1px solid ${S.amberBorder}`,
                    color:S.amber, fontSize:12, fontWeight:700, padding:"8px 14px", borderRadius:12,
                    boxShadow:"0 4px 20px rgba(0,0,0,0.5)" }}>50% Discount 🎉</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════ ABOUT ══════ */}
        <section id="about" style={{ background:S.bg0, padding:"80px 0" }}>
          <div style={{ maxWidth:1152, margin:"0 auto", padding:"0 24px" }}>
            <Reveal style={{ textAlign:"center", marginBottom:48 }}>
              <SectionHeader chip="About Us" chipColor="amber"
                title={<>Why Choose <span className="fire-text">Mauli School?</span></>}
                desc={<>Established under <strong style={{ color:"#a1a1aa" }}>Sanvid Pratishthan Sanchalit</strong>, we provide quality CBSE-pattern education from Pre-Primary to Class 8.</>}/>
            </Reveal>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:20 }}>
              {[
                { Icon:GraduationCap, title:"Caring Teachers",   desc:"Experienced educators who nurture every child individually.",   bg:"rgba(245,158,11,0.1)",  ic:S.amber },
                { Icon:Shield,        title:"Safe Environment",  desc:"CCTV-monitored, child-safe campus with secure atmosphere.",     bg:"rgba(139,92,246,0.1)",  ic:"#a78bfa" },
                { Icon:Heart,         title:"Holistic Growth",   desc:"Academics paired with sports, arts, and cultural activities.",  bg:"rgba(16,185,129,0.1)",  ic:"#34d399" },
              ].map(({Icon,title,desc,bg,ic}, i) => (
                <Reveal key={title} delay={i*100}>
                  <div className="about-card" style={{ ...cardBase, padding:24, transition:"all 0.3s", cursor:"default" }}>
                    <div style={{ width:48, height:48, borderRadius:14, background:bg,
                      display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                      <Icon size={22} color={ic}/>
                    </div>
                    <h3 style={{ fontWeight:700, color:S.text, marginBottom:8, fontSize:16 }}>{title}</h3>
                    <p style={{ fontSize:14, color:S.dim, lineHeight:1.6 }}>{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ FACILITIES ══════ */}
        <section id="facilities" style={{ background:S.bg1, padding:"80px 0" }}>
          <div style={{ maxWidth:1152, margin:"0 auto", padding:"0 24px" }}>
            <Reveal style={{ textAlign:"center", marginBottom:48 }}>
              <SectionHeader chip="Our Facilities" chipColor="red"
                title={<>World-Class <span className="fire-text">Infrastructure</span></>}
                desc="Everything a child needs to learn, play, and grow."/>
            </Reveal>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))", gap:14 }}>
              {FACILITIES.map(({Icon,label,desc}, i) => (
                <Reveal key={label} delay={(i%5)*60}>
                  <div className="fac-card" style={{ ...cardBase, padding:20, cursor:"default", transition:"all 0.3s" }}>
                    <div style={{ width:42, height:42, borderRadius:12,
                      background:S.amberDim, border:`1px solid ${S.amberBorder}`,
                      display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                      <Icon size={19} color={S.amber}/>
                    </div>
                    <h3 style={{ fontWeight:700, color:"#e4e4e7", fontSize:13, marginBottom:4 }}>{label}</h3>
                    <p style={{ fontSize:11, color:S.dim, lineHeight:1.5 }}>{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ CLASSES ══════ */}
        <section id="classes" style={{ background:S.bg0, padding:"80px 0" }}>
          <div style={{ maxWidth:1152, margin:"0 auto", padding:"0 24px" }}>
            <Reveal style={{ textAlign:"center", marginBottom:48 }}>
              <SectionHeader chip="Classes Offered" chipColor="yellow"
                title={<>Programs <span className="fire-text">We Offer</span></>}
                desc="From playgroup to Class 8 — every stage of your child's early education."/>
            </Reveal>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:14 }}>
              {CLASSES.map(({emoji,name,age}, i) => (
                <Reveal key={name} delay={i*80}>
                  <div className="cls-card" style={{
                    background:`linear-gradient(160deg,rgba(245,158,11,0.04) 0%,rgba(9,9,11,0.95) 100%)`,
                    border:`1px solid rgba(245,158,11,0.1)`,
                    borderRadius:20, padding:"22px 16px", textAlign:"center",
                    cursor:"default", transition:"all 0.3s",
                  }}>
                    <div style={{ fontSize:40, marginBottom:12 }}>{emoji}</div>
                    <div style={{ fontWeight:900, fontSize:15, color:S.text }}>{name}</div>
                    <div style={{ fontSize:12, color:S.dim, marginTop:4 }}>{age}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ GALLERY ══════ */}
        <section id="gallery" style={{ background:S.bg1, padding:"80px 0" }}>
          <div style={{ maxWidth:1152, margin:"0 auto", padding:"0 24px" }}>
            <Reveal style={{ textAlign:"center", marginBottom:48 }}>
              <SectionHeader chip="Gallery" chipColor="amber"
                title={<>Life at <span className="fire-text">Mauli School</span></>}/>
            </Reveal>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
              {GALLERY.map(({emoji,label,bg}, i) => (
                <Reveal key={label} delay={(i%3)*80}>
                  <div className="gal-card" style={{
                    position:"relative", height:200, borderRadius:20, overflow:"hidden",
                    background:bg, border:`1px solid ${S.border}`,
                    cursor:"pointer", transition:"all 0.3s",
                  }}>
                    <div style={{ position:"absolute", inset:0, display:"flex",
                      alignItems:"center", justifyContent:"center", fontSize:54 }}>{emoji}</div>
                    <div className="gal-label" style={{
                      position:"absolute", inset:"auto 0 0",
                      background:"linear-gradient(to top,rgba(0,0,0,0.85),transparent)",
                      padding:"12px", textAlign:"center",
                      transform:"translateY(100%)", transition:"transform 0.3s",
                    }}>
                      <p style={{ color:"white", fontSize:13, fontWeight:700, margin:0 }}>{label}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ ADMISSION ══════ */}
        <section id="admission" style={{ background:S.bg0, padding:"80px 0" }}>
          <div style={{ maxWidth:1152, margin:"0 auto", padding:"0 24px" }}>
            <Reveal>
              <div style={{
                position:"relative", overflow:"hidden",
                background:"linear-gradient(135deg,#140c00,#0f0a00 50%,#0a0608)",
                border:`1px solid rgba(245,158,11,0.15)`,
                borderRadius:28, padding:"48px 40px",
                boxShadow:"0 24px 80px rgba(0,0,0,0.55)",
              }}>
                <div style={{ position:"absolute", top:-80, right:-80, width:320, height:320, borderRadius:"50%",
                  background:"radial-gradient(circle,rgba(245,158,11,0.1),transparent)", filter:"blur(40px)" }}/>
                <div style={{ position:"absolute", bottom:-60, left:-60, width:240, height:240, borderRadius:"50%",
                  background:"radial-gradient(circle,rgba(239,68,68,0.06),transparent)", filter:"blur(30px)" }}/>
                <div className="adm-grid" style={{ position:"relative", zIndex:1,
                  display:"grid", gridTemplateColumns:"1fr 1fr", gap:40, alignItems:"center" }}>
                  <div>
                    <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"5px 14px",
                      borderRadius:9999, background:S.amberDim, border:`1px solid ${S.amberBorder}`, marginBottom:16 }}>
                      <span style={{ width:8, height:8, background:"#fbbf24", borderRadius:"50%", display:"inline-block" }}/>
                      <span style={{ fontSize:12, fontWeight:700, color:S.amber }}>Admissions Now Open</span>
                    </div>
                    <h2 style={{ fontSize:"clamp(1.6rem,3.5vw,2.2rem)", fontWeight:900,
                      color:S.text, lineHeight:1.2, marginBottom:12 }}>
                      Secure Your Child's<br/>Future Today
                    </h2>
                    <p style={{ color:S.dim, fontSize:14, marginBottom:24, lineHeight:1.6 }}>
                      Limited seats available for 2025–26. Apply early to avail special discounts.
                    </p>
                    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                      <a href="#contact" style={{ display:"inline-flex", alignItems:"center", gap:8,
                        padding:"10px 24px", background:"linear-gradient(135deg,#f59e0b,#ef4444)",
                        color:"white", fontWeight:700, borderRadius:12, fontSize:14,
                        boxShadow:"0 4px 20px rgba(245,158,11,0.25)" }}>Apply Now →</a>
                      <a href="tel:9130415350" style={{ display:"inline-flex", alignItems:"center", gap:8,
                        padding:"10px 24px", background:"rgba(255,255,255,0.04)",
                        border:"1px solid rgba(255,255,255,0.08)",
                        color:"#a1a1aa", fontWeight:700, borderRadius:12, fontSize:14 }}>
                        <Phone size={14}/> Call Now
                      </a>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {[
                      "No Donation — Zero hidden charges",
                      "50% Discount on fees for deserving students",
                      "Trained & caring staff for all classes",
                      "CBSE pattern curriculum",
                      "Safe, CCTV-monitored campus",
                      "Transport facility available",
                    ].map(b => (
                      <div key={b} style={{ display:"flex", alignItems:"flex-start", gap:10,
                        background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)",
                        borderRadius:12, padding:"10px 16px" }}>
                        <CheckCircle2 size={14} color="#fbbf24" style={{ flexShrink:0, marginTop:2 }}/>
                        <span style={{ fontSize:13, color:"#a1a1aa" }}>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══════ CONTACT + FORM ══════ */}
        <section id="contact" style={{ background:S.bg1, padding:"80px 0" }}>
          <div style={{ maxWidth:1152, margin:"0 auto", padding:"0 24px" }}>
            <Reveal style={{ textAlign:"center", marginBottom:48 }}>
              <SectionHeader chip="Contact Us" chipColor="red"
                title={<>Get in <span className="fire-text">Touch</span></>}
                desc="We'd love to hear from you. Reach out for admissions or any enquiries."/>
            </Reveal>

            <div className="contact-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:24, alignItems:"start" }}>

              {/* info */}
              <Reveal>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[
                    { Icon:Phone, label:"Phone",   value:"9130415350 / 8180993047", href:"tel:9130415350" },
                    { Icon:Mail,  label:"Email",   value:"erakidmauli@gmail.com",    href:"mailto:erakidmauli@gmail.com" },
                    { Icon:MapPin,label:"Address", value:"Somatane Phata, Talegaon Dabhade, Pune", href:null },
                  ].map(({Icon,label,value,href}) => {
                    const inner = <>
                      <div style={{ width:44, height:44, borderRadius:12, flexShrink:0,
                        background:"linear-gradient(135deg,#f59e0b,#ef4444)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        boxShadow:"0 4px 12px rgba(245,158,11,0.25)" }}>
                        <Icon size={18} color="white"/>
                      </div>
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:S.dim,
                          textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:2 }}>{label}</div>
                        <div style={{ fontSize:14, fontWeight:600, color:"#e4e4e7" }}>{value}</div>
                      </div>
                    </>;
                    const sh = { display:"flex", alignItems:"flex-start", gap:14, padding:"16px 20px",
                      background:"rgba(255,255,255,0.02)", border:`1px solid ${S.border}`,
                      borderRadius:18, transition:"all 0.25s" };
                    return href
                      ? <a key={label} href={href} className="info-link" style={sh}>{inner}</a>
                      : <div key={label} style={sh}>{inner}</div>;
                  })}
                  <div style={{ padding:"18px 20px", background:"rgba(245,158,11,0.04)",
                    border:`1px solid rgba(245,158,11,0.12)`, borderRadius:18 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                      <Clock size={13} color={S.amber}/>
                      <span style={{ fontSize:13, fontWeight:700, color:S.amber }}>School Hours</span>
                    </div>
                    <p style={{ fontSize:14, color:S.muted }}>Mon – Sat: 8:00 AM – 2:00 PM</p>
                    <p style={{ fontSize:12, color:S.dim, marginTop:2 }}>Admission office open till 4:00 PM</p>
                  </div>
                </div>
              </Reveal>

              {/* ── enquiry form ── */}
              <Reveal delay={120}>
                <form onSubmit={submitEnquiry} style={{
                  background:`linear-gradient(160deg,rgba(245,158,11,0.03) 0%,rgba(9,9,11,0.98) 100%)`,
                  border:`1px solid rgba(245,158,11,0.1)`,
                  borderRadius:24, padding:28,
                  boxShadow:"0 20px 60px rgba(0,0,0,0.45)",
                }}>
                  <h3 style={{ fontWeight:900, color:S.text, fontSize:20, marginBottom:22 }}>Send an Enquiry</h3>

                  <Row>
                    <FInput label="Child's Name" required placeholder="Full name"
                      type="text" value={form.childName} onChange={set("childName")}/>
                    <FInput label="Father's Name" required placeholder="Father's name"
                      type="text" value={form.fatherName} onChange={set("fatherName")}/>
                  </Row>
                  <FInput label="Residential Address" required placeholder="Full residential address"
                    type="text" value={form.residentialAddress} onChange={set("residentialAddress")} style={{ marginBottom:12 }}/>
                  <Row>
                    <FInput label="Pin Code" required placeholder="411001"
                      type="text" value={form.pinCode} onChange={set("pinCode")}/>
                    {/* gender */}
                    <div>
                      <label style={{ display:"block", fontSize:10, fontWeight:700, color:S.dim,
                        textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>
                        Gender<span style={{ color:S.amber }}>*</span>
                      </label>
                      <select value={form.gender} onChange={set("gender")} required style={{
                        width:"100%", padding:"10px 14px", borderRadius:10,
                        border:"1px solid #27272a", background:S.bg2,
                        color: form.gender ? S.text : S.dim, fontSize:13,
                        outline:"none", fontFamily:S.dm,
                      }}>
                        <option value="" style={{ background:S.bg2 }}>Select</option>
                        {["Male","Female","Other"].map(g=>(
                          <option key={g} value={g} style={{ background:S.bg2 }}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </Row>
                  <Row>
                    <FInput label="Phone No" required placeholder="Landline"
                      type="tel" value={form.phoneNo} onChange={set("phoneNo")}/>
                    <FInput label="Mobile No" required placeholder="10-digit mobile"
                      type="tel" value={form.mobileNo} onChange={set("mobileNo")}/>
                  </Row>
                  <FInput label="Email" required placeholder="parent@email.com"
                    type="email" value={form.email} onChange={set("email")} style={{ marginBottom:12 }}/>
                  <Row>
                    <FInput label="Age" required placeholder="Years" type="number" min={1} max={20}
                      value={form.age} onChange={set("age")}/>
                    <FInput label="Date of Birth" required type="date"
                      value={form.dateOfBirth} onChange={set("dateOfBirth")}/>
                  </Row>
                  <FInput label="Preferred Admission Date" type="date"
                    value={form.preferredAdmissionDate} onChange={set("preferredAdmissionDate")} style={{ marginBottom:12 }}/>
                  <div style={{ marginBottom:16 }}>
                    <label style={{ display:"block", fontSize:10, fontWeight:700, color:S.dim,
                      textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>Remark</label>
                    <textarea rows={3} placeholder="Any message or queries..."
                      value={form.remark} onChange={set("remark")}
                      className="fd-input"
                      style={{ width:"100%", padding:"10px 14px", borderRadius:10,
                        border:"1px solid #27272a", background:S.bg2, color:S.text,
                        fontSize:13, resize:"none", outline:"none", fontFamily:S.dm,
                        transition:"border-color 0.2s, background 0.2s" }}/>
                  </div>

                  {formError && (
                    <div style={{ marginBottom:14, padding:"10px 14px", borderRadius:12,
                      background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)",
                      color:"#f87171", fontSize:13 }}>{formError}</div>
                  )}

                  <button type="submit" disabled={submitting} style={{
                    width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    padding:"13px 0",
                    background: submitted
                      ? "linear-gradient(135deg,#059669,#10b981)"
                      : "linear-gradient(135deg,#f59e0b,#ef4444)",
                    color:"white", fontWeight:700, borderRadius:14, border:"none",
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontSize:14, fontFamily:S.sora,
                    boxShadow: submitted ? "0 4px 20px rgba(16,185,129,0.3)" : "0 4px 20px rgba(245,158,11,0.28)",
                    opacity: submitting ? 0.7 : 1, transition:"all 0.3s",
                  }}>
                    {submitting
                      ? <><Loader2 size={16} className="spin"/> Sending…</>
                      : submitted
                      ? <><CheckCircle2 size={16}/> Enquiry Submitted!</>
                      : <><Send size={14}/> Send Enquiry</>}
                  </button>
                </form>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══════ FOOTER ══════ */}
        <footer style={{ background:"#050507", borderTop:"1px solid rgba(255,255,255,0.03)" }}>
          <div style={{ maxWidth:1152, margin:"0 auto", padding:"48px 24px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:32, marginBottom:32 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10,
                    background:"linear-gradient(135deg,#f59e0b,#ef4444)",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Flame size={16} color="white"/>
                  </div>
                  <div>
                    <div style={{ fontFamily:S.sora, fontSize:13, fontWeight:900, color:S.amber }}>MAULI SCHOOL</div>
                    <div style={{ fontSize:9, color:"#3f3f46", fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase" }}>CBSE Pattern</div>
                  </div>
                </div>
                <p style={{ fontSize:12, color:"#3f3f46", lineHeight:1.7 }}>
                  Sanvid Pratishthan Sanchalit<br/>
                  Quality education from Pre-Primary to Class 8.
                </p>
              </div>
              <div>
                <h4 style={{ color:S.dim, fontWeight:700, fontSize:12, marginBottom:12,
                  textTransform:"uppercase", letterSpacing:"0.06em" }}>Quick Links</h4>
                {NAV_LINKS.map(l => (
                  <a key={l} href={`#${l}`}
                    style={{ display:"block", fontSize:12, color:"#3f3f46", marginBottom:6,
                      textTransform:"capitalize", transition:"color 0.2s" }}
                    onMouseEnter={e=>e.target.style.color=S.amber}
                    onMouseLeave={e=>e.target.style.color="#3f3f46"}>{l}</a>
                ))}
              </div>
              <div>
                <h4 style={{ color:S.dim, fontWeight:700, fontSize:12, marginBottom:12,
                  textTransform:"uppercase", letterSpacing:"0.06em" }}>Contact</h4>
                {[["📞","9130415350 / 8180993047"],["✉️","erakidmauli@gmail.com"],
                  ["📍","Somatane Phata, Talegaon Dabhade, Pune"]].map(([i,t])=>(
                  <div key={t} style={{ display:"flex", alignItems:"flex-start", gap:8,
                    fontSize:12, color:"#3f3f46", marginBottom:8 }}>
                    <span>{i}</span><span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.03)", paddingTop:20,
              display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8,
              fontSize:12, color:"#27272a" }}>
              <p>© 2025 Mauli English Medium School &amp; College. All rights reserved.</p>
              <p>Admissions Open · CBSE Pattern · No Donation</p>
            </div>
          </div>
        </footer>

        {/* scroll top */}
        {showTop && (
          <button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}
            style={{ position:"fixed", bottom:24, right:24, zIndex:50,
              width:44, height:44, borderRadius:"50%",
              background:"linear-gradient(135deg,#f59e0b,#ef4444)",
              color:"white", border:"none", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 4px 20px rgba(245,158,11,0.4)", transition:"transform 0.2s" }}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
            onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
            <ChevronUp size={20}/>
          </button>
        )}
      </div>
    </>
  );
}

/* ── sub-components ── */
function SectionHeader({ chip, chipColor="amber", title, desc }) {
  const chipMap = {
    amber: { bg:"rgba(245,158,11,0.1)",  border:"rgba(245,158,11,0.2)",  color:"#f59e0b" },
    red:   { bg:"rgba(239,68,68,0.1)",   border:"rgba(239,68,68,0.2)",   color:"#f87171" },
    yellow:{ bg:"rgba(234,179,8,0.1)",   border:"rgba(234,179,8,0.2)",   color:"#fbbf24" },
  };
  const c = chipMap[chipColor] || chipMap.amber;
  return (
    <>
      <span style={{ display:"inline-flex", alignItems:"center", padding:"4px 12px",
        borderRadius:9999, fontSize:11, fontWeight:700,
        background:c.bg, border:`1px solid ${c.border}`, color:c.color }}>
        {chip}
      </span>
      <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:"clamp(1.8rem,4vw,2.5rem)",
        fontWeight:900, color:"#f4f4f5", margin:"12px 0 10px" }}>
        {title}
      </h2>
      {desc && <p style={{ color:"#52525b", fontSize:14, maxWidth:440, margin:"0 auto", lineHeight:1.7 }}>{desc}</p>}
    </>
  );
}

function Row({ children }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
      {children}
    </div>
  );
}

function FInput({ label, required, style: outerStyle = {}, ...props }) {
  return (
    <div style={outerStyle}>
      <label style={{ display:"block", fontSize:10, fontWeight:700, color:"#52525b",
        textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>
        {label}{required && <span style={{ color:"#f59e0b", marginLeft:2 }}>*</span>}
      </label>
      <input
        {...props}
        required={required}
        className="fd-input"
        style={{
          width:"100%", padding:"10px 14px", borderRadius:10,
          border:"1px solid #27272a", background:"#111113",
          color:"#f4f4f5", fontSize:13, outline:"none",
          fontFamily:"'DM Sans',sans-serif",
          transition:"border-color 0.2s, background 0.2s",
        }}
      />
    </div>
  );
}