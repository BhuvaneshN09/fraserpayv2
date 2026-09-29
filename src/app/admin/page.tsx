import { redirect } from "next/navigation";

export default async function SacAdminPage() {
  redirect("/admin/transfer");
}