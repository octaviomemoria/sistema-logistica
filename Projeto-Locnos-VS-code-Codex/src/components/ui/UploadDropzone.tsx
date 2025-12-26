import { useCallback, useState } from "react";
import { CloudUpload } from "lucide-react";

interface UploadDropzoneProps {
  label: string;
  onFileAccepted: (file: File) => void;
  accept?: string;
}

export const UploadDropzone = ({
  label,
  onFileAccepted,
  accept
}: UploadDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) onFileAccepted(file);
    },
    [onFileAccepted]
  );

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </p>
      <div
        onDrop={onDrop}
        onDragOver={(event) => event.preventDefault()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          isDragging
            ? "border-brand-500 bg-brand-50"
            : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        }`}
      >
        <CloudUpload className="text-brand-500" size={32} />
        <p className="mt-2 text-sm text-slate-500">
          Arraste e solte ou clique para fazer upload
        </p>
        <input
          type="file"
          accept={accept}
          className="mt-4 text-sm"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFileAccepted(file);
          }}
        />
      </div>
    </div>
  );
};
