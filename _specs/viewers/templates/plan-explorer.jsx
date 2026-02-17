import { useState, useMemo, useRef, useCallback } from "react";
import { CORE, THEMES, TYPE, ThemeToggle, globalCSS } from "../iande-theme.jsx";

// ─── Theme ───
function resolveViewerTheme(mode) {
  const t = THEMES[mode];
  return {
    bg: t.bg.primary,
    bgCard: t.bg.secondary,
    bgHover: t.bg.tertiary,
    border: t.border.default,
    borderHi: t.border.strong,
    fg: t.fg.primary,
    fgDim: t.fg.secondary,
    fgMuted: t.fg.tertiary,
    accent: CORE.teal,
    accentDim: CORE.tealText,
    green: CORE.success,
    greenBg: t.bg.success,
    greenBorder: t.border.success,
    amber: CORE.warning,
    amberBg: t.bg.warning,
    amberBorder: t.border.warning,
    red: CORE.error,
    redBg: t.bg.error,
    redBorder: t.border.error,
    purple: CORE.info,
    purpleBg: t.bg.info,
    purpleBorder: t.border.info,
    cyan: CORE.tealMuted,
    cyanBg: t.bg.brandSubtle,
    cyanBorder: t.border.brand,
    white: CORE.white,
    mono: TYPE.family.mono,
    sans: TYPE.family.body,
  };
}

const TOK = resolveViewerTheme("light");

function setThemeTokens(mode) {
  Object.assign(TOK, resolveViewerTheme(mode));
}

const SEVERITY = {
  high:   { color: TOK.red,    bg: TOK.redBg,    border: TOK.redBorder,    label: "HIGH" },
  medium: { color: TOK.amber,  bg: TOK.amberBg,  border: TOK.amberBorder,  label: "MED" },
  low:    { color: TOK.green,  bg: TOK.greenBg,  border: TOK.greenBorder,  label: "LOW" },
};
const LIKELIHOOD_ORDER = ["almost-certain","likely","possible","unlikely","rare"];

const SIZE_META = {
  XS: { color: TOK.fgDim, w: 1 }, S: { color: TOK.green, w: 2 }, M: { color: TOK.amber, w: 3 },
  L: { color: TOK.red, w: 4 }, XL: { color: TOK.purple, w: 5 },
};

// ─── Micro components ───
function Pill({ children, color = TOK.fgDim, bg = TOK.bgCard, border: bd, style = {} }) {
  return <span style={{
    display:"inline-flex",alignItems:"center",gap:4,padding:"2px 9px",borderRadius:99,
    fontSize:10.5,fontWeight:700,color,background:bg,border:`1px solid ${bd||color+"33"}`,
    letterSpacing:".04em",whiteSpace:"nowrap",...style,
  }}>{children}</span>;
}

function SectionTitle({ icon, children, count, rightSlot }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14 }}>
      <span style={{ fontSize:15 }}>{icon}</span>
      <h3 style={{ margin:0,fontSize:15,fontWeight:800,color:TOK.fg,letterSpacing:"-.01em" }}>{children}</h3>
      {count != null && <Pill color={TOK.fgDim} bg={TOK.bg}>{count}</Pill>}
      {rightSlot && <div style={{ marginLeft:"auto" }}>{rightSlot}</div>}
    </div>
  );
}

function Card({ children, style = {}, onClick, hoverable }) {
  return (
    <div onClick={onClick} style={{
      background:TOK.bgCard,border:`1px solid ${TOK.border}`,borderRadius:10,padding:"14px 16px",
      transition:"all .15s ease",cursor:onClick?"pointer":"default",...style,
    }}
    onMouseEnter={e => { if(hoverable||onClick){ e.currentTarget.style.borderColor=TOK.borderHi; e.currentTarget.style.background=TOK.bgHover; }}}
    onMouseLeave={e => { if(hoverable||onClick){ e.currentTarget.style.borderColor=TOK.border; e.currentTarget.style.background=TOK.bgCard; }}}
    >{children}</div>
  );
}

function MetricBox({ label, value, unit, baseline, target, floor }) {
  const progress = baseline != null && target != null
    ? Math.min(100, Math.max(0, ((baseline-floor)/(baseline-target===0?1:baseline-target))*100))
    : null;
  return (
    <Card style={{ flex:"1 1 140px",minWidth:140 }}>
      <div style={{ fontSize:10,color:TOK.fgDim,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:22,fontWeight:800,color:TOK.fg,fontFamily:TOK.mono }}>{baseline ?? "—"}<span style={{ fontSize:12,color:TOK.fgDim,fontWeight:500 }}> {unit}</span></div>
      {target != null && (
        <div style={{ fontSize:10.5,color:TOK.fgDim,marginTop:4 }}>
          target <span style={{ color:TOK.green,fontWeight:700 }}>{target}</span>
          {floor != null && <> · floor <span style={{ color:TOK.amber,fontWeight:700 }}>{floor}</span></>}
        </div>
      )}
    </Card>
  );
}

