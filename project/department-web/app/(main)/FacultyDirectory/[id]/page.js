import Link from "next/link";
import { notFound } from "next/navigation";
import { getFacultyById } from "../faculty-data";
import { parseExpertise, splitExpertise } from "../faculty-utils";

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

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:flex md:items-start md:gap-8 md:p-6">
                    {/* รูปขนาดคงที่ อยู่ด้านบนซ้าย ไม่ยืดตามความยาวของข้อความ */}
                    <div className="mx-auto mb-6 w-full max-w-[260px] md:sticky md:top-6 md:mb-0 md:w-64 md:max-w-none md:shrink-0">
                        <div className="aspect-[4/5] w-full overflow-hidden rounded-lg bg-gray-100">
                            {member.photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={member.photo_url}
                                    alt={member.full_name}
                                    className="h-full w-full object-cover object-top"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-6xl font-semibold text-slate-400">
                                    {member.full_name.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl font-bold text-[#1a1a1a]">{member.full_name}</h1>
                        {member.position && (
                            <p className="mt-1 font-medium text-[#0033a0]">{member.position}</p>
                        )}

                        {tags.length > 0 && (
                            <div className="mt-5">
                                <h2 className="mb-2 text-sm font-semibold text-gray-500">
                                    ความเชี่ยวชาญ / รายวิชาที่สอน
                                </h2>
                                <ul className="grid gap-2 sm:grid-cols-2">
                                    {tags.map((t) => {
                                        const { code, name } = splitExpertise(t);
                                        return (
                                            <li
                                                key={t}
                                                className="flex flex-col items-start gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5"
                                            >
                                                {code && (
                                                    <span className="rounded-md bg-[#0033a0] px-2 py-0.5 text-xs font-semibold text-white">
                                                        {code}
                                                    </span>
                                                )}
                                                <span className="text-sm leading-snug text-gray-800">
                                                    {name}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
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
