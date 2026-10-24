"use client";
// app/(backend)/admin/news/new/page.jsx  ->  /admin/news/new
// หน้าเพิ่มข่าวสารใหม่ + อัปโหลดไฟล์เอกสารแนบ (ลากวาง/เลือกไฟล์, ตรวจชนิด/ขนาด, แถบความคืบหน้า)

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@components/button";
import Icon from "@components/icon";
import { ADMIN_BASE } from "@components/sidebar";

// ---------- ตั้งค่า ----------
const API_URL = "/api/news"; // ต้องสร้าง route handler รับ multipart/form-data
const CATEGORIES = [
  "ข่าวทั่วไป",
  "วิชาการ",
  "กิจกรรมนักศึกษา",
  "ประกาศทุน",
  "ทะเบียนและวัดผล",
  "กิจกรรมสาขา",
  "ผลงานวิจัย",
];
const DOC_EXT = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".zip"];
const MAX_DOC_MB = 10;
const MAX_DOCS = 10;
const MAX_COVER_MB = 5;

const inputCls =
  "w-full rounded-lg border border-gray-200 bg-[#F5F6F8] px-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#0033A0] focus:bg-white focus:ring-2 focus:ring-[#0033A0]/20";

// ---------- ตัวช่วย ----------
const extOf = (name) => {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
};

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const EXT_STYLE = {
  ".pdf": "bg-red-100 text-red-600",
  ".doc": "bg-blue-100 text-blue-700",
  ".docx": "bg-blue-100 text-blue-700",
  ".xls": "bg-green-100 text-green-700",
  ".xlsx": "bg-green-100 text-green-700",
  ".ppt": "bg-orange-100 text-orange-600",
  ".pptx": "bg-orange-100 text-orange-600",
};

