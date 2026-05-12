"use client"

import { createBrowserSessionHelpers, createLocalClient, getApiBaseUrl } from "./local-client"

export function createClient() {
  const { getSession, setSession } = createBrowserSessionHelpers()
  return createLocalClient({
    getSession,
    setSession,
    baseUrl: getApiBaseUrl(),
  })
}
