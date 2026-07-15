<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-svelte";
    import { api } from "$lib/shared/lib/api-client";
    import { toast } from "svelte-sonner";
    import { API_URL } from "$lib/shared/lib/api-client";

    import { cn } from "$lib/shared/lib/utils";

    let {
        value = $bindable(""),
        disabled = false,
        folder = "misc",
        compact = false,
        class: className = "",
    }: {
        value: string;
        disabled?: boolean;
        folder?: string;
        compact?: boolean;
        class?: string;
    } = $props();

    let isUploading = $state(false);
    let fileInput: HTMLInputElement;

    async function handleFileChange(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        isUploading = true;

        try {
            const formData = new FormData();
            formData.append("file", file);
            if (folder) {
                formData.append("folder", folder);
            }

            const res = await api.post("/uploads", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data.success && res.data.data.url) {
                value = res.data.data.url;
                toast.success("Gambar berhasil diupload");
            } else {
                toast.error("Gagal mengupload gambar");
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal mengupload gambar");
        } finally {
            isUploading = false;
            // Reset input so same file can be selected again if needed
            input.value = "";
        }
    }

    function removeImage() {
        value = "";
    }

    // Determine size classes based on compact mode
    const sizeClasses = $derived(
        compact ? "h-full w-full max-h-32" : "h-32 w-32",
    );
</script>

<div class="w-full h-full flex items-center justify-center">
    {#if value}
        <div
            class={cn(
                sizeClasses,
                "relative group rounded-xl overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-muted/30 to-muted/10 shadow-sm",
                className,
            )}
        >
            <img
                src={value.startsWith("http") ? value : `${API_URL}${value}`}
                alt="Upload preview"
                class="w-full h-full object-cover"
            />
            <div
                class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center backdrop-blur-[2px]"
            >
                <Button
                    variant="destructive"
                    size="icon"
                    class="rounded-full shadow-lg scale-90 hover:scale-100 transition-transform"
                    onclick={removeImage}
                    disabled={disabled || isUploading}
                >
                    <X class="h-4 w-4" />
                </Button>
            </div>
        </div>
    {:else}
        <button
            type="button"
            class={cn(
                sizeClasses,
                "rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer",
                className,
            )}
            onclick={() => fileInput?.click()}
            disabled={disabled || isUploading}
        >
            {#if isUploading}
                <Loader2 class="h-6 w-6 animate-spin text-primary" />
                <span class="text-xs font-medium">Uploading...</span>
            {:else}
                <div class="p-2 rounded-full bg-primary/10">
                    <Upload class="h-5 w-5 text-primary" />
                </div>
                <span class="text-xs font-medium">Upload Gambar</span>
            {/if}
        </button>
    {/if}

    <input
        bind:this={fileInput}
        type="file"
        accept="image/*"
        class="hidden"
        onchange={handleFileChange}
        disabled={disabled || isUploading}
    />
</div>
