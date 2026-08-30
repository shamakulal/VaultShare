interface ToastProps {
  message: string;
  type?: "success" | "error";
}

const Toast = ({ message, type = "success" }: ToastProps) => {
  if (!message) return null;

  return (
    <div
      className={`fixed right-6 top-6 z-[9999] flex items-center gap-3 rounded-xl px-5 py-3 shadow-xl ${
        type === "success"
          ? "bg-green-600 text-white"
          : "bg-red-600 text-white"
      }`}
    >
      <span>{type === "success" ? "✓" : "!"}</span>
      <span className="font-medium">{message}</span>
    </div>
  );
};

export default Toast;