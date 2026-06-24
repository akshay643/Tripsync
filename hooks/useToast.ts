"use client";

import * as React from "react";

type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

type ToastState = {
  toasts: Toast[];
};

type ToastAction =
  | { type: "ADD"; toast: Toast }
  | { type: "REMOVE"; id: string };

const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  if (action.type === "ADD") return { toasts: [action.toast, ...state.toasts].slice(0, 3) };
  if (action.type === "REMOVE") return { toasts: state.toasts.filter((t) => t.id !== action.id) };
  return state;
};

let dispatch: React.Dispatch<ToastAction> | null = null;

export function useToast() {
  const [state, localDispatch] = React.useReducer(toastReducer, { toasts: [] });
  dispatch = localDispatch;

  return {
    toasts: state.toasts,
    toast: (props: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      localDispatch({ type: "ADD", toast: { id, ...props } });
      setTimeout(() => localDispatch({ type: "REMOVE", id }), 3000);
    },
    dismiss: (id: string) => localDispatch({ type: "REMOVE", id }),
  };
}

export function toast(props: Omit<Toast, "id">) {
  if (!dispatch) return;
  const id = Math.random().toString(36).slice(2);
  dispatch({ type: "ADD", toast: { id, ...props } });
  setTimeout(() => dispatch?.({ type: "REMOVE", id }), 3000);
}