function VerificationItem({ v }) {
  const byColor = v.verifiedBy === "automated" ? TOK.green : v.verifiedBy === "human" ? TOK.amber : TOK.cyan;
  return (
    <div style={{ padding:"8px 10px",borderRadius:6,background:TOK.bg,border:`1px solid ${TOK.border}`,marginBottom:4 }}>
      <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:3 }}>
        <span style={{ fontSize:10,fontWeight:700,color:byColor,textTransform:"uppercase" }}>{v.verifiedBy || "self"}</span>
        {v.blocking && <Pill color={TOK.red} bg={TOK.redBg} border={TOK.redBorder} style={{ fontSize:9 }}>BLOCKING</Pill>}
        <span style={{ fontSize:12,fontWeight:600,color:TOK.fg }}>{v.name}</span>
      </div>
      {v.command && <code style={{ fontSize:10.5,color:TOK.fgDim,fontFamily:TOK.mono,wordBreak:"break-all" }}>{v.command}</code>}
      {v.passCriteria && <div style={{ fontSize:10.5,color:TOK.fgMuted,marginTop:2 }}>Pass: {v.passCriteria}</div>}
    </div>
  );
}

// ─── Step Detail ───
function StepDetail({ step, steps, onBack, onNavigate }) {
  const [tab, setTab] = useState("overview");
  const sz = SIZE_META[step.size] || { color: TOK.fgDim };
  const deps = (step.dependsOn || []).map(id => steps.find(s => s.id === id)).filter(Boolean);
  const dependents = steps.filter(s => s.dependsOn?.includes(step.id));

  const tabs = [
    { key: "overview", label: "Overview" },
    ...(step.fileChanges?.length ? [{ key: "files", label: `Files (${step.fileChanges.length})` }] : []),
    ...(step.verification?.length ? [{ key: "verify", label: `Checks (${step.verification.length})` }] : []),
    ...((deps.length || dependents.length) ? [{ key: "deps", label: "Dependencies" }] : []),
    ...(step.stopConditions?.length ? [{ key: "stops", label: "Stop Conditions" }] : []),
  ];

  return (
    <div style={{ animation:"slideIn .25s ease" }}>
      <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:TOK.fgDim,padding:0,marginBottom:14,display:"flex",alignItems:"center",gap:4 }}>{"<-"} Back to plan</button>

      <Card style={{ marginBottom:16,borderColor:TOK.accent+"33",background:`linear-gradient(135deg,${TOK.accent}06,${TOK.accent}10)` }}>
        <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,flexWrap:"wrap" }}>
          <div style={{ flex:1,minWidth:240 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
              <code style={{ fontSize:11,color:TOK.accent,fontFamily:TOK.mono,fontWeight:700 }}>{step.id}</code>
              <Pill color={sz.color} bg={TOK.bg}>Size {step.size}</Pill>
              {step.assignedTo && <Pill color={TOK.cyan} bg={TOK.cyanBg}>{step.assignedTo}</Pill>}
            </div>
            <h2 style={{ margin:0,fontSize:20,fontWeight:800,color:TOK.fg,letterSpacing:"-.02em" }}>{step.title}</h2>
            <p style={{ margin:"10px 0 0",fontSize:13,color:TOK.fgDim,lineHeight:1.65 }}>{step.description}</p>
          </div>
          {step.validationBudget && (
            <div style={{ textAlign:"right",flexShrink:0 }}>
              <div style={{ fontSize:10,color:TOK.fgDim,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em" }}>Validation</div>
              <div style={{ fontSize:20,fontWeight:800,color:TOK.fg,fontFamily:TOK.mono }}>{step.validationBudget.valDone}/{step.validationBudget.valReq}</div>
            </div>
          )}
        </div>
        {step.commitTemplate && (
          <div style={{ marginTop:12,padding:"6px 10px",borderRadius:6,background:TOK.bg,border:`1px solid ${TOK.border}` }}>
            <code style={{ fontSize:11,color:TOK.green,fontFamily:TOK.mono }}>{step.commitTemplate}</code>
          </div>
        )}
        {step.notes && <p style={{ margin:"12px 0 0",fontSize:11.5,color:TOK.fgMuted,lineHeight:1.5,fontStyle:"italic" }}>{step.notes}</p>}
      </Card>

      {/* Tabs */}
      <div style={{ display:"flex",gap:2,marginBottom:14,borderBottom:`2px solid ${TOK.border}`,overflowX:"auto" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",background:"none",border:"none",whiteSpace:"nowrap",
            color:tab===t.key?TOK.accent:TOK.fgMuted,borderBottom:tab===t.key?`2px solid ${TOK.accent}`:"2px solid transparent",
            marginBottom:-2,transition:"all .12s ease",
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ minHeight:100 }}>
        {tab === "overview" && (
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {step.reversibility && (
              <Card>
                <div style={{ fontSize:10,color:TOK.fgDim,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4 }}>Reversibility</div>
                <Pill color={step.reversibility.kind==="reversible"?TOK.green:TOK.red} bg={step.reversibility.kind==="reversible"?TOK.greenBg:TOK.redBg} style={{ marginBottom:6 }}>{step.reversibility.kind}</Pill>
                {step.reversibility.rollbackProcedure && <code style={{ display:"block",fontSize:11,color:TOK.fgDim,fontFamily:TOK.mono,marginTop:6 }}>{step.reversibility.rollbackProcedure}</code>}
              </Card>
            )}
            {step.blastRadius?.length > 0 && (
              <Card>
                <div style={{ fontSize:10,color:TOK.red,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8 }}>Blast Radius</div>
                {step.blastRadius.map((b,i) => (
                  <div key={i} style={{ marginBottom:6 }}>
                    <code style={{ fontSize:11,color:TOK.fg,fontFamily:TOK.mono }}>{b.path}</code>
                    <div style={{ fontSize:11,color:TOK.fgDim,marginTop:2 }}>{b.impactDescription}</div>
                  </div>
                ))}
              </Card>
            )}
            {step.resourceRequirements && (
              <Card>
                <div style={{ fontSize:10,color:TOK.fgDim,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8 }}>Resources</div>
                {step.resourceRequirements.simultaneousResources?.length > 0 && (
                  <div style={{ marginBottom:6 }}>
                    <span style={{ fontSize:10,color:TOK.cyan }}>SIMULTANEOUS: </span>
                    {step.resourceRequirements.simultaneousResources.map(r => <code key={r} style={{ fontSize:10.5,color:TOK.fgDim,fontFamily:TOK.mono,marginRight:6 }}>{r}</code>)}
                  </div>
                )}
                {step.resourceRequirements.sequentialResources?.length > 0 && (
                  <div>
                    <span style={{ fontSize:10,color:TOK.amber }}>SEQUENTIAL: </span>
                    {step.resourceRequirements.sequentialResources.map(r => <code key={r} style={{ fontSize:10.5,color:TOK.fgDim,fontFamily:TOK.mono,marginRight:6 }}>{r}</code>)}
                  </div>
                )}
              </Card>
            )}
            {step.handoffTemplate && (
              <Card style={{ borderColor:TOK.greenBorder }}>
                <div style={{ fontSize:10,color:TOK.green,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6 }}>Handoff Template</div>
                <p style={{ margin:0,fontSize:12,color:TOK.fg,lineHeight:1.5 }}>{step.handoffTemplate.completedSummary}</p>
                {step.handoffTemplate.resumptionContext && <p style={{ margin:"6px 0 0",fontSize:11.5,color:TOK.fgDim }}>{step.handoffTemplate.resumptionContext}</p>}
              </Card>
            )}
          </div>
        )}

        {tab === "files" && (
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            {(step.fileChanges||[]).map((fc,i) => (
              <Card key={i}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                  <Pill color={fc.action==="create"?TOK.green:fc.action==="delete"?TOK.red:TOK.amber} bg={TOK.bg}>
                    {fc.action}
                  </Pill>
                  <code style={{ fontSize:12,color:TOK.fg,fontFamily:TOK.mono,fontWeight:600 }}>{fc.path}</code>
                </div>
                <div style={{ fontSize:11.5,color:TOK.fgDim,lineHeight:1.5 }}>{fc.description}</div>
              </Card>
            ))}
          </div>
        )}

        {tab === "verify" && (
          <div>{(step.verification||[]).map((v,i) => <VerificationItem key={i} v={v} />)}</div>
        )}

        {tab === "deps" && (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {deps.length > 0 && <>
              <div style={{ fontSize:10,color:TOK.fgDim,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em" }}>Depends On</div>
              {deps.map(d => (
                <Card key={d.id} onClick={() => onNavigate(d.id)} style={{ cursor:"pointer" }}>
                  <code style={{ fontSize:11,color:TOK.accent,fontFamily:TOK.mono }}>{d.id}</code>
                  <div style={{ fontSize:12.5,color:TOK.fg,fontWeight:600,marginTop:2 }}>{d.title}</div>
                </Card>
              ))}
            </>}
            {dependents.length > 0 && <>
              <div style={{ fontSize:10,color:TOK.fgDim,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginTop:deps.length?8:0 }}>Blocks</div>
              {dependents.map(d => (
                <Card key={d.id} onClick={() => onNavigate(d.id)} style={{ cursor:"pointer" }}>
                  <code style={{ fontSize:11,color:TOK.amber,fontFamily:TOK.mono }}>{d.id}</code>
                  <div style={{ fontSize:12.5,color:TOK.fg,fontWeight:600,marginTop:2 }}>{d.title}</div>
                </Card>
              ))}
            </>}
          </div>
        )}

        {tab === "stops" && (
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            {(step.stopConditions||[]).map((sc,i) => (
              <Card key={i} style={{ borderColor:TOK.redBorder }}>
                <Pill color={TOK.red} bg={TOK.redBg} style={{ marginBottom:6 }}>{sc.action}</Pill>
                <div style={{ fontSize:12.5,color:TOK.fg,lineHeight:1.5 }}>{sc.trigger}</div>
                {sc.blindSpotRisk && <div style={{ fontSize:11,color:TOK.fgMuted,marginTop:4 }}>Blind spot: {sc.blindSpotRisk}</div>}
                {sc.escalateTo && <div style={{ fontSize:11,color:TOK.amber,marginTop:2 }}>Escalate -&gt; {sc.escalateTo}</div>}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Nav Sections ───
const NAV_SECTIONS = [
  { key:"overview",  icon:"OV", label:"Overview" },
  { key:"steps",     icon:"ST", label:"Steps" },
  { key:"risks",     icon:"RK", label:"Risks" },
  { key:"resources", icon:"RS", label:"Resources" },
  { key:"decisions", icon:"DC", label:"Decisions" },
  { key:"criteria",  icon:"AC", label:"Acceptance" },
  { key:"scope",     icon:"SC", label:"Scope" },
  { key:"future",    icon:"FW", label:"Future Work" },
];

// ─── Main Plan View ───
function PlanView({ data, onReset }) {
  const [section, setSection] = useState("overview");
  const [selectedStep, setSelectedStep] = useState(null);

  const plan = data;
  const meta = plan.metadata || {};
  const steps = plan.steps || [];
  const risks = plan.risks || [];
  const resources = plan.resources || [];
  const decisions = plan.decisions || [];
  const acceptance = plan.acceptanceCriteria || [];
  const scope = plan.scope || {};
  const future = plan.futureWork || [];
  const baseline = plan.baseline || {};
  const actors = plan.actors || [];
  const exec = plan.executionOrder || {};
  const problem = plan.problem || {};
  const merge = plan.mergeStrategy || {};
  const metrics = baseline.metrics || [];

  const totalValReq = steps.reduce((s,st) => s + (st.validationBudget?.valReq || 0), 0);
  const totalValDone = steps.reduce((s,st) => s + (st.validationBudget?.valDone || 0), 0);
  const totalFileChanges = steps.reduce((s,st) => s + (st.fileChanges?.length || 0), 0);
  const totalTokens = resources.reduce((s,r) => s + (r.estimatedTokens || 0), 0);

  const stepById = selectedStep ? steps.find(s => s.id === selectedStep) : null;

  if (stepById) {
    return (
      <StepDetail step={stepById} steps={steps} onBack={() => setSelectedStep(null)} onNavigate={id => setSelectedStep(id)} />
    );
  }

  return (
    <>
      {/* Nav bar */}
      <div style={{ display:"flex",gap:3,marginBottom:20,overflowX:"auto",paddingBottom:4 }}>
        {NAV_SECTIONS.filter(ns => {
          if (ns.key === "risks" && !risks.length) return false;
          if (ns.key === "decisions" && !decisions.length) return false;
          if (ns.key === "criteria" && !acceptance.length) return false;
          if (ns.key === "future" && !future.length) return false;
          return true;
        }).map(ns => (
          <button key={ns.key} onClick={() => setSection(ns.key)} style={{
            padding:"6px 14px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",
            background:section===ns.key?TOK.accent+"18":TOK.bgCard,
            color:section===ns.key?TOK.accent:TOK.fgDim,
            border:`1px solid ${section===ns.key?TOK.accent+"44":TOK.border}`,
            transition:"all .12s ease",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5,
          }}>
            <span style={{ fontSize:11 }}>{ns.icon}</span>{ns.label}
          </button>
        ))}
        <button onClick={onReset} style={{
          marginLeft:"auto",padding:"6px 12px",borderRadius:7,fontSize:11,fontWeight:600,
          color:TOK.fgMuted,background:TOK.bg,border:`1px solid ${TOK.border}`,cursor:"pointer",flexShrink:0,
        }}>Load different</button>
      </div>

      {/* OVERVIEW */}
      {section === "overview" && (
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {/* Problem */}
          {problem.problemStatement && (
            <Card>
              <SectionTitle icon="PB">Problem</SectionTitle>
              <p style={{ margin:0,fontSize:13,color:TOK.fg,lineHeight:1.65 }}>{problem.problemStatement}</p>
              {problem.successOutcome && <p style={{ margin:"10px 0 0",fontSize:12,color:TOK.green,lineHeight:1.5 }}><b>Success:</b> {problem.successOutcome}</p>}
              {problem.costOfInaction && <p style={{ margin:"6px 0 0",fontSize:12,color:TOK.amber,lineHeight:1.5 }}><b>Cost of inaction:</b> {problem.costOfInaction}</p>}
              {problem.affectedActors?.length > 0 && (
                <div style={{ display:"flex",gap:4,flexWrap:"wrap",marginTop:8 }}>
                  {problem.affectedActors.map(a => <Pill key={a} color={TOK.fgDim} bg={TOK.bg}>{a}</Pill>)}
                </div>
              )}
            </Card>
          )}

          {/* Metrics */}
          {metrics.length > 0 && (
            <div>
              <SectionTitle icon="BM">Baseline Metrics</SectionTitle>
              <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
                {metrics.map(m => <MetricBox key={m.name} label={m.name} value={m.baseline} unit={m.unit} baseline={m.baseline} target={m.target} floor={m.floor} />)}
              </div>
            </div>
          )}

          {/* Quick stats */}
          <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
            {[
              { label:"Steps",value:steps.length,color:TOK.accent },
              { label:"File Changes",value:totalFileChanges,color:TOK.amber },
              { label:"Validation",value:`${totalValDone}/${totalValReq}`,color:TOK.cyan },
              { label:"Risks",value:risks.length,color:TOK.red },
              { label:"Resources",value:resources.length,color:TOK.green },
              totalTokens>0 && { label:"Est. Tokens",value:totalTokens.toLocaleString(),color:TOK.purple },
            ].filter(Boolean).map((s,i) => (
              <Card key={i} style={{ flex:"1 1 120px",minWidth:120,textAlign:"center" }}>
                <div style={{ fontSize:10,color:TOK.fgDim,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:20,fontWeight:800,color:s.color,fontFamily:TOK.mono }}>{s.value}</div>
              </Card>
            ))}
          </div>

          {/* Actors */}
          {actors.length > 0 && (
            <div>
              <SectionTitle icon="AC" count={actors.length}>Actors</SectionTitle>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                {actors.map(a => (
                  <Card key={a.id} style={{ flex:"1 1 200px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:4 }}>
                      <Pill color={a.kind==="human"?TOK.amber:TOK.cyan} bg={TOK.bg}>{a.kind}</Pill>
                      <Pill color={TOK.fgDim} bg={TOK.bg}>{a.trustLevel}</Pill>
                    </div>
                    <div style={{ fontSize:13,fontWeight:700,color:TOK.fg }}>{a.label}</div>
                    <code style={{ fontSize:10,color:TOK.fgDim,fontFamily:TOK.mono }}>{a.id}</code>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Known Issues */}
          {baseline.knownIssues?.length > 0 && (
            <Card>
              <SectionTitle icon="KI" count={baseline.knownIssues.length}>Known Issues</SectionTitle>
              {baseline.knownIssues.map((iss,i) => <div key={i} style={{ fontSize:12,color:TOK.fgDim,padding:"4px 0",borderBottom:i<baseline.knownIssues.length-1?`1px solid ${TOK.border}`:"none",lineHeight:1.5 }}>{iss}</div>)}
            </Card>
          )}

          {/* Invariants */}
          {baseline.invariants?.length > 0 && (
            <Card style={{ borderColor:TOK.amberBorder }}>
              <SectionTitle icon="IV" count={baseline.invariants.length}>Invariants</SectionTitle>
              {baseline.invariants.map((inv,i) => <div key={i} style={{ fontSize:12,color:TOK.amber,padding:"4px 0",lineHeight:1.5 }}>{inv}</div>)}
            </Card>
          )}

          {/* Merge Strategy */}
          {merge.targetBranch && (
            <Card>
              <SectionTitle icon="MG">Merge Strategy</SectionTitle>
              <div style={{ display:"flex",gap:12,flexWrap:"wrap",fontSize:12 }}>
                <span style={{ color:TOK.fgDim }}>Branch: <code style={{ color:TOK.fg,fontFamily:TOK.mono }}>{merge.targetBranch}</code></span>
                <span style={{ color:TOK.fgDim }}>Method: <code style={{ color:TOK.fg,fontFamily:TOK.mono }}>{merge.method}</code></span>
              </div>
              {merge.requiredGates?.length > 0 && (
                <div style={{ marginTop:8 }}>
                  {merge.requiredGates.map((g,i) => <div key={i} style={{ fontSize:11,color:TOK.fgDim,padding:"3px 0" }}>[ ] {g}</div>)}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* STEPS */}
      {section === "steps" && (
        <div>
          <SectionTitle icon="ST" count={steps.length}>Execution Steps</SectionTitle>
          {exec.sequence?.length > 0 && (
            <div style={{ display:"flex",gap:4,flexWrap:"wrap",marginBottom:14 }}>
              {exec.sequence.map((id,i) => (
                <div key={id} style={{ display:"flex",alignItems:"center",gap:4 }}>
                  <button onClick={() => setSelectedStep(id)} style={{
                    padding:"3px 8px",borderRadius:5,fontSize:10,fontFamily:TOK.mono,fontWeight:700,
                    color:TOK.accent,background:TOK.accent+"12",border:`1px solid ${TOK.accent}33`,cursor:"pointer",
                  }}>{i+1}</button>
                  {i < exec.sequence.length-1 && <span style={{ color:TOK.fgMuted,fontSize:10 }}>{"->"}</span>}
                </div>
              ))}
            </div>
          )}
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {steps.map((st,i) => {
              const sz = SIZE_META[st.size] || { color:TOK.fgDim };
              const seqIdx = exec.sequence?.indexOf(st.id);
              return (
                <Card key={st.id} onClick={() => setSelectedStep(st.id)} style={{ cursor:"pointer" }}>
                  <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
                    <div style={{
                      width:28,height:28,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",
                      background:TOK.accent+"15",color:TOK.accent,fontSize:13,fontWeight:800,flexShrink:0,fontFamily:TOK.mono,
                    }}>{seqIdx != null && seqIdx >= 0 ? seqIdx+1 : i+1}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap" }}>
                        <span style={{ fontSize:13.5,fontWeight:700,color:TOK.fg }}>{st.title}</span>
                        <Pill color={sz.color} bg={TOK.bg}>{st.size}</Pill>
                        {st.assignedTo && <Pill color={TOK.cyan} bg={TOK.cyanBg} style={{ fontSize:9 }}>{st.assignedTo}</Pill>}
                      </div>
                      <code style={{ fontSize:10,color:TOK.fgMuted,fontFamily:TOK.mono }}>{st.id}</code>
                      <div style={{ display:"flex",gap:14,marginTop:6,fontSize:10.5,color:TOK.fgDim }}>
                        {st.fileChanges?.length > 0 && <span>{st.fileChanges.length} files</span>}
                        {st.verification?.length > 0 && <span>{st.verification.length} checks</span>}
                        {st.dependsOn?.length > 0 && <span>{st.dependsOn.length} deps</span>}
                        {st.validationBudget && <span style={{ color:TOK.cyan }}>{st.validationBudget.valDone}/{st.validationBudget.valReq} val</span>}
                      </div>
                    </div>
                    <span style={{ color:TOK.fgMuted,fontSize:16,flexShrink:0 }}>{">"}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* RISKS */}
      {section === "risks" && (
        <div>
          <SectionTitle icon="RK" count={risks.length}>Risk Register</SectionTitle>
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {risks.sort((a,b) => {
              const so = { high:0,medium:1,low:2 };
              return (so[a.severity]??3) - (so[b.severity]??3);
            }).map(r => {
              const sev = SEVERITY[r.severity] || SEVERITY.low;
              return (
                <Card key={r.id} style={{ borderLeft:`3px solid ${sev.color}` }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap" }}>
                    <Pill color={sev.color} bg={sev.bg} border={sev.border}>{sev.label}</Pill>
                    <Pill color={TOK.fgDim} bg={TOK.bg}>{r.likelihood}</Pill>
                    {r.ownerId && <Pill color={TOK.cyan} bg={TOK.cyanBg} style={{ fontSize:9 }}>{r.ownerId}</Pill>}
                    <code style={{ fontSize:10,color:TOK.fgMuted,fontFamily:TOK.mono,marginLeft:"auto" }}>{r.id}</code>
                  </div>
                  <p style={{ margin:"0 0 6px",fontSize:12.5,color:TOK.fg,lineHeight:1.55 }}>{r.description}</p>
                  <p style={{ margin:0,fontSize:11.5,color:TOK.green,lineHeight:1.5 }}><b>Mitigation:</b> {r.mitigation}</p>
                  {r.fallback && <p style={{ margin:"4px 0 0",fontSize:11,color:TOK.amber }}>Fallback: {r.fallback}</p>}
                  {r.affectedSteps?.length > 0 && (
                    <div style={{ display:"flex",gap:4,flexWrap:"wrap",marginTop:8 }}>
                      {r.affectedSteps.map(s => <button key={s} onClick={() => { setSelectedStep(s); }} style={{
                        padding:"2px 7px",borderRadius:4,fontSize:10,fontFamily:TOK.mono,color:TOK.accent,background:TOK.accent+"12",border:`1px solid ${TOK.accent}33`,cursor:"pointer",
                      }}>{s}</button>)}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* RESOURCES */}
      {section === "resources" && (
        <div>
          <SectionTitle icon="RS" count={resources.length} rightSlot={totalTokens>0 && <Pill color={TOK.purple} bg={TOK.purpleBg}>~{totalTokens.toLocaleString()} tokens</Pill>}>Resources</SectionTitle>
          <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
            {resources.map(r => (
              <Card key={r.id} style={{ padding:"10px 14px" }}>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <Pill color={r.kind==="documentation"?TOK.amber:TOK.green} bg={TOK.bg} style={{ fontSize:9 }}>{r.kind || "file"}</Pill>
                  <code style={{ fontSize:12,color:TOK.fg,fontFamily:TOK.mono,fontWeight:600,flex:1 }}>{r.path}</code>
                  {r.estimatedTokens && <span style={{ fontSize:10.5,color:TOK.fgDim,fontFamily:TOK.mono,flexShrink:0 }}>{r.estimatedTokens.toLocaleString()} tok</span>}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* DECISIONS */}
      {section === "decisions" && (
        <div>
          <SectionTitle icon="DC" count={decisions.length}>Decisions</SectionTitle>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {decisions.map(d => (
              <Card key={d.id}>
                <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap" }}>
                  <code style={{ fontSize:10,color:TOK.accent,fontFamily:TOK.mono }}>{d.id}</code>
                  {d.reversible != null && <Pill color={d.reversible?TOK.green:TOK.red} bg={TOK.bg}>{d.reversible?"Reversible":"Irreversible"}</Pill>}
                  {d.decidedBy && <Pill color={TOK.cyan} bg={TOK.cyanBg} style={{ fontSize:9 }}>{d.decidedBy}</Pill>}
                </div>
                <div style={{ fontSize:14,fontWeight:700,color:TOK.fg,marginBottom:6 }}>{d.title}</div>
                <p style={{ margin:"0 0 8px",fontSize:12.5,color:TOK.green,lineHeight:1.5 }}><b>Chosen:</b> {d.chosen}</p>
                {d.alternatives?.length > 0 && d.alternatives.map((alt,i) => (
                  <div key={i} style={{ padding:"6px 10px",borderRadius:6,background:TOK.bg,border:`1px solid ${TOK.border}`,marginBottom:4 }}>
                    <div style={{ fontSize:11.5,color:TOK.fgDim }}>{alt.option}</div>
                    <div style={{ fontSize:10.5,color:TOK.red,marginTop:2 }}>Rejected: {alt.rejectionReason}</div>
                  </div>
                ))}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ACCEPTANCE CRITERIA */}
      {section === "criteria" && (
        <div>
          <SectionTitle icon="AC" count={acceptance.length}>Acceptance Criteria</SectionTitle>
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            {acceptance.map((ac,i) => (
              <Card key={i}>
                <div style={{ fontSize:13,color:TOK.fg,fontWeight:600,marginBottom:6,lineHeight:1.5 }}>[ ] {ac.description}</div>
                {ac.verificationCommand && <code style={{ display:"block",fontSize:10.5,color:TOK.cyan,fontFamily:TOK.mono,padding:"4px 8px",borderRadius:4,background:TOK.bg,marginBottom:4 }}>{ac.verificationCommand}</code>}
                {ac.passCriteria && <div style={{ fontSize:11,color:TOK.fgDim }}>Pass: {ac.passCriteria}</div>}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* SCOPE */}
      {section === "scope" && (
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {scope.inScope?.length > 0 && (
            <div>
              <SectionTitle icon="IN" count={scope.inScope.length}>In Scope</SectionTitle>
              {scope.inScope.map(z => (
                <Card key={z.id} style={{ marginBottom:6,borderColor:TOK.greenBorder }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:4 }}>
                    <Pill color={TOK.green} bg={TOK.greenBg}>{z.id}</Pill>
                    <span style={{ fontSize:12.5,color:TOK.fg,fontWeight:600 }}>{z.label}</span>
                  </div>
                  {z.includes?.map(p => <code key={p} style={{ display:"block",fontSize:11,color:TOK.fgDim,fontFamily:TOK.mono }}>{p}</code>)}
                </Card>
              ))}
            </div>
          )}
          {scope.nonScope?.length > 0 && (
            <div>
              <SectionTitle icon="OUT" count={scope.nonScope.length}>Out of Scope</SectionTitle>
              {scope.nonScope.map(z => (
                <Card key={z.id} style={{ marginBottom:6,borderColor:TOK.redBorder }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:4 }}>
                    <Pill color={TOK.red} bg={TOK.redBg}>{z.id}</Pill>
                    <span style={{ fontSize:12.5,color:TOK.fg,fontWeight:600 }}>{z.label}</span>
                  </div>
                  {z.includes?.map(p => <code key={p} style={{ display:"block",fontSize:11,color:TOK.fgDim,fontFamily:TOK.mono }}>{p}</code>)}
                </Card>
              ))}
              {scope.nonScopeRationale && <p style={{ fontSize:12,color:TOK.fgDim,margin:"8px 0 0",lineHeight:1.5 }}>{scope.nonScopeRationale}</p>}
            </div>
          )}
        </div>
      )}

      {/* FUTURE WORK */}
      {section === "future" && (
        <div>
          <SectionTitle icon="FW" count={future.length}>Future Work</SectionTitle>
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {future.map((fw,i) => (
              <Card key={i}>
                <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:6 }}>
                  <span style={{ fontSize:14,fontWeight:700,color:TOK.fg }}>{fw.title}</span>
                  {fw.targetPhase && <Pill color={TOK.purple} bg={TOK.purpleBg}>{fw.targetPhase}</Pill>}
                </div>
                <p style={{ margin:0,fontSize:12.5,color:TOK.fgDim,lineHeight:1.55 }}>{fw.description}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Loader ───
function PlanLoader({ onLoad, themeMode, setThemeMode, t }) {
  const [mode, setMode] = useState("upload");
  const [paste, setPaste] = useState("");
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const tryParse = useCallback((text, src) => {
    setError(null);
    try {
      const parsed = JSON.parse(text);
      if (!parsed.steps && !parsed.metadata && !parsed.problem) {
        setError("JSON does not look like a plan. Expected at least one of: steps, metadata, or problem.");
        return;
      }
      onLoad({ ...parsed, _source: src });
    } catch (e) { setError(`Invalid JSON: ${e.message}`); }
  }, [onLoad]);

  const handleFile = useCallback(f => {
    if (!f) return; setError(null);
    const r = new FileReader();
    r.onload = e => tryParse(e.target.result, f.name);
    r.onerror = () => setError("Failed to read file.");
    r.readAsText(f);
  }, [tryParse]);

  const handleDrop = useCallback(e => {
    e.preventDefault(); e.stopPropagation(); setDragging(false);
    handleFile(e.dataTransfer?.files?.[0]);
  }, [handleFile]);

  return (
    <div style={{
      minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:`radial-gradient(ellipse at 30% 20%,${TOK.accent}08,transparent 60%),${TOK.bg}`,
      padding:20,fontFamily:TOK.sans,
    }}>
      <style>{`
        ${globalCSS(t)}
        @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
      <ThemeToggle mode={themeMode} setMode={setThemeMode} t={t} />
      <div style={{ width:"100%",maxWidth:540,animation:"slideIn .3s ease" }}>
        <div style={{ textAlign:"center",marginBottom:36 }}>
          <div style={{
            width:52,height:52,borderRadius:14,display:"inline-flex",alignItems:"center",justifyContent:"center",
            background:TOK.accent,color:TOK.white,fontSize:24,fontWeight:800,
            marginBottom:16,boxShadow:`0 12px 40px ${TOK.accent}40`,
          }}>PL</div>
          <h1 style={{ margin:0,fontSize:28,fontWeight:800,letterSpacing:"-.03em",color:TOK.fg }}>Plan Explorer</h1>
          <p style={{ margin:"8px 0 0",fontSize:14,color:TOK.fgDim,lineHeight:1.6 }}>
            Load a plan JSON to visualize steps, risks, resources, and decisions.
          </p>
        </div>

        <div style={{ display:"flex",background:TOK.bgCard,borderRadius:10,padding:3,marginBottom:18,border:`1px solid ${TOK.border}` }}>
          {[{ key:"upload",label:"Upload File" },{ key:"paste",label:"Paste JSON" }].map(t => (
            <button key={t.key} onClick={() => { setMode(t.key); setError(null); }} style={{
              flex:1,padding:"10px 0",borderRadius:8,fontSize:13,fontWeight:700,
              border:"none",cursor:"pointer",transition:"all .15s ease",
              background:mode===t.key?TOK.accent+"18":"transparent",
              color:mode===t.key?TOK.accent:TOK.fgDim,
            }}>{t.label}</button>
          ))}
        </div>

        {mode === "upload" && (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={e => { e.preventDefault(); setDragging(false); }}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border:`2.5px dashed ${dragging?TOK.accent:TOK.border}`,borderRadius:14,padding:"52px 24px",
              textAlign:"center",cursor:"pointer",background:dragging?TOK.accent+"08":TOK.bgCard,
              transition:"all .2s ease",
            }}
          >
            <input ref={fileRef} type="file" accept=".json" style={{ display:"none" }}
              onChange={e => { handleFile(e.target.files?.[0]); e.target.value=""; }} />
            <div style={{ fontSize:22,marginBottom:12,opacity:.7,fontFamily:TOK.mono,fontWeight:700 }}>{dragging?"DROP":"FILE"}</div>
            <div style={{ fontSize:15,fontWeight:700,color:TOK.fg,marginBottom:4 }}>{dragging?"Drop it here":"Drop a plan JSON or click to browse"}</div>
            <div style={{ fontSize:12,color:TOK.fgDim }}>Expects a JSON with <code style={{ color:TOK.accent }}>steps</code>, <code style={{ color:TOK.accent }}>metadata</code>, or <code style={{ color:TOK.accent }}>problem</code></div>
          </div>
        )}

        {mode === "paste" && (
          <div>
            <textarea value={paste} onChange={e => { setPaste(e.target.value); setError(null); }}
              placeholder='{ "metadata": { ... }, "steps": [ ... ] }'
              spellCheck={false}
              style={{
                width:"100%",minHeight:220,padding:"16px 18px",borderRadius:12,
                border:`1.5px solid ${TOK.border}`,fontSize:12,color:TOK.fg,
                fontFamily:TOK.mono,background:TOK.bgCard,resize:"vertical",outline:"none",lineHeight:1.65,
              }}
              onFocus={e => e.target.style.borderColor=TOK.accent+"55"}
              onBlur={e => e.target.style.borderColor=TOK.border}
            />
            <button onClick={() => paste.trim() && tryParse(paste,"pasted JSON")}
              disabled={!paste.trim()}
              style={{
                marginTop:12,width:"100%",padding:"12px 0",borderRadius:10,fontSize:14,fontWeight:700,
                border:"none",cursor:paste.trim()?"pointer":"not-allowed",
                background:paste.trim()?TOK.accent:TOK.bgCard,
                color:paste.trim()?TOK.white:TOK.fgMuted,transition:"all .15s ease",
                boxShadow:paste.trim()?`0 6px 20px ${TOK.accent}40`:"none",
              }}
            >Load Plan</button>
          </div>
        )}

        {error && (
          <div style={{
            marginTop:16,padding:"12px 16px",borderRadius:10,
            background:TOK.redBg,border:`1px solid ${TOK.redBorder}`,color:TOK.red,
            fontSize:13,fontWeight:500,display:"flex",alignItems:"flex-start",gap:8,animation:"slideIn .2s ease",
          }}>
            <span style={{ flexShrink:0,fontSize:11,fontFamily:TOK.mono,fontWeight:700 }}>ERR</span><span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root ───
export default function PlanExplorer() {
  const [data, setData] = useState(null);
  const [themeMode, setThemeMode] = useState("light");
  const t = THEMES[themeMode];
  setThemeTokens(themeMode);

  if (!data) return <PlanLoader onLoad={setData} themeMode={themeMode} setThemeMode={setThemeMode} t={t} />;

  const meta = data.metadata || {};

  return (
    <div style={{ fontFamily:TOK.sans,minHeight:"100vh",background:TOK.bg,color:TOK.fg }}>
      <style>{`
        ${globalCSS(t)}
        @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${TOK.border}; border-radius:99px; }
      `}</style>
      <ThemeToggle mode={themeMode} setMode={setThemeMode} t={t} />

      <div style={{ maxWidth:900,margin:"0 auto",padding:"28px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom:22 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:4,flexWrap:"wrap" }}>
            <div style={{
              width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",
              background:TOK.accent,color:TOK.white,fontSize:14,fontWeight:800,flexShrink:0,
            }}>PL</div>
            <h1 style={{ margin:0,fontSize:22,fontWeight:800,letterSpacing:"-.03em",color:TOK.fg }}>{meta.planId || "Plan Explorer"}</h1>
            {meta.version && <Pill color={TOK.fgDim} bg={TOK.bg}>v{meta.version}</Pill>}
            {data.schemaVersion && <Pill color={TOK.fgMuted} bg={TOK.bg} style={{ fontSize:9 }}>schema {data.schemaVersion}</Pill>}
          </div>
          {meta.description && <p style={{ margin:"8px 0 0",fontSize:13,color:TOK.fgDim,lineHeight:1.6,maxWidth:700 }}>{meta.description}</p>}
          <div style={{ display:"flex",gap:16,marginTop:8,fontSize:11,flexWrap:"wrap" }}>
            {meta.authorId && <span style={{ color:TOK.fgMuted }}>Author: <span style={{ color:TOK.fg,fontWeight:600 }}>{meta.authorId}</span></span>}
            {meta.branch && <span style={{ color:TOK.fgMuted }}>Branch: <code style={{ color:TOK.accent,fontFamily:TOK.mono }}>{meta.branch}</code></span>}
            {meta.snapshotRef && <span style={{ color:TOK.fgMuted }}>Snapshot: <code style={{ color:TOK.fg,fontFamily:TOK.mono }}>{meta.snapshotRef}</code></span>}
            {data._source && <span style={{ color:TOK.fgMuted }}>Loaded: {data._source}</span>}
          </div>
        </div>

        <PlanView data={data} onReset={() => setData(null)} />
      </div>
    </div>
  );
}
