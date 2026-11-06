"use client";

import { Editor } from "ketcher-react";
import "ketcher-react/dist/index.css";
import { StandaloneStructServiceProvider } from "ketcher-standalone";
import type { Ketcher } from "ketcher-core";

const structServiceProvider = new StandaloneStructServiceProvider();

export default function KetcherEditor({
  onReady,
  onError,
}: {
  onReady: (k: Ketcher) => void;
  onError: (msg: string) => void;
}) {
  return (
    <Editor
      staticResourcesUrl=""
      structServiceProvider={structServiceProvider}
      errorHandler={(m: string) => onError(String(m))}
      onInit={(k: Ketcher) => onReady(k)}
    />
  );
}
