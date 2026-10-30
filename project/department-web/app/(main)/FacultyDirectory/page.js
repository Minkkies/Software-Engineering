import FacultyClient from "./FacultyDirectoryClient";
import { getFacultyList } from "./faculty-data";

export const revalidate = 60;

export default async function FacultyDirectoryPage() {
    const members = await getFacultyList();
    return <FacultyClient members={members} />;
}
