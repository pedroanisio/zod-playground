import { useMemo, useState } from "react";

import FeatureRegistryExplorer from "../templates/feature-registry-explorer.jsx";
import FeedbackExplorer from "../templates/feedback-viewer.jsx";
import MentalModelExplorer from "../templates/mental-model-viewer.jsx";
import PlanExplorer from "../templates/plan-explorer.jsx";
import ViewerRegistry from "../viewer-registry.jsx";

const VIEWERS = {
  registry: { label: "Viewer Registry", component: ViewerRegistry },
  feedback: { label: "Feedback Viewer", component: FeedbackExplorer },
  feature_registry: { label: "Feature Registry", component: FeatureRegistryExplorer },
  mental_model: { label: "Mental Model Viewer", component: MentalModelExplorer },
  plan: { label: "Plan Explorer", component: PlanExplorer },
};

function getInitialViewer() {
  const search = new URLSearchParams(window.location.search);
  const key = search.get("viewer");
  return key && VIEWERS[key] ? key : "registry";
}

function setViewerQueryParam(viewer) {
  const url = new URL(window.location.href);
  url.searchParams.set("viewer", viewer);
  window.history.replaceState({}, "", url);
}

export default function App() {
  const [viewerKey, setViewerKey] = useState(getInitialViewer);
  const Active = useMemo(() => VIEWERS[viewerKey]?.component ?? ViewerRegistry, [viewerKey]);

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          background: "rgba(17,24,39,0.86)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 8,
          color: "#f9fafb",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 12,
        }}
      >
        <span>Viewer</span>
        <select
          value={viewerKey}
          onChange={(event) => {
            const next = event.target.value;
            setViewerKey(next);
            setViewerQueryParam(next);
          }}
          style={{
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "#111827",
            color: "#f9fafb",
            padding: "4px 6px",
            fontSize: 12,
          }}
        >
          {Object.entries(VIEWERS).map(([key, item]) => (
            <option key={key} value={key}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <Active />
    </>
  );
}
