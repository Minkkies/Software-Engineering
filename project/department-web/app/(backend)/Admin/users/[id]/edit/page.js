import UserFormClient from "../../UserFormClient";

export default async function EditUserPage({ params }) {
    const { id } = await params;
    return <UserFormClient userId={id} />;
}