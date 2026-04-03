const LABELS = {
  en: {
    aboutMe: "ABOUT ME",
    workExperience: "WORK EXPERIENCE",
    educationTraining: "EDUCATION AND TRAINING",
    skills: "SKILLS",
    languages: "LANGUAGES",
    nationality: "Nationality",
    dateOfBirth: "Date of birth",
    gender: "Gender",
    phoneNumber: "Phone number",
    workPermit: "Work permit",
    emailAddress: "Email address",
    address: "Address",
    present: "Present"
  },
  bn: {
    aboutMe: "আমার সম্পর্কে",
    workExperience: "কর্ম-অভিজ্ঞতা",
    educationTraining: "শিক্ষা ও প্রশিক্ষণ",
    skills: "দক্ষতা",
    languages: "ভাষা",
    nationality: "জাতীয়তা",
    dateOfBirth: "জন্ম তারিখ",
    gender: "লিঙ্গ",
    phoneNumber: "ফোন নম্বর",
    workPermit: "কর্ম অনুমতি",
    emailAddress: "ইমেইল ঠিকানা",
    address: "ঠিকানা",
    present: "বর্তমান"
  },
  pt: {
    aboutMe: "SOBRE MIM",
    workExperience: "EXPERIENCIA PROFISSIONAL",
    educationTraining: "EDUCACAO E FORMACAO",
    skills: "COMPETENCIAS",
    languages: "IDIOMAS",
    nationality: "Nacionalidade",
    dateOfBirth: "Data de nascimento",
    gender: "Genero",
    phoneNumber: "Numero de telefone",
    workPermit: "Autorizacao de trabalho",
    emailAddress: "Endereco de email",
    address: "Morada",
    present: "Atual"
  }
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeMultiline(value) {
  return escapeHtml(value).replaceAll("\n", "<br/>");
}

function formatPhotoSrc(value) {
  if (!value) return "";
  if (value.startsWith("http") || value.startsWith("data:")) return value;
  if (value.startsWith("/uploads/")) return `http://localhost:4000${value}`;
  return value;
}

function text(value, fallback = "-") {
  const normalized = String(value ?? "").trim();
  return normalized ? escapeHtml(normalized) : fallback;
}

/** Format YYYY-MM-DD (or ISO date string) as "January 23, 2004" for display */
function formatDate(value) {
  const s = String(value ?? "").trim();
  if (!s) return s;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  const date = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return s;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatYear(value) {
  const s = String(value ?? "").trim();
  const m = s.match(/^(\d{4})/);
  return m ? m[1] : "";
}

function descriptionBullets(value) {
  const s = String(value ?? "").trim();
  if (!s) return [];
  return s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

function renderMetaLine(label, value) {
  if (!String(value ?? "").trim()) return "";
  return `<span><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</span>`;
}

function renderExperience(items = [], presentLabel) {
  return (items || [])
    .map((item) => {
      const endDisplay = String(item.endDate || "").trim() ? formatDate(item.endDate) : presentLabel;
      const bullets = descriptionBullets(item.description);
      const descriptionHtml = bullets.length
        ? `<ul class="desc-list">${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`
        : `<p class="description">${escapeMultiline(item.description || "-")}</p>`;
      const companyLocation = item.location && String(item.location).trim()
        ? `<strong>${text(item.company)}</strong> · ${escapeHtml(item.location)}`
        : `<strong>${text(item.company)}</strong>`;
      return `
        <div class="entry">
          <div class="entry-title-row">
            <h4>${text(item.jobTitle)}</h4>
            <span class="entry-dates">${escapeHtml(formatDate(item.startDate) || "-")} – ${escapeHtml(endDisplay)}</span>
          </div>
          <p class="entry-company">${companyLocation}</p>
          ${descriptionHtml}
        </div>
      `;
    })
    .join("");
}

function renderEducation(items = [], presentLabel) {
  return (items || [])
    .map((item) => {
      const endDisplay = String(item.endDate || "").trim() ? formatDate(item.endDate) : presentLabel;
      const schoolLocation = item.location && String(item.location).trim()
        ? `<strong>${text(item.school)}</strong> · ${escapeHtml(item.location)}`
        : `<strong>${text(item.school)}</strong>`;
      return `
        <div class="entry">
          <div class="entry-title-row">
            <h4>${text(item.degree)}</h4>
            <span class="entry-dates">${escapeHtml(formatDate(item.startDate) || "-")} – ${escapeHtml(endDisplay)}</span>
          </div>
          <p class="entry-company">${schoolLocation}</p>
        </div>
      `;
    })
    .join("");
}

function renderBulletList(items = []) {
  const arr = Array.isArray(items) ? items : [];
  const list = arr.map((item) => escapeHtml(typeof item === "string" ? item : item?.name || "")).filter(Boolean);
  if (list.length === 0) return "";
  return `<ul class="bullet-list">${list.map((t) => `<li>${t}</li>`).join("")}</ul>`;
}

/** Languages: string → as-is; object { name, level? } → "Name (Level)" when level set, else "Name" */
function renderLanguageList(items = []) {
  const arr = Array.isArray(items) ? items : [];
  const list = arr
    .map((item) => {
      if (typeof item === "string") {
        const s = String(item).trim();
        return s ? escapeHtml(s) : null;
      }
      const name = String(item?.name ?? "").trim();
      if (!name) return null;
      const level = String(item?.level ?? "").trim();
      const text = level ? `${name} (${level})` : name;
      return escapeHtml(text);
    })
    .filter(Boolean);
  if (list.length === 0) return "";
  return `<ul class="bullet-list">${list.map((t) => `<li>${t}</li>`).join("")}</ul>`;
}

function renderInlineList(items = [], separator = ", ") {
  const arr = Array.isArray(items) ? items : [];
  const list = arr.map((item) => escapeHtml(typeof item === "string" ? item : item?.name || "")).filter(Boolean);
  if (list.length === 0) return "";
  return `<p class="inline-list">${list.join(separator)}</p>`;
}

export function getCvHtml(cv) {
  const data = cv.cvData || {};
  const personal = data.personalInfo || {};
  const labels = LABELS[cv.outputLanguage] || LABELS.en;
  const sectionSettings = data.sectionSettings || {};
  const getSectionConfig = (key, fallbackTitle) => {
    const raw = sectionSettings?.[key];
    const enabled = raw?.enabled !== false;
    const title = String(raw?.title ?? "").trim() || fallbackTitle;
    return { enabled, title };
  };
  const workSection = getSectionConfig("workExperience", labels.workExperience);
  const educationSection = getSectionConfig("education", labels.educationTraining);
  const skillsSection = getSectionConfig("skills", labels.skills);
  const languagesSection = getSectionConfig("languages", labels.languages);
  const photoSrc = formatPhotoSrc(personal.photo || "");

  const identityDocsFiltered = (data.identityDocuments || []).filter((d) => (d.type || "").trim() || (d.number || "").trim());
  const hasMeta = [personal.nationality, personal.dateOfBirth, personal.gender, personal.workPermitCountry].some((v) => String(v ?? "").trim()) || identityDocsFiltered.length > 0;
  const royalBlue = "#4169E1";
  const iconEmail = `<svg class="cv-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${royalBlue}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;
  const iconPhone = `<svg class="cv-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${royalBlue}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>`;
  const iconAddress = `<svg class="cv-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${royalBlue}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
  const emailPhoneParts = [];
  if (String(personal.email || "").trim()) emailPhoneParts.push(`<span class="cv-contact-item"><span class="cv-icon-wrap">${iconEmail}</span><a href="mailto:${escapeHtml(personal.email)}" class="cv-link">${escapeHtml(personal.email)}</a></span>`);
  if (String(personal.phone || "").trim()) emailPhoneParts.push(`<span class="cv-contact-item"><span class="cv-icon-wrap">${iconPhone}</span><a href="tel:${escapeHtml(personal.phone)}" class="cv-link">${escapeHtml(personal.phone)}</a></span>`);
  const line1 = emailPhoneParts.length ? `<div class="cv-contact-row">${emailPhoneParts.join('<span class="cv-contact-sep"> · </span>')}</div>` : "";
  const line2 = String(personal.address || "").trim() ? `<div class="cv-contact-row"><span class="cv-contact-item"><span class="cv-icon-wrap">${iconAddress}</span><span class="cv-address-text">${escapeHtml(personal.address)}</span></span></div>` : "";
  const contactHtml = line1 || line2 ? `<div class="cv-contact">${line1}${line2}</div>` : "";

  return `<!doctype html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(cv.title || "CV")}</title>
    <style>
      body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; color: #111827; }
      .page { margin: 0 0 28px 0; padding: 0 0 24px 0; }
      .cv-top-bar { position: relative; z-index: 0; height: 112px; background: #93c5fd; width: 100%; }
      .cv-content-wrap { position: relative; z-index: 1; background: #fff; margin: -30px 40px 0 40px; padding: 20px; padding-top: 30px; }
      .cv-header { display: flex; align-items: flex-start; gap: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; }
      .cv-photo { width: 112px; height: 112px; border-radius: 50%; object-fit: cover; border: 2px solid #15803d; flex-shrink: 0; }
      .cv-header-text { flex: 1; min-width: 0; }
      .cv-name { font-size: 24px; font-weight: 900; margin: 0; color: #0f172a; letter-spacing: 0.02em; text-transform: uppercase; }
      .cv-job { font-size: 14px; color: #4169E1; font-weight: 500; margin-top: 4px; }
      .cv-about { margin: 10px 0 0; font-size: 14px; line-height: 1.5; color: #334155; }
      .cv-contact { margin-top: 10px; font-size: 14px; display: flex; flex-direction: column; gap: 6px; }
      .cv-contact-row { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 0; }
      .cv-contact-sep { color: #94a3b8; margin: 0 4px; }
      .cv-contact-item { display: inline-flex; align-items: center; gap: 8px; }
      .cv-icon-wrap { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .cv-icon { vertical-align: middle; }
      .cv-address-text { color: #475569; }
      .cv-link { color: #4169E1; text-decoration: underline; }
      .meta-line { display: flex; flex-wrap: wrap; gap: 12px 18px; font-size: 14px; color: #64748b; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
      .meta-line strong { color: #475569; font-weight: 600; }
      .section { margin-top: 16px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
      .section:last-of-type { border-bottom: 0; }
      .section-title { margin: 0 0 10px; font-size: 16px; font-weight: 600; color: #4169E1; border-bottom: 1px solid #4169E1; padding-bottom: 4px; }
      .entry { margin-bottom: 14px; }
      .entry-title-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 8px; }
      .entry h4 { margin: 0; font-size: 15px; font-weight: 600; color: #0f172a; }
      .entry-dates { font-size: 13px; font-weight: 600; color: #334155; flex-shrink: 0; }
      .entry-company { margin: 4px 0 0; font-size: 13px; color: #334155; }
      .entry-company strong { font-weight: 600; }
      .entry-location { margin: 2px 0 0; font-size: 13px; color: #475569; }
      .desc-list { margin: 8px 0 0; padding-left: 18px; font-size: 13px; line-height: 1.45; color: #334155; }
      .description { margin: 8px 0 0; font-size: 13px; line-height: 1.5; color: #334155; }
      .bullet-list { margin: 0; padding-left: 18px; font-size: 14px; line-height: 1.5; color: #334155; }
      .inline-list { margin: 0; font-size: 14px; line-height: 1.5; color: #334155; }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="cv-top-bar"></div>
      <div class="cv-content-wrap">
        <div class="cv-header">
          ${photoSrc ? `<img class="cv-photo" src="${escapeHtml(photoSrc)}" alt="Profile" />` : ""}
          <div class="cv-header-text">
            <h1 class="cv-name">${escapeHtml((personal.name || "Your Name").toUpperCase())}</h1>
            <p class="cv-job">${text(personal.jobTitle, "")}</p>
            <p class="cv-about">${escapeMultiline(personal.aboutMe || "-")}</p>
            ${contactHtml}
          </div>
        </div>

        ${hasMeta ? `<div class="meta-line">
          ${renderMetaLine(labels.nationality, personal.nationality)}
          ${identityDocsFiltered.map((d) => renderMetaLine((d.type || "").trim() || "ID", (d.number || "").trim() || "—")).join(" ")}
          ${renderMetaLine(labels.dateOfBirth, formatDate(personal.dateOfBirth) || personal.dateOfBirth)}
          ${renderMetaLine(labels.gender, personal.gender)}
          ${renderMetaLine(labels.workPermit, personal.workPermitCountry)}
        </div>` : ""}

        ${skillsSection.enabled
          ? `<section class="section">
          <h3 class="section-title">${escapeHtml(skillsSection.title)}</h3>
          ${renderInlineList(Array.isArray(data.skills) ? data.skills : [])}
        </section>`
          : ""}

        ${workSection.enabled
          ? `<section class="section">
          <h3 class="section-title">${escapeHtml(workSection.title)}</h3>
          ${renderExperience(data.workExperience, labels.present)}
        </section>`
          : ""}

        ${educationSection.enabled
          ? `<section class="section">
          <h3 class="section-title">${escapeHtml(educationSection.title)}</h3>
          ${renderEducation(data.education, labels.present)}
        </section>`
          : ""}

        ${languagesSection.enabled
          ? `<section class="section">
          <h3 class="section-title">${escapeHtml(languagesSection.title)}</h3>
          ${renderLanguageList(Array.isArray(data.languages) ? data.languages : [])}
        </section>`
          : ""}
      </div>
    </div>
  </body>
  </html>`;
}
