"use client"

import { type FirebaseApp, getApps, initializeApp } from "firebase/app"
import { type Auth, getAuth } from "firebase/auth"

import { clientFirebaseConfig } from "./config"

export type FirebaseClient = {
  app: FirebaseApp
  auth: Auth
}

let _client: FirebaseClient | null = null

export function getFirebaseClient(): FirebaseClient {
  if (_client) return _client

  const existing = getApps()[0]
  const app = existing ?? initializeApp(clientFirebaseConfig)

  const auth = getAuth(app)

  _client = { app, auth }
  return _client
}