// ส่งฟอร์มด้วย XHR เพื่อให้ได้ความคืบหน้าการอัปโหลด
function sendForm(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve(xhr.responseText)
        : reject(new Error(`เซิร์ฟเวอร์ตอบกลับ ${xhr.status}`));
    xhr.onerror = () => reject(new Error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้"));
    xhr.send(formData);
  });
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-[#1a1a1a]">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm font-medium text-[#1a1a1a]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-[#0033A0]" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

// ---------- หน้า ----------
export default function NewNewsPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [publishAt, setPublishAt] = useState("");
  const [showOnHome, setShowOnHome] = useState(true);
  const [pinned, setPinned] = useState(false);

  const [cover, setCover] = useState(null); // { file, url }
  const [coverError, setCoverError] = useState("");

  const [docs, setDocs] = useState([]); // [{ id, file }]
  const [docErrors, setDocErrors] = useState([]);
  const [dragging, setDragging] = useState(false);
  const docInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formError, setFormError] = useState("");

  // ตั้งวันที่เริ่มต้นหลัง mount (กัน hydration mismatch)
  useEffect(() => {
    const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    setPublishAt(d.toISOString().slice(0, 16));
  }, []);

  // คืนหน่วยความจำของ preview ปก
  useEffect(() => () => cover && URL.revokeObjectURL(cover.url), [cover]);

  // ----- ปกข่าว -----
  const pickCover = (fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setCoverError("ต้องเป็นไฟล์รูปภาพเท่านั้น");
    if (file.size > MAX_COVER_MB * 1024 * 1024)
      return setCoverError(`รูปปกต้องไม่เกิน ${MAX_COVER_MB} MB`);
    setCoverError("");
    setCover({ file, url: URL.createObjectURL(file) });
  };

  // ----- เอกสารแนบ -----
  const addDocs = (fileList) => {
    const errors = [];
    const next = [...docs];

    for (const file of Array.from(fileList)) {
      const ext = extOf(file.name);
      if (!DOC_EXT.includes(ext)) {
        errors.push(`"${file.name}" ไม่รองรับชนิดไฟล์ ${ext || "(ไม่มีนามสกุล)"}`);
      } else if (file.size > MAX_DOC_MB * 1024 * 1024) {
        errors.push(`"${file.name}" ใหญ่เกิน ${MAX_DOC_MB} MB (${formatSize(file.size)})`);
      } else if (next.some((d) => d.file.name === file.name && d.file.size === file.size)) {
        errors.push(`"${file.name}" ถูกเพิ่มไว้แล้ว`);
      } else if (next.length >= MAX_DOCS) {
        errors.push(`แนบได้สูงสุด ${MAX_DOCS} ไฟล์ (ข้าม "${file.name}")`);
      } else {
        next.push({ id: `${file.name}-${file.size}-${Date.now()}-${next.length}`, file });
      }
    }

    setDocs(next);
    setDocErrors(errors);
    if (docInputRef.current) docInputRef.current.value = ""; // เลือกไฟล์เดิมซ้ำได้
  };

  const removeDoc = (id) => setDocs((d) => d.filter((x) => x.id !== id));

  // ----- แท็ก -----
  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const onTagKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return; // กัน Enter ตอนพิมพ์ภาษาไทย/IME
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !tagInput && tags.length) {
      setTags(tags.slice(0, -1));
    }
  };

  // ----- ส่งฟอร์ม -----
  const submit = async (status) => {
    setFormError("");
    if (!title.trim()) return setFormError("กรุณากรอกหัวข้อข่าว");
    if (status === "published" && !content.trim())
      return setFormError("กรุณากรอกเนื้อหาข่าวก่อนเผยแพร่");

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("summary", summary.trim());
    fd.append("content", content);
    fd.append("category", category);
    fd.append("tags", JSON.stringify(tags));
    fd.append("publishAt", publishAt);
    fd.append("status", status); // "draft" | "published"
    fd.append("showOnHome", String(showOnHome));
    fd.append("pinned", String(pinned));
    if (cover) fd.append("cover", cover.file);
    docs.forEach((d) => fd.append("documents", d.file));

    setSaving(true);
    setProgress(0);
    try {
      await sendForm(API_URL, fd, setProgress);
      router.push(`${ADMIN_BASE}/news`);
    } catch (err) {
      setFormError(`บันทึกไม่สำเร็จ: ${err.message}`);
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl pb-24">
      {/* หัวหน้า */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <nav className="mb-2 flex items-center gap-1.5 text-xs text-gray-500">
            <Link href={`${ADMIN_BASE}/news`} className="hover:text-[#0033A0]">
              จัดการข่าวสาร
            </Link>
            <Icon name="chevronRight" size={12} />
            <span className="font-medium text-[#1a1a1a]">เพิ่มข่าวสารใหม่</span>
          </nav>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">เพิ่มข่าวสารใหม่</h1>
          <p className="mt-1 text-sm text-gray-500">
            กรอกเนื้อหา แนบรูปปก และอัปโหลดเอกสารประกอบข่าว
          </p>
        </div>
        <Button variant="outline" size="sm" href={`${ADMIN_BASE}/news`}>
          ย้อนกลับ
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ===== คอลัมน์ซ้าย ===== */}
        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <Field label="หัวข้อข่าว" required>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="กรอกหัวข้อข่าวที่นี่..."
                className={`${inputCls} h-11`}
              />
            </Field>

            <Field label="สรุปสั้น" hint={`${summary.length}/200 ตัวอักษร`}>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value.slice(0, 200))}
                rows={3}
                placeholder="กรอกคำโปรยหรือสรุปข่าว..."
                className={`${inputCls} resize-none py-2.5`}
              />
            </Field>

            <Field label="เนื้อหา">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                placeholder="พิมพ์เนื้อหาข่าวของคุณ..."
                className={`${inputCls} resize-y py-2.5`}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="หมวดหมู่">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`${inputCls} h-10`}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>

              <Field label="แท็ก" hint="พิมพ์แล้วกด Enter">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={onTagKeyDown}
                  onBlur={addTag}
                  placeholder="พิมพ์แล้วกด Enter"
                  className={`${inputCls} h-10`}
                />
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => setTags(tags.filter((x) => x !== t))}
                          aria-label={`ลบแท็ก ${t}`}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Icon name="x" size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>
            </div>
          </section>

          {/* ===== อัปโหลดเอกสาร ===== */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0033A0]/10 text-[#0033A0]">
                <Icon name="file" size={18} />
              </span>
              <div>
                <h2 className="text-base font-bold text-[#1a1a1a]">เอกสารแนบ</h2>
                <p className="text-xs text-gray-500">
                  {DOC_EXT.join(" ")} · ไม่เกิน {MAX_DOC_MB} MB ต่อไฟล์ · สูงสุด {MAX_DOCS} ไฟล์
                </p>
              </div>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addDocs(e.dataTransfer.files);
              }}
              onClick={() => docInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  docInputRef.current?.click();
                }
              }}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
                dragging
                  ? "border-[#0033A0] bg-[#0033A0]/5"
                  : "border-gray-300 bg-gray-50 hover:border-[#0033A0]/50"
              }`}
            >
              <Icon name="upload" size={30} className="text-[#0033A0]" />
              <p className="text-sm font-medium text-[#1a1a1a]">
                ลากไฟล์มาวางที่นี่ หรือ <span className="text-[#0033A0] underline">เลือกไฟล์</span>
              </p>
              <p className="text-xs text-gray-500">เลือกได้หลายไฟล์พร้อมกัน</p>
              <input
                ref={docInputRef}
                type="file"
                multiple
                accept={DOC_EXT.join(",")}
                onChange={(e) => addDocs(e.target.files)}
                className="hidden"
              />
            </div>

            {docErrors.length > 0 && (
              <ul className="mt-3 space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {docErrors.map((m, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Icon name="alert" size={14} className="mt-px" />
                    {m}
                  </li>
                ))}
              </ul>
            )}

            {docs.length > 0 && (
              <ul className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-200">
                {docs.map(({ id, file }) => {
                  const ext = extOf(file.name);
                  return (
                    <li key={id} className="flex items-center gap-3 px-3 py-2.5">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold uppercase ${
                          EXT_STYLE[ext] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ext.replace(".", "")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#1a1a1a]">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="trash"
                        aria-label={`ลบ ${file.name}`}
                        disabled={saving}
                        onClick={() => removeDoc(id)}
                        className="text-gray-500 hover:text-red-600"
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* ===== คอลัมน์ขวา ===== */}
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <Field label="รูปปก" hint={`JPG, PNG, WebP ไม่เกิน ${MAX_COVER_MB} MB`}>
              <div
                onClick={() => coverInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    coverInputRef.current?.click();
                  }
                }}
                className="cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-[#0033A0]/50"
              >
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover.url} alt="ตัวอย่างรูปปก" className="aspect-video w-full object-cover" />
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center gap-1.5 text-gray-500">
                    <Icon name="image" size={28} />
                    <span className="text-xs">คลิกเพื่ออัปโหลดภาพปก</span>
                  </div>
                )}
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => pickCover(e.target.files)}
                className="hidden"
              />
              {coverError && <p className="mt-1.5 text-xs text-red-600">{coverError}</p>}
              {cover && (
                <button
                  type="button"
                  onClick={() => setCover(null)}
                  className="mt-2 text-xs font-medium text-red-600 hover:underline"
                >
                  ลบรูปปก
                </button>
              )}
            </Field>
          </section>

          <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <Field label="วันที่/เวลาเผยแพร่">
              <input
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
                className={`${inputCls} h-10`}
              />
            </Field>
            <div className="border-t border-gray-100 pt-3">
              <Toggle label="แสดงบนหน้าแรก" checked={showOnHome} onChange={setShowOnHome} />
              <Toggle label="ปักหมุดข่าว" checked={pinned} onChange={setPinned} />
            </div>
          </section>
        </div>
      </div>

      {/* ===== แถบปุ่มด้านล่าง ===== */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur lg:left-64">
        {saving && (
          <div className="h-1 w-full bg-gray-100">
            <div
              className="h-full bg-[#FFC72C] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <p
            className={`text-sm ${formError ? "font-medium text-red-600" : "text-gray-500"}`}
            role={formError ? "alert" : undefined}
          >
            {formError ||
              (saving
                ? `กำลังอัปโหลด ${progress}%`
                : `เอกสารแนบ ${docs.length} ไฟล์`)}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" href={`${ADMIN_BASE}/news`} disabled={saving}>
              ยกเลิก
            </Button>
            <Button variant="outline" disabled={saving} onClick={() => submit("draft")}>
              บันทึกเป็นร่าง
            </Button>
            <Button icon="upload" disabled={saving} onClick={() => submit("published")}>
              เผยแพร่
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}