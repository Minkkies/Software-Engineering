import Link from "next/link";
import { notFound } from "next/navigation";
import { getFacultyById, parseExpertise } from "../faculty-data";

export const revalidate = 60;

export async function generateMetadata({ params }) {
    const { id } = await params;
    const member = await getFacultyById(id);
    return { title: member ? `${member.full_name} | คณาจารย์และบุคลากร` : "ไม่พบข้อมูล" };
}

function Row({ label, value }) {
    if (!value) return null;
    return (
        <div className="grid gap-1 border-b border-gray-100 py-3 sm:grid-cols-[160px_1fr] sm:gap-4">
            <dt className="text-sm font-semibold text-gray-500">{label}</dt>
            <dd className="whitespace-pre-line text-sm text-[#1a1a1a]">{value}</dd>
        </div>
    );
}

export default async function FacultyDetailPage({ params }) {
    const { id } = await params;
    const member = await getFacultyById(id);
    if (!member) notFound();

    const tags = parseExpertise(member.expertise);

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#F5F6F8] px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-4xl">
                <Link
                    href="/FacultyDirectory"
                    className="mb-4 inline-block text-sm font-medium text-[#0033a0] hover:underline"
                >
                    ← กลับไปหน้าคณาจารย์และบุคลากร
                </Link>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:flex">
                    <div className="md:w-72 md:shrink-0">
                        {member.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={member.photo_url}
                                alt={member.full_name}
                                className="h-full w-full object-cover object-top"
                            />
                        ) : (
                            <div className="flex aspect-[4/5] items-center justify-center bg-slate-200 text-6xl font-semibold text-slate-500">
                                {member.full_name.charAt(0)}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 p-6">
                        <h1 className="text-2xl font-bold text-[#1a1a1a]">{member.full_name}</h1>
                        {member.position && (
                            <p className="mt-1 font-medium text-[#0033a0]">{member.position}</p>
                        )}

                        {tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {tags.map((t) => (
                                    <span
                                        key={t}
                                        className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700"
                                    >
                                        {t}
                                    </span>
                                ))}
                            </div>
                        )}

                        <dl className="mt-5">
                            <Row label="วุฒิการศึกษา" value={member.education} />
                            <Row label="งานวิจัย" value={member.research} />
                            <Row label="อีเมล" value={member.email} />
                            <Row label="โทรศัพท์" value={member.phone} />
                            <Row label="ห้องทำงาน" value={member.office_room} />
                            <Row label="เวลาให้คำปรึกษา" value={member.consult_hours} />
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
