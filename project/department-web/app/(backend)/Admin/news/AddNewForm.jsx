"use client";
// app/(backend)/Admin/news/AddNewForm.jsx
// ฟอร์มเพิ่ม/แก้ไขข่าว (Modal) + อัปโหลดเอกสารแนบ
// ใช้งาน: {open && <AddNewForm initial={record|null} onClose={...} onSaved={(data)=>...} />}

import { useEffect, useRef, useState } from "react";
import Button from "@components/button";
import Icon from "@components/IconComponent";

// ---------- ตั้งค่า ----------
// null = โหมดทดลอง (ไม่ส่งไปเซิร์ฟเวอร์ เก็บในหน่วยความจำของหน้านี้)
// เมื่อสร้าง route handler แล้วเปลี่ยนเป็น "/api/news"
const API_URL = "/api/news";

export const CATEGORIES = [
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
export const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const extOf = (name) => {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
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

const nowLocal = () => {
  const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};

function sendForm(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve(xhr.responseText);
      let msg = `เซิร์ฟเวอร์ตอบกลับ ${xhr.status}`;
      try {
        msg = JSON.parse(xhr.responseText).error ?? msg; // ข้อความ error จาก /api/news
      } catch {}
      reject(new Error(msg));
    };
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

function DocRow({ name, size, url, onRemove, disabled, badge }) {
  const ext = extOf(name);
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold uppercase ${
          EXT_STYLE[ext] ?? "bg-gray-100 text-gray-600"
        }`}
      >
        {ext.replace(".", "")}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#1a1a1a]">
          {name}
          {badge && (
            <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-normal text-gray-500">
              {badge}
            </span>
          )}
        </p>
        <p className="text-xs text-gray-500">{formatSize(size)}</p>
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-medium text-[#0033A0] hover:underline"
        >
          ดูไฟล์
        </a>
      )}
      <Button
        variant="ghost"
        size="sm"
        icon="trash"
        aria-label={`ลบ ${name}`}
        disabled={disabled}
        onClick={onRemove}
        className="text-gray-500 hover:text-red-600"
      />
    </li>
  );
}

// ---------- คอมโพเนนต์หลัก ----------
export default function AddNewForm({ initial = null, categories = CATEGORIES, onClose, onSaved }) {
  const editing = Boolean(initial);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [category, setCategory] = useState(initial?.category ?? categories[0]);
  const [tags, setTags] = useState(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [publishAt, setPublishAt] = useState(initial?.publishAt ?? nowLocal());
  const [expireAt, setExpireAt] = useState(initial?.expireAt ?? ""); // ว่าง = ไม่หมดอายุ
  const [showOnHome, setShowOnHome] = useState(initial?.showOnHome ?? true);
  const [pinned, setPinned] = useState(initial?.pinned ?? false);

  const [cover, setCover] = useState(null); // { file, url } (รูปใหม่)
  const [keepCover, setKeepCover] = useState(Boolean(initial?.coverUrl));
  const [coverError, setCoverError] = useState("");

  const [oldDocs, setOldDocs] = useState(initial?.documents ?? []); // ไฟล์เดิมที่เก็บไว้
  const [docs, setDocs] = useState([]); // ไฟล์ใหม่ [{ id, file }]
  const [docErrors, setDocErrors] = useState([]);
  const [dragging, setDragging] = useState(false);
  const docInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formError, setFormError] = useState("");

  // ล็อกการเลื่อนหน้าเบื้องหลัง + ปิดด้วย Esc
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, onClose]);

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

  const coverPreview = cover?.url ?? (keepCover ? initial?.coverUrl : "");

  // ----- เอกสารแนบ -----
  const addDocs = (fileList) => {
    const errors = [];
    const next = [...docs];
    const all = () => oldDocs.length + next.length;

    for (const file of Array.from(fileList)) {
      const ext = extOf(file.name);
      const dup =
        next.some((d) => d.file.name === file.name && d.file.size === file.size) ||
        oldDocs.some((d) => d.name === file.name && d.size === file.size);

      if (!DOC_EXT.includes(ext)) {
        errors.push(`"${file.name}" ไม่รองรับชนิดไฟล์ ${ext || "(ไม่มีนามสกุล)"}`);
      } else if (file.size > MAX_DOC_MB * 1024 * 1024) {
        errors.push(`"${file.name}" ใหญ่เกิน ${MAX_DOC_MB} MB (${formatSize(file.size)})`);
      } else if (dup) {
        errors.push(`"${file.name}" ถูกเพิ่มไว้แล้ว`);
      } else if (all() >= MAX_DOCS) {
        errors.push(`แนบได้สูงสุด ${MAX_DOCS} ไฟล์ (ข้าม "${file.name}")`);
      } else {
        next.push({ id: `${file.name}-${file.size}-${Date.now()}-${next.length}`, file });
      }
    }

    setDocs(next);
    setDocErrors(errors);
    if (docInputRef.current) docInputRef.current.value = "";
  };

  // ----- แท็ก -----
  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const onTagKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return; // กัน Enter ระหว่างพิมพ์ภาษาไทย
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

    if (expireAt && publishAt && expireAt <= publishAt)
      return setFormError("วันหมดอายุต้องอยู่หลังวันเผยแพร่");

    const record = {
      title: title.trim(),
      summary: summary.trim(),
      content,
      category,
      tags,
      publishAt,
      expireAt,
      status,
      showOnHome,
      pinned,
      coverUrl: cover ? URL.createObjectURL(cover.file) : keepCover ? initial?.coverUrl ?? "" : "",
      documents: [
        ...oldDocs,
        ...docs.map((d) => ({ name: d.file.name, size: d.file.size })),
      ],
    };

    setSaving(true);
    setProgress(0);
    try {
      let result = record;
      if (API_URL) {
        const fd = new FormData();
        Object.entries({
          title: record.title,
          summary: record.summary,
          content: record.content,
          category,
          tags: JSON.stringify(tags),
          publishAt,
          expireAt,
          status,
          showOnHome: String(showOnHome),
          pinned: String(pinned),
          keepCover: String(keepCover),
          keepDocuments: JSON.stringify(oldDocs.map((d) => d.name)),
        }).forEach(([k, v]) => fd.append(k, v));
        if (editing) fd.append("id", initial.id);
        if (cover) fd.append("cover", cover.file);
        docs.forEach((d) => fd.append("documents", d.file));

        const text = await sendForm(API_URL, fd, setProgress);
        try {
          result = { ...record, ...JSON.parse(text) }; // ใช้ id/URL ที่เซิร์ฟเวอร์ส่งกลับ
        } catch {
          /* เซิร์ฟเวอร์ไม่ได้ส่ง JSON กลับ ใช้ข้อมูลในฟอร์ม */
        }
      }
      onSaved(result);
    } catch (err) {
      setFormError(`บันทึกไม่สำเร็จ: ${err.message}`);
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 top-16 z-30 flex items-center justify-center bg-black/50 p-4 lg:left-64"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editing ? "แก้ไขข่าวสาร" : "เพิ่มข่าวสารใหม่"}
        className="flex max-h-full w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl"
      >
        {/* หัว modal */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3">
          <div>
            <h2 className="text-lg font-bold text-[#1a1a1a]">
              {editing ? "แก้ไขข่าวสาร" : "เพิ่มข่าวสารใหม่"}
            </h2>
            {editing && <p className="text-xs text-gray-500">รหัส {initial.id}</p>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon="x"
            iconSize={20}
            aria-label="ปิด"
            disabled={saving}
            onClick={onClose}
          />
        </div>

        {/* เนื้อหา */}
        <div className="grid flex-1 gap-5 overflow-y-auto p-5">
          {/* ซ้าย */}
          <div className="space-y-4">
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
                rows={2}
                placeholder="กรอกคำโปรยหรือสรุปข่าว..."
                className={`${inputCls} resize-none py-2.5`}
              />
            </Field>

            <Field label="เนื้อหา">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
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
                  {categories.map((c) => (
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

            {/* อัปโหลดเอกสาร */}
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0033A0]/10 text-[#0033A0]">
                  <Icon name="file" size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#1a1a1a]">เอกสารแนบ</h3>
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
                className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                  dragging
                    ? "border-[#0033A0] bg-[#0033A0]/5"
                    : "border-gray-300 bg-gray-50 hover:border-[#0033A0]/50"
                }`}
              >
                <Icon name="upload" size={28} className="text-[#0033A0]" />
                <p className="text-sm font-medium text-[#1a1a1a]">
                  ลากไฟล์มาวางที่นี่ หรือ{" "}
                  <span className="text-[#0033A0] underline">เลือกไฟล์</span>
                </p>
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

              {oldDocs.length + docs.length > 0 && (
                <ul className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {oldDocs.map((d) => (
                    <DocRow
                      key={`old-${d.name}`}
                      name={d.name}
                      size={d.size}
                      url={d.url}
                      badge="ไฟล์เดิม"
                      disabled={saving}
                      onRemove={() => setOldDocs(oldDocs.filter((x) => x.name !== d.name))}
                    />
                  ))}
                  {docs.map(({ id, file }) => (
                    <DocRow
                      key={id}
                      name={file.name}
                      size={file.size}
                      disabled={saving}
                      onRemove={() => setDocs(docs.filter((x) => x.id !== id))}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ขวา */}
          <div className="space-y-4">
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
                {coverPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverPreview} alt="ตัวอย่างรูปปก" className="h-32 w-full object-cover" />
                ) : (
                  <div className="flex h-32 flex-col items-center justify-center gap-1.5 text-gray-500">
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
              {coverPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setCover(null);
                    setKeepCover(false);
                  }}
                  className="mt-2 text-xs font-medium text-red-600 hover:underline"
                >
                  ลบรูปปก
                </button>
              )}
            </Field>

            <Field label="วันที่/เวลาเผยแพร่">
              <input
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
                className={`${inputCls} h-10`}
              />
            </Field>

            <Field label="วันที่/เวลาหมดอายุ" hint="เมื่อถึงเวลานี้ ข่าวจะถูกซ่อนจากหน้าเว็บอัตโนมัติ (เว้นว่าง = ไม่หมดอายุ)">
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={expireAt}
                  min={publishAt || undefined}
                  onChange={(e) => setExpireAt(e.target.value)}
                  className={`${inputCls} h-10`}
                />
                {expireAt && (
                  <button
                    type="button"
                    onClick={() => setExpireAt("")}
                    className="shrink-0 text-xs font-medium text-red-600 hover:underline"
                  >
                    ล้าง
                  </button>
                )}
              </div>
            </Field>

            <div className="border-t border-gray-100 pt-3">
              <Toggle label="แสดงบนหน้าแรก" checked={showOnHome} onChange={setShowOnHome} />
              <Toggle label="ปักหมุดข่าว" checked={pinned} onChange={setPinned} />
            </div>
          </div>
        </div>

        {/* ท้าย modal */}
        <div className="shrink-0 border-t border-gray-200">
          {saving && API_URL && (
            <div className="h-1 w-full bg-gray-100">
              <div className="h-full bg-[#FFC72C] transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <p
              className={`text-sm ${formError ? "font-medium text-red-600" : "text-gray-500"}`}
              role={formError ? "alert" : undefined}
            >
              {formError ||
                (saving && API_URL
                  ? `กำลังอัปโหลด ${progress}%`
                  : `เอกสารแนบ ${oldDocs.length + docs.length} ไฟล์`)}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" disabled={saving} onClick={onClose}>
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
    </div>
  );
}