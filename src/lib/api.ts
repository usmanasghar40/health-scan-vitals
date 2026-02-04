type ApiError = { message: string };

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const handleResponse = async (response: Response) => {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error || response.statusText || "Request failed";
    throw new Error(message);
  }
  return data;
};

export const invokeFunction = async (name: string, body: any) => {
  try {
    const response = await fetch(`${API_BASE}/functions/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await handleResponse(response);
    return { data, error: null as ApiError | null };
  } catch (error: any) {
    return { data: null, error: { message: error.message || "Request failed" } };
  }
};

export const apiGet = async (path: string) => {
  const response = await fetch(`${API_BASE}${path}`);
  return handleResponse(response);
};

export const apiPost = async (path: string, payload: any) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

export const apiPatch = async (path: string, payload: any) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

export const apiDelete = async (path: string) => {
  const response = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
  return handleResponse(response);
};
