"use client";

import { useEffect } from "react";
import { clearLocalRequestDms } from "@/lib/local-request-dms";

/** 旧ローカル直依頼キャッシュの掃除（一覧はサーバー正本） */
export function MessagesLocalCleanup() {
  useEffect(() => {
    clearLocalRequestDms();
  }, []);
  return null;
}
