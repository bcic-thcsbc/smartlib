export const initials = (name = "") => name.slice(0, 1).toUpperCase();

const messages: Record<string, string> = {
  "Please log in.": "Vui lòng đăng nhập.",
  "Administrator access required.": "Bạn cần quyền quản trị.",
  "Invalid username or password.": "Tên đăng nhập hoặc mật khẩu không đúng.",
  "Server error.": "Có lỗi máy chủ. Vui lòng thử lại.",
  "Book not found.": "Không tìm thấy tựa sách.",
  "Copy not found.": "Không tìm thấy quyển sách.",
  "Loan not found.": "Không tìm thấy phiếu mượn.",
  "Current password is incorrect.": "Mật khẩu hiện tại không đúng.",
};

export const errorMessage = (error: any, fallback: string) => {
  const message = error?.response?.data?.message;
  if (message) return formatEmbeddedDates(messages[message] || message);
  if (error?.code === "ERR_NETWORK")
    return `${fallback} vì không kết nối được tới máy chủ.`;
  if (error?.code === "ECONNABORTED")
    return `${fallback} vì máy chủ phản hồi quá lâu.`;

  const status = error?.response?.status;
  if (status === 401)
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (status === 429)
    return "Thao tác đang bị giới hạn tạm thời. Vui lòng thử lại sau ít phút.";
  if (status >= 500) return `${fallback} vì máy chủ đang gặp sự cố.`;
  return `${fallback}. Vui lòng kiểm tra dữ liệu và thử lại.`;
};

export const today = () => new Date().toISOString().slice(0, 10);

function toDate(value?: string | Date) {
  if (!value) return undefined;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? undefined : value;

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? new Date(`${normalized}T00:00:00`)
    : new Date(normalized);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

const pad = (value: number) => String(value).padStart(2, "0");

export function formatDate(value?: string | Date) {
  const date = toDate(value);
  return date
    ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
    : "-";
}

export function formatDayMonth(value?: string | Date) {
  const date = toDate(value);
  return date ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}` : "-";
}

export function formatWeekday(value?: string | Date) {
  const date = toDate(value);
  if (!date) return "-";

  return [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ][date.getDay()];
}

export function formatTime(value?: string | Date) {
  const date = toDate(value);
  return date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : "-";
}

export function formatDateTime(value?: string | Date) {
  const date = toDate(value);
  return date ? `${formatDate(date)} ${formatTime(date)}` : "-";
}

export function formatEmbeddedDates(value?: string) {
  if (!value) return "";
  return value.replace(
    /\b\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?\b/g,
    (match) =>
      match.includes(":") ? formatDateTime(match) : formatDate(match),
  );
}
