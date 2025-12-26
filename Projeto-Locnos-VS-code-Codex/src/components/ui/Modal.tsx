import { Dialog, Transition } from "@headlessui/react";
import { Fragment, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  description?: string;
  maxWidth?: "md" | "lg" | "xl";
}

const sizeMap = {
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl"
};

export const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = "lg"
}: ModalProps) => {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`w-full transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all dark:bg-slate-900 ${sizeMap[maxWidth]}`}
              >
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <p className="mt-1 text-sm text-slate-500">
                        {description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="max-h-[80vh] overflow-y-auto px-6 py-6">
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
