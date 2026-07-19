import { useCallback } from "react";
import { useAppDispatch } from "../../app/hooks";
import { pushToast, type PushToastInput } from "./toastSlice";

export function useToast() {
  const dispatch = useAppDispatch();
  return useCallback(
    (input: PushToastInput | string) => {
      if (typeof input === "string") {
        dispatch(pushToast({ title: input, tone: "neutral" }));
        return;
      }
      dispatch(pushToast(input));
    },
    [dispatch],
  );
}
