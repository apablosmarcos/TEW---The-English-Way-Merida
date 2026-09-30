export type EditorLoadState = "loading" | "error" | "ready";

export function canMutateEditor(state: EditorLoadState) {
  return state === "ready";
}

export class ExclusiveMutation {
  private pending = false;

  get active() {
    return this.pending;
  }

  async run(action: () => Promise<void>) {
    if (this.pending) return false;
    this.pending = true;
    try {
      await action();
      return true;
    } finally {
      this.pending = false;
    }
  }
}

export class LatestRequest {
  private generation = 0;

  start() {
    return ++this.generation;
  }

  isCurrent(generation: number) {
    return generation === this.generation;
  }
}

export interface PreviewWindow {
  opener: unknown;
  location: { href: string };
  close(): void;
}

export function reservePreviewWindow(open: () => PreviewWindow | null) {
  const previewWindow = open();
  if (previewWindow) previewWindow.opener = null;
  return previewWindow;
}

export function resetUploadedFile(input: { value: string }) {
  input.value = "";
}

export async function runAttachmentUpload<TFile, TResult>(
  draft: {
    attachmentFile: TFile | null;
    attachmentTitle: string;
    attachmentError: string;
    attachmentSuccess: string;
  },
  input: { value: string },
  upload: () => Promise<TResult>,
  errorMessage: (error: unknown) => string,
): Promise<{ ok: true; value: TResult } | { ok: false }> {
  draft.attachmentError = "";
  draft.attachmentSuccess = "";
  try {
    const value = await upload();
    draft.attachmentFile = null;
    draft.attachmentTitle = "";
    resetUploadedFile(input);
    draft.attachmentSuccess = "Material subido.";
    return { ok: true, value };
  } catch (error) {
    draft.attachmentError = errorMessage(error);
    return { ok: false };
  }
}
