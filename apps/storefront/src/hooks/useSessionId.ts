"use client";
import { useState, useEffect } from "react";

export function useSessionId() {
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        let id = localStorage.getItem("trove_session_id");
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem("trove_session_id", id);
        }
        setSessionId(id);
    }, []);

    return sessionId;
}
