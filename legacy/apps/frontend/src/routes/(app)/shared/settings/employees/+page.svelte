<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Card,
        CardContent,
        CardDescription,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Badge } from "$lib/shared/components/ui/badge";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/shared/components/ui/dialog";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import {
        AlertDialog,
        AlertDialogAction,
        AlertDialogCancel,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle,
    } from "$lib/shared/components/ui/alert-dialog";
    import { toast } from "svelte-sonner";
    import {
        Loader2,
        Plus,
        Users,
        Pencil,
        Trash2,
        KeyRound,
        Shield,
    } from "lucide-svelte";
    import { onMount } from "svelte";
    import { AuthService } from "$lib/features/auth/auth.service";
    import { api } from "$lib/shared/lib/api-client";
    import type { ApiResponse } from "@repo/shared";
    import { Switch } from "$lib/shared/components/ui/switch";
    import { Separator } from "$lib/shared/components/ui/separator";
    import { Checkbox } from "$lib/shared/components/ui/checkbox";

    import { authStore } from "$lib/shared/lib/auth-store.svelte";

    let users = $state<any[]>([]);
    let loading = $state(true);
    let saving = $state(false);

    const ALL_ROLES = [
        { id: "super_admin", name: "Super Admin (System Root)" },
        { id: "owner", name: "Owner (Analytics & Oversight)" },
        { id: "manager", name: "Manager (Operations)" },
        { id: "teknisi", name: "Teknisi (Workshop)" },
        { id: "kasir", name: "Kasir (Sales)" },
        { id: "warehouse", name: "Warehouse (Inventory)" },
    ];

    const ROLES = $derived(
        authStore.hasRole(["super_admin", "owner"])
            ? ALL_ROLES
            : ALL_ROLES.filter((r) => !["super_admin", "owner"].includes(r.id)),
    );

    // Dialog States
    let showUserDialog = $state(false);
    let editingUser = $state<any>(null);
    let userForm = $state({
        username: "",
        password: "",
        name: "",
        role: "teknisi", // Primary role for legacy
        roles: ["teknisi"] as string[], // Multi roles
        commissionConfig: {
            enabled: false,
            type: "percent" as "percent" | "fixed",
            value: 0,
        },
    });

    // Alert Dialog State
    let alertOpen = $state(false);
    let alertConfig = $state({
        title: "",
        description: "",
        action: async () => {},
        actionLabel: "Konfirmasi",
        variant: "default" as "default" | "destructive",
    });

    async function loadUsers() {
        loading = true;
        try {
            // Assuming direct API call or AuthService has getAll
            const res = await api.get<ApiResponse<any[]>>("/users");
            users = res.data.data || [];
        } catch (e) {
            toast.error("Gagal memuat data karyawan");
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadUsers();
    });

    function openAddUser() {
        editingUser = null;
        userForm = {
            username: "",
            password: "",
            name: "",
            role: "teknisi",
            roles: ["teknisi"],
            commissionConfig: { enabled: false, type: "percent", value: 0 },
        };
        showUserDialog = true;
    }

    function openEditUser(user: any) {
        editingUser = user;
        const currentRoles = user.roles?.map((ur: any) => ur.role.id) || [
            user.role,
        ];
        userForm = {
            username: user.username,
            password: "", // Blank means no change
            name: user.name,
            role: user.role,
            roles: currentRoles,
            commissionConfig: user.commissionConfig || {
                enabled: false,
                type: "percent",
                value: 0,
            },
        };
        showUserDialog = true;
    }

    async function saveUser() {
        if (!userForm.username || !userForm.name) {
            toast.error("Nama dan Username wajib diisi");
            return;
        }

        saving = true;
        try {
            // Prepared data
            const commonData = {
                name: userForm.name,
                role: userForm.roles[0] || "teknisi", // Primary role fallback
                roles: userForm.roles,
                commissionConfig: userForm.commissionConfig,
            };

            if (editingUser) {
                // Update
                await AuthService.updateUser(editingUser.id, commonData);
                if (userForm.password) {
                    // If password provided and backend supports updating it here
                    await AuthService.updateUser(editingUser.id, {
                        password: userForm.password,
                    });
                }
                toast.success("Data karyawan diperbarui");
            } else {
                // Create
                if (!userForm.password) {
                    toast.error("Password wajib diisi untuk user baru");
                    return;
                }
                const createData = {
                    ...commonData,
                    username: userForm.username,
                    password: userForm.password,
                };
                await AuthService.register(createData);
                toast.success("Karyawan baru ditambahkan");
            }
            showUserDialog = false;
            loadUsers();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Gagal menyimpan data");
        } finally {
            saving = false;
        }
    }

    function confirmDelete(user: any) {
        if (
            user.roles?.some((r: any) =>
                ["super_admin", "owner"].includes(r.role.id),
            ) &&
            !authStore.hasRole("super_admin")
        ) {
            toast.error("Hanya Super Admin yang dapat menghapus role ini");
            return;
        }

        alertConfig = {
            title: "Hapus Karyawan?",
            description: `Anda yakin ingin menghapus "${user.name}"? Akses login akan dicabut permanen.`,
            actionLabel: "Hapus",
            variant: "destructive",
            action: async () => {
                try {
                    await AuthService.deleteUser(user.id);
                    toast.success("Karyawan dihapus");
                    loadUsers();
                } catch (e) {
                    toast.error("Gagal menghapus karyawan");
                }
            },
        };
        alertOpen = true;
    }

    function confirmResetPassword(user: any) {
        alertConfig = {
            title: "Reset Password?",
            description: `Password untuk "${user.name}" akan direset menjadi '12345'. Lanjutkan?`,
            actionLabel: "Reset Password",
            variant: "default",
            action: async () => {
                try {
                    await AuthService.updateUser(user.id, {
                        password: "12345",
                    });
                    toast.success("Password berhasil direset ke '12345'");
                } catch (e) {
                    toast.error("Gagal reset password");
                }
            },
        };
        alertOpen = true;
    }
