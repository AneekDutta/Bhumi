import { redirect } from "next/navigation";

interface LoginPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const params = new URLSearchParams();
  params.set("login", "officer");

  if (resolved) {
    for (const [key, value] of Object.entries(resolved)) {
      if (key !== "login" && typeof value === "string") {
        params.set(key, value);
      }
    }
  }

  redirect(`/?${params.toString()}`);
}
