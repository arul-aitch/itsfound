"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useLogin } from "@/hooks/use-auth";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
    email: z.string().email("Email tidak valid"),
    password: z.string().min(1, "Password wajib diisi"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const login = useLogin();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = (values: LoginFormValues) => {
        login.mutate(values, {
            onSuccess: () => {
                toast.success("Berhasil masuk");
                router.push("/");
            },
            onError: (error) => {
                if (
                    error instanceof ApiClientError &&
                    error.code === "INVALID_CREDENTIALS"
                ) {
                    toast.error("Email atau password salah");
                    return;
                }

                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Terjadi kesalahan saat masuk",
                );
            },
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
            <Card className="w-full max-w-md rounded-xl border shadow-sm">
                <CardHeader className="space-y-2 pb-2 text-center">
                    <Link href="/" className="text-xl font-bold tracking-tight">
                        ITSFOUND
                    </Link>
                    <p className="text-sm text-muted-foreground">
                        Masuk untuk mulai melapor
                    </p>
                </CardHeader>

                <CardContent>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-5"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="nama@example.com"
                                className="h-11 rounded-lg"
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="Masukkan password"
                                className="h-11 rounded-lg"
                                {...register("password")}
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="h-11 w-full rounded-lg font-semibold"
                            disabled={login.isPending}
                        >
                            {login.isPending ? "Memuat..." : "Masuk"}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Belum punya akun?{" "}
                        <Link
                            href="/register"
                            className="font-medium text-foreground underline underline-offset-4"
                        >
                            Daftar
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