</script>

<div class="space-y-6 max-w-5xl mx-auto py-6">
    <div class="flex items-center justify-between">
        <div>
            <h3 class="text-2xl font-bold tracking-tight">
                Manajemen Karyawan
            </h3>
            <p class="text-muted-foreground">
                Kelola akses pengguna, teknisi, dan admin sistem.
            </p>
        </div>
        <Button onclick={openAddUser}>
            <Plus class="h-4 w-4 mr-2" /> Tambah Karyawan
        </Button>
    </div>

    <Card>
        <CardContent class="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead class="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {#if loading}
                        <TableRow>
                            <TableCell colspan={4} class="text-center py-8">
                                <Loader2 class="h-6 w-6 animate-spin mx-auto" />
                            </TableCell>
                        </TableRow>
                    {:else if users.length === 0}
                        <TableRow>
                            <TableCell
                                colspan={4}
                                class="text-center py-8 text-muted-foreground"
                            >
                                Belum ada data karyawan.
                            </TableCell>
                        </TableRow>
                    {:else}
                        {#each users as user (user.id)}
                            <TableRow>
                                <TableCell class="font-medium">
                                    <div class="flex items-center gap-2">
                                        <div
                                            class="bg-primary/10 p-2 rounded-full"
                                        >
                                            <Users
                                                class="h-4 w-4 text-primary"
                                            />
                                        </div>
                                        {user.name}
                                    </div>
                                </TableCell>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>
                                    <div class="flex flex-wrap gap-1">
                                        {#if user.roles && user.roles.length > 0}
                                            {#each user.roles as ur}
                                                <Badge
                                                    variant="outline"
                                                    class="uppercase text-[10px] font-bold"
                                                >
                                                    {ur.role.id}
                                                </Badge>
                                            {/each}
                                        {:else}
                                            <Badge
                                                variant="outline"
                                                class="uppercase text-[10px] font-bold"
                                            >
                                                {user.role}
                                            </Badge>
                                        {/if}
                                    </div>
                                </TableCell>
                                <TableCell class="text-right">
                                    <div class="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Reset Password"
                                            onclick={() =>
                                                confirmResetPassword(user)}
                                        >
                                            <KeyRound
                                                class="h-4 w-4 text-muted-foreground"
                                            />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Edit"
                                            onclick={() => openEditUser(user)}
                                        >
                                            <Pencil
                                                class="h-4 w-4 text-blue-500"
                                            />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Hapus"
                                            onclick={() => confirmDelete(user)}
                                        >
                                            <Trash2
                                                class="h-4 w-4 text-destructive"
                                            />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        {/each}
                    {/if}
                </TableBody>
            </Table>
        </CardContent>
    </Card>

    <!-- User Form Dialog -->
    <Dialog bind:open={showUserDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle
                    >{editingUser
                        ? "Edit Karyawan"
                        : "Tambah Karyawan Baru"}</DialogTitle
                >
                <DialogDescription>
                    Isi informasi akun untuk memberikan akses ke sistem.
                </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div class="space-y-2">
                    <Label>Nama Lengkap</Label>
                    <Input
                        bind:value={userForm.name}
                        placeholder="Nama Karyawan"
                    />
                </div>
                <div class="space-y-2">
                    <Label>Username</Label>
                    <Input
                        bind:value={userForm.username}
                        placeholder="Username Login"
                        disabled={!!editingUser}
                    />
                </div>
                {#if !editingUser}
                    <div class="space-y-2">
                        <Label>Password</Label>
                        <Input
                            type="password"
                            bind:value={userForm.password}
                            placeholder="Password Awal"
                        />
                    </div>
                {/if}
                <div class="space-y-3">
                    <Label>Role / Jabatan (Bisa pilih lebih dari satu)</Label>
                    <div class="grid grid-cols-1 gap-2 border rounded-md p-3">
                        {#each ROLES as role}
                            <div class="flex items-center space-x-2">
                                <Checkbox
                                    id="role-{role.id}"
                                    checked={userForm.roles.includes(role.id)}
                                    onCheckedChange={(
                                        checked: boolean | "indeterminate",
                                    ) => {
                                        if (checked === true) {
                                            if (
                                                !userForm.roles.includes(
                                                    role.id,
                                                )
                                            ) {
                                                userForm.roles = [
                                                    ...userForm.roles,
                                                    role.id,
                                                ];
                                            }
                                        } else {
                                            userForm.roles =
                                                userForm.roles.filter(
                                                    (r) => r !== role.id,
                                                );
                                        }
                                    }}
                                />
                                <Label
                                    for="role-{role.id}"
                                    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    {role.name}
                                </Label>
                            </div>
                        {/each}
                    </div>
                    {#if userForm.roles.length === 0}
                        <p class="text-[10px] text-destructive">
                            Wajib pilih minimal satu role.
                        </p>
                    {/if}
                </div>

                <Separator />

                <div class="space-y-4 rounded-lg border p-3 bg-muted/20">
                    <div class="flex items-center justify-between">
                        <div class="space-y-0.5">
                            <Label>Komisi Khusus</Label>
                            <p class="text-[10px] text-muted-foreground">
                                Override pengaturan global komisi untuk user
                                ini.
                            </p>
                        </div>
                        <Switch
                            bind:checked={userForm.commissionConfig.enabled}
                        />
                    </div>

                    {#if userForm.commissionConfig.enabled}
                        <div class="grid grid-cols-2 gap-4 pt-2">
                            <div class="space-y-2">
                                <Label class="text-xs">Tipe Komisi</Label>
                                <Select
                                    type="single"
                                    bind:value={userForm.commissionConfig.type}
                                >
                                    <SelectTrigger class="h-8 text-xs">
                                        {userForm.commissionConfig.type ===
                                        "percent"
                                            ? "Persentase (%)"
                                            : "Tetap (Rp)"}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percent"
                                            >Persentase (%)</SelectItem
                                        >
                                        <SelectItem value="fixed"
                                            >Tetap (Rp)</SelectItem
                                        >
                                    </SelectContent>
                                </Select>
                            </div>
                            <div class="space-y-2">
                                <Label class="text-xs"
                                    >Nilai ({userForm.commissionConfig.type ===
                                    "percent"
                                        ? "%"
                                        : "Rp"})</Label
                                >
                                <Input
                                    class="h-8"
                                    type="number"
                                    bind:value={userForm.commissionConfig.value}
                                    min="0"
                                />
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
            <DialogFooter>
                <Button
                    variant="outline"
                    onclick={() => (showUserDialog = false)}>Batal</Button
                >
                <Button onclick={saveUser} disabled={saving}>Simpan</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <!-- Alert Dialog -->
    <AlertDialog bind:open={alertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
                <AlertDialogDescription>
                    {alertConfig.description}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onclick={() => (alertOpen = false)}
                    >Batal</AlertDialogCancel
                >
                <AlertDialogAction
                    class={alertConfig.variant === "destructive"
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        : ""}
                    onclick={async () => {
                        await alertConfig.action();
                        alertOpen = false;
                    }}
                >
                    {alertConfig.actionLabel}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</div>
