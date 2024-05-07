import * as Dialog from "@radix-ui/react-dialog";
import { twMerge } from "tailwind-merge";

interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Modal = ({ open, onOpenChange, children }: ModalProps) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={true}>
      {children}
    </Dialog.Root>
  );
};

interface ModalPortalProps {
  container?: HTMLElement;
  children: React.ReactNode;
  className?: string;
  closeModal?: () => void;
}

const ModalPortal = ({ container, children, closeModal,className }: ModalPortalProps) => {
  return (
    <Dialog.Portal
      container={container}
      // className={`${inter.variable} ${inknut.variable} font-sans`}
    >
      <Dialog.Overlay
        className={twMerge(
          "data-[state=open]:animate-overlayShow fixed inset-0",
          className,
        )}
        onClick={closeModal}
      />
      {children}
    </Dialog.Portal>
  );
};

const ModalCover = ({ container, children }: ModalPortalProps) => {
  return <Dialog.Portal container={container}>{children}</Dialog.Portal>;
};

interface ModalTitleProps {
  children: React.ReactNode;
  className?: string;
}

const ModalTitle = ({ children, className }: ModalTitleProps) => {
  return (
    <div>
      <Dialog.Title className={className}>{children}</Dialog.Title>
    </div>
  );
};

Modal.Portal = ModalPortal;
Modal.Cover = ModalCover;
Modal.Button = Dialog.Trigger;
Modal.Content = Dialog.Content;
// Modal.Title = ModalTitle;
Modal.Title = Dialog.Title;
Modal.Close = Dialog.Close;
export default Modal;
