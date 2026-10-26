import { useEffect, useRef, useState } from 'react';
import kael from './assets/kael.jpg';
import { api, ApiError } from './services/api';

const FlameIcon = () => (
  <svg className="ic" viewBox="0 0 24 24">
    <path
      d="M12 2c.8 3.6 5.5 5.6 5.5 10.8A5.5 5.5 0 0 1 12 18.5a5.5 5.5 0 0 1-5.5-5.7c0-2.2 1.2-3.6 2.4-4.6.1 1.8.9 2.8 1.9 3.2C10.3 8.2 10.4 5 12 2z"
      fill="url(#gIc)"
      stroke="#f0e0ff"
      strokeWidth=".7"
      strokeLinejoin="round"
    />
  </svg>
);

const ShieldIcon = () => (
  <svg className="ic" viewBox="0 0 24 24">
    <path
      d="M12 2.5l7.5 2.8v6c0 4.7-3.2 8.3-7.5 10.2-4.3-1.9-7.5-5.5-7.5-10.2v-6z"
      fill="url(#gIc)"
      stroke="#f0e0ff"
      strokeWidth=".7"
      strokeLinejoin="round"
    />
  </svg>
);

const DumbIcon = () => (
  <svg className="ic" viewBox="0 0 24 24">
    <path d="M3 9v6M6 6.5v11M18 6.5v11M21 9v6M6 12h12" stroke="url(#gIc)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
  </svg>
);

const SwordIcon = () => (
  <svg className="ic" viewBox="0 0 24 24">
    <path d="M20.5 3.5L21 6.5 11 16.5l-3.5-3.5L17.5 3z" fill="url(#gIc)" stroke="#f0e0ff" strokeWidth=".7" strokeLinejoin="round" />
    <path d="M6 12l6 6M5 19l-2.5 2.5" stroke="url(#gIc)" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

const MoonIcon = () => (
  <svg className="ic" viewBox="0 0 24 24">
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" fill="url(#gIc)" stroke="#f0e0ff" strokeWidth=".7" strokeLinejoin="round" />
  </svg>
);

const ScrollIcon = () => (
  <svg className="ic" viewBox="0 0 24 24">
    <path d="M6 3h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2z" fill="url(#gIc)" stroke="#f0e0ff" strokeWidth=".7" strokeLinejoin="round" />
    <path d="M9 8h6M9 12h6" stroke="#2a1380" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const BoltIcon = () => (
  <svg className="ic" viewBox="0 0 24 24">
    <path d="M13.5 2L5 13.5h5.5L9.5 22 19 10h-5.8z" fill="url(#gIc)" stroke="#f0e0ff" strokeWidth=".7" strokeLinejoin="round" />
  </svg>
);

const BellIcon = () => (
  <svg className="ic" viewBox="0 0 24 24">
    <path d="M12 3a6 6 0 0 0-6 6c0 5-2 6-2 7h16c0-1-2-2-2-7a6 6 0 0 0-6-6z" fill="url(#gIc)" stroke="#f0e0ff" strokeWidth=".7" strokeLinejoin="round" />
    <path d="M10 19a2 2 0 0 0 4 0" stroke="url(#gIc)" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, filter: 'drop-shadow(0 0 6px #c28bff)' }}>
    <path d="M5 12.5l4.5 4.5L19 7" stroke="url(#gIc)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

type Tab = 'today' | 'tonight' | 'week' | 'achievements' | 'reminder';
type Popup = 'reminder' | 'complete' | 'penalty' | null;
type Q = { id: string; text: string };
type QuestItem = { title: string; first_step: string };
type ChatMsg = { role: 'kael' | 'user'; text: string };

const RANKS = ['Spark', 'Kindle', 'Flame', 'Blaze', 'Inferno'];

const normalizeQs = (qs: any): Q[] =>
  (Array.isArray(qs) ? qs : []).map((q: any, i: number) =>
    typeof q === 'string'
      ? { id: `q${i + 1}`, text: q }
      : { id: String(q?.id ?? `q${i + 1}`), text: String(q?.text ?? '') }
  );

// Used only when the AI is unavailable: three small quests built from the dump itself.
const simpleQuests = (dump: string, floorDesc?: string): QuestItem[] => {
  const lines = dump
    .split(/\n|[;,]/)
    .map((l) => l.replace(/^[>\-*\d.\s]+/, '').trim())
    .filter(Boolean);
  const out: QuestItem[] = lines.slice(0, 2).map((l) => ({
    title: l.charAt(0).toUpperCase() + l.slice(1),
    first_step: 'Open it and spend two minutes on the first small piece.',
  }));
  out.push({ title: 'Your floor for tomorrow', first_step: floorDesc || 'Do the smallest version that still counts.' });
  while (out.length < 3) out.splice(out.length - 1, 0, { title: 'Pick one small thing', first_step: 'Write one sentence about it.' });
  return out.slice(0, 3);
};

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [popup, setPopup] = useState<Popup>(null);
  const [log, setLog] = useState<'stretch' | 'realistic' | 'floor' | 'none'>('floor');
  const [scale, setScale] = useState(1);
  const [kaelChatOpen, setKaelChatOpen] = useState(false);
  const [kaelMessages, setKaelMessages] = useState<ChatMsg[]>([
    { role: 'kael', text: 'I am Kael. Speak, and I will walk beside you.' }
  ]);
  const [kaelBusy, setKaelBusy] = useState(false);
  const [kaelLoaded, setKaelLoaded] = useState(false);
  const kaelEnd = useRef<HTMLDivElement | null>(null);
  const [kaelInput, setKaelInput] = useState('');
  const [goal, setGoal] = useState<any>(null);
  const [bands, setBands] = useState<any>(null);
  const [rank, setRank] = useState<any>(null);
  const [hasGoal, setHasGoal] = useState<boolean | null>(null);
  const [setupName, setSetupName] = useState('');
  const [setupWhy, setSetupWhy] = useState('');
  const [settingUp, setSettingUp] = useState(false);
  const [onboardStep, setOnboardStep] = useState<'goal' | 'interview' | 'reveal'>('goal');
  const [goalId, setGoalId] = useState<number | null>(null);
  const [interviewQs, setInterviewQs] = useState<Q[]>([]);
  const [interviewAns, setInterviewAns] = useState<Record<string, string>>({});
  const [submittingInterview, setSubmittingInterview] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [aiFailed, setAiFailed] = useState(false);
  const [revealed, setRevealed] = useState<any>(null);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [unit, setUnit] = useState('');
  const [descs, setDescs] = useState<Record<string, string>>({});
  const [rankMsg, setRankMsg] = useState('Three kept days in a row lift your rank. Floor days count.');
  const [dump, setDump] = useState('');
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [questsLoading, setQuestsLoading] = useState(false);
  const [questsNote, setQuestsNote] = useState('');
  const [weekInfo, setWeekInfo] = useState<any>(null);
  const [weekStage, setWeekStage] = useState<'idle' | 'loading' | 'questions' | 'proposing' | 'proposal' | 'done'>('idle');
  const [checkinId, setCheckinId] = useState<number | null>(null);
  const [weekQs, setWeekQs] = useState<Q[]>([]);
  const [weekIdx, setWeekIdx] = useState(0);
  const [weekInput, setWeekInput] = useState('');
  const [proposal, setProposal] = useState<any>(null);
  const [weekError, setWeekError] = useState('');
  const [weekBusy, setWeekBusy] = useState(false);

  useEffect(() => {
    api.getAiHealth().then(setAiStatus).catch(() => {});
  }, []);

  const applyStatus = (res: any) => {
    setGoal(res.goal);
    setBands(res.bands);
    setRank(res.rank);
    setUnit(res.unit || res.bands?.unit || '');
    setDescs(res.descriptions || {});
  };

  useEffect(() => {
    api
      .getStatus()
      .then(async (res: any) => {
        if (!res.has_goal) {
          setHasGoal(false);
          return;
        }
        // A goal exists but its interview was never finished: resume it instead of showing starter bands.
        const needsInterview = !res.interview_done && !(res.unit || res.bands?.unit);
        if (needsInterview) {
          try {
            const iq: any = await api.getInterview(res.goal.id);
            const qs = normalizeQs(iq.questions);
            if (qs.length) {
              setGoalId(res.goal.id);
              setInterviewQs(qs);
              setInterviewAns({});
              setOnboardStep('interview');
              setHasGoal(false);
              return;
            }
          } catch {
            /* fall through to the main screen */
          }
        }
        applyStatus(res);
        setHasGoal(true);
      })
      .catch(() => {
        setHasGoal(false);
      });
  }, []);

  // Saved quests for today, when the Tonight tab opens.
  useEffect(() => {
    if (tab !== 'tonight' || !goal?.id || quests.length > 0) return;
    api
      .getQuests(goal.id)
      .then((r: any) => {
        const saved = (r.quests || []).filter((q: any) => q && q.title);
        if (saved.length) setQuests(saved);
      })
      .catch(() => {});
  }, [tab, goal?.id]);

  useEffect(() => {
    kaelEnd.current?.scrollIntoView({ block: 'end' });
  }, [kaelMessages, kaelBusy, kaelChatOpen]);

  const startSetup = async () => {
    setSettingUp(true);
    setSetupError('');
    try {
      const res: any = await api.startGoal(setupName.trim(), setupWhy.trim());
      setGoalId(res.goal_id);
      let qs = normalizeQs(res.questions);
      if (!qs.length) {
        const iq: any = await api.getInterview(res.goal_id);
        qs = normalizeQs(iq.questions);
      }
      setInterviewQs(qs);
      setInterviewAns({});
      setOnboardStep('interview');
    } catch (e) {
      setSetupError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
    } finally {
      setSettingUp(false);
    }
  };

  const submitInterviewAnswers = async () => {
    if (!goalId) return;
    setSubmittingInterview(true);
    setSetupError('');
    setAiFailed(false);
    try {
      const res: any = await api.submitInterview(
        goalId,
        interviewQs.map((q) => ({ question_id: q.id, answer: (interviewAns[q.id] || '').trim() }))
      );
      setRevealed(res);
      setOnboardStep('reveal');
    } catch (e) {
      if (e instanceof ApiError && e.fallback) setAiFailed(true);
      setSetupError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
    } finally {
      setSubmittingInterview(false);
    }
  };

  const enterEmber = async () => {
    try {
      const st: any = await api.getStatus();
      if (st.has_goal) {
        applyStatus(st);
        setHasGoal(true);
      }
    } catch (e) {
      setSetupError(e instanceof ApiError ? e.message : 'Could not load your goal.');
    }
  };

  const logTonight = async (kind: 'stretch' | 'realistic' | 'floor' | 'none') => {
    setLog(kind);
    if (!goal?.id) return;
    try {
      await api.logNight(goal.id, kind);
      const r: any = await api.updateRank(goal.id);
      const newRank = r.rank ?? r.current_rank;
      const change = Number(r.change ?? 0);
      if (newRank) setRank((prev: any) => ({ ...(prev || {}), current_rank: newRank }));
      if (change < 0) {
        setRankMsg(`Rank lowered to ${newRank}. Tomorrow, the floor wins it back.`);
        setPopup('penalty');
      } else if (change > 0) {
        setRankMsg(`Rank up. ${newRank} reached.`);
      } else if (kind === 'none') {
        setRankMsg('Nothing logged. Two in a row lowers rank.');
      } else {
        setRankMsg('Logged. Floor days count.');
      }
    } catch (e) {
      setRankMsg(e instanceof ApiError ? e.message : 'Could not save the log.');
    }
  };

  const generateQuests = async () => {
    if (!goal?.id || !dump.trim() || questsLoading) return;
    setQuestsLoading(true);
    setQuestsNote('');
    try {
      const res: any = await api.shutdown(goal.id, dump.trim());
      setQuests(res.quests || []);
    } catch (e) {
      setQuests(simpleQuests(dump, descs.floor));
      setQuestsNote(e instanceof ApiError ? e.message : 'Could not reach the AI. Using simple quests.');
    } finally {
      setQuestsLoading(false);
    }
  };

  const loadWeek = () => {
    if (!goal?.id) return;
    api.weekOverview(goal.id).then(setWeekInfo).catch(() => setWeekInfo(null));
  };

  useEffect(() => {
    if (tab === 'week' && goal?.id) loadWeek();
  }, [tab, goal?.id]);

  const weekMsg = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

  const startWeek = async () => {
    if (!goal?.id || weekBusy) return;
    setWeekBusy(true);
    setWeekError('');
    setWeekStage('loading');
    try {
      const r: any = await api.weekStart(goal.id);
      setCheckinId(r.checkin_id);
      setWeekQs(normalizeQs(r.questions));
      setWeekIdx(0);
      setWeekInput('');
      setWeekStage('questions');
    } catch (e) {
      setWeekError(weekMsg(e, 'Could not start the evaluation.'));
      setWeekStage('idle');
    } finally {
      setWeekBusy(false);
    }
  };

  // Saves the current answer. After the third answer, and only then, asks the AI for its proposal.
  const answerWeek = async () => {
    if (checkinId == null || weekBusy || !weekInput.trim()) return;
    const q = weekQs[weekIdx];
    const last = weekIdx + 1 >= weekQs.length;
    setWeekBusy(true);
    setWeekError('');
    try {
      await api.weekAnswer(checkinId, q.id, weekInput.trim());
      if (!last) {
        setWeekIdx(weekIdx + 1);
        setWeekInput('');
      } else {
        setWeekStage('proposing');
        const r: any = await api.weekPropose(checkinId);
        setProposal(r.proposal);
        setWeekStage('proposal');
      }
    } catch (e) {
      setWeekError(weekMsg(e, 'Something went wrong. Try again.'));
      setWeekStage('questions');
    } finally {
      setWeekBusy(false);
    }
  };

  const acceptProposal = async () => {
    if (checkinId == null || weekBusy) return;
    setWeekBusy(true);
    setWeekError('');
    try {
      await api.weekRespond(checkinId, true);
      const st: any = await api.getStatus();
      if (st.has_goal) applyStatus(st);
      setWeekStage('done');
      loadWeek();
    } catch (e) {
      setWeekError(weekMsg(e, 'Could not save the proposal.'));
    } finally {
      setWeekBusy(false);
    }
  };

  const toggleKael = () => {
    const next = !kaelChatOpen;
    setKaelChatOpen(next);
    if (next && goal?.id && !kaelLoaded) {
      api
        .getChat(goal.id)
        .then((r: any) => {
          const hist: ChatMsg[] = (r.messages || []).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'kael',
            text: String(m.text),
          }));
          if (hist.length) setKaelMessages(hist);
          setKaelLoaded(true);
        })
        .catch(() => {});
    }
  };

  const sendKael = async () => {
    const text = kaelInput.trim();
    if (!text || kaelBusy || !goal?.id) return;
    setKaelMessages((m) => [...m, { role: 'user', text }]);
    setKaelInput('');
    setKaelBusy(true);
    try {
      const res: any = await api.chat(goal.id, text);
      setKaelMessages((m) => [...m, { role: 'kael', text: String(res.reply || '') }]);
    } catch (e) {
      setKaelMessages((m) => [...m, { role: 'kael', text: e instanceof ApiError ? e.message : 'Kael is silent for a moment. Try again.' }]);
    } finally {
      setKaelBusy(false);
    }
  };

  useEffect(() => {
    const resize = () => {
      const s = Math.min(window.innerWidth / 1440, window.innerHeight / 900);
      setScale(s);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const isToday = tab === 'today';
  const isTonight = tab === 'tonight';
  const isWeek = tab === 'week';
  const isAchievements = tab === 'achievements';
  const isReminder = tab === 'reminder';

  const copy =
    tab === 'today'
      ? ["You don't have to hit the big version.", "Do the floor and it still counts.", 'TODAY']
      : tab === 'tonight'
      ? ["Empty your head. Three things only.", "I'll hand you a first step for each.", 'TONIGHT']
      : tab === 'week'
      ? ["Bands move on evidence, not mood.", "The floor stays where your logs say.", 'WEEK']
      : tab === 'achievements'
      ? ["Your path is etched in ember.", "Every kept day adds fuel to the flame.", 'ACHIEVEMENTS']
      : ["Never forget your why.", "Do the floor and it still counts.", 'REMINDER'];

  const rankLabel = String(rank?.current_rank || 'Spark').toUpperCase();
  const rankIdx = Math.max(0, RANKS.findIndex((r) => r.toUpperCase() === rankLabel));
  const rankPct = `${((rankIdx + 1) / RANKS.length) * 100}%`;
  const rankText = rankIdx === RANKS.length - 1 ? 'TOP RANK' : `NEXT · ${RANKS[rankIdx + 1].toUpperCase()}`;
  const rankNote = rankMsg;

  if (hasGoal === null) return <div className="viewport" />;

  if (hasGoal === false) {
    return (
      <div className="viewport">
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
          <defs>
            <linearGradient id="gIc" x1="0" y1="0" x2="0.6" y2="1">
              <stop offset="0" stopColor="#f4e6ff" />
              <stop offset=".45" stopColor="#b57cff" />
              <stop offset="1" stopColor="#5a26c8" />
            </linearGradient>
          </defs>
        </svg>
        <div className="stage" style={{ '--s': scale } as any}>
          <div className="root">
            <div className="grid" />
            <div className="portal" aria-hidden="true">
              <i className="p-halo" />
              <i className="p-s3" />
              <i className="p-s2" />
              <i className="p-s1" />
              <i className="p-core" />
            </div>
            <div className="floor" />
            <div className="floorfire" aria-hidden="true" />
            <div className="coach" aria-hidden="true">
              <img className="kael" src={kael} alt="" />
            </div>
            {onboardStep === 'goal' && (
              <>
                <div className="wrap" style={{ left: 470, top: 200, width: 560, height: 340, ['--d' as any]: '.15s' }}>
                  <i className="flame" style={{ ['--d' as any]: '.7s' }}></i>
                  <div className="win">
                    <div className="hd">
                      <div className="excl">!</div>
                      <div className="t">EMBER · FIRST RUN</div>
                      <div className="s">SET YOUR GOAL</div>
                    </div>
                    <div className="dim" style={{ fontSize: 16, marginBottom: 12 }}>"Keep it small enough to do on a tired evening."</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input value={setupName} onChange={e => setSetupName(e.target.value)} placeholder="Goal name" style={{ background: 'rgba(20,12,60,.9)', border: '1px solid rgba(201,160,255,.7)', color: '#f0e0ff', padding: '10px 12px', fontSize: 16 }} />
                      <textarea value={setupWhy} onChange={e => setSetupWhy(e.target.value)} placeholder="Why does this matter?" rows={4} style={{ background: 'rgba(20,12,60,.9)', border: '1px solid rgba(201,160,255,.7)', color: '#f0e0ff', padding: '10px 12px', fontSize: 16, resize: 'none' }} />
                    </div>
                    {setupError && <div className="dim" style={{ fontSize: 14, marginTop: 10 }}>{setupError}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                      <span className="mono dim" style={{ fontSize: 12 }}>{settingUp ? 'KAEL IS SHAPING YOUR QUESTIONS...' : ''}</span>
                      <button className="btn" disabled={settingUp || !setupName.trim() || !setupWhy.trim()} onClick={startSetup}>BEGIN</button>
                    </div>
                  </div>
                </div>
                <div className="wrap" style={{ left: 470, top: 560, width: 560, height: 100, ['--d' as any]: '.35s' }}>
                  <div className="win" style={{ padding: '12px 18px' }}>
                    <div style={{ fontSize: 17 }}>Goal · Why</div>
                    <div className="dim" style={{ fontSize: 15 }}>Your single goal. Bands will form around it.</div>
                  </div>
                </div>
              </>
            )}
            {onboardStep === 'interview' && (
              <div className="wrap" style={{ left: 470, top: 80, width: 560, height: 580, ['--d' as any]: '.15s' }}>
                <i className="flame" style={{ ['--d' as any]: '.7s' }}></i>
                <div className="win">
                  <div className="hd">
                    <div className="excl">!</div>
                    <div className="t">EMBER · INTERVIEW</div>
                    <div className="s">BANDS FROM ANSWERS</div>
                  </div>
                  <div className="dim" style={{ fontSize: 15, marginBottom: 10 }}>Kael will shape Stretch / Realistic / Floor from your answers.</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 340, overflowY: 'auto', paddingRight: 6 }}>
                    {interviewQs.map((q, i) => (
                      <div key={q.id}>
                        <div style={{ fontSize: 16, marginBottom: 6 }}>{i + 1}. {q.text}</div>
                        <input value={interviewAns[q.id] || ''} onChange={e => setInterviewAns(a => ({ ...a, [q.id]: e.target.value }))} style={{ width: '100%', background: 'rgba(20,12,60,.9)', border: '1px solid rgba(201,160,255,.7)', color: '#f0e0ff', padding: '10px 12px', fontSize: 15 }} />
                      </div>
                    ))}
                  </div>
                  {setupError && <div className="dim" style={{ fontSize: 14, marginTop: 10 }}>{setupError}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 10 }}>
                    <span className="mono dim" style={{ fontSize: 12 }}>
                      {submittingInterview ? 'KAEL IS SETTING YOUR BANDS...' : `${interviewQs.filter(q => (interviewAns[q.id] || '').trim()).length} / ${interviewQs.length} ANSWERED`}
                    </span>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {aiFailed && <button className="btn ghost" onClick={enterEmber}>USE STARTER BANDS</button>}
                      <button className="btn" disabled={submittingInterview || !goalId || interviewQs.length === 0 || interviewQs.some(q => !(interviewAns[q.id] || '').trim())} onClick={submitInterviewAnswers}>REVEAL BANDS</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {onboardStep === 'reveal' && revealed && (
              <div className="wrap" style={{ left: 470, top: 100, width: 560, height: 540, ['--d' as any]: '.15s' }}>
                <i className="flame" style={{ ['--d' as any]: '.7s' }}></i>
                <div className="win">
                  <div className="hd">
                    <div className="excl">!</div>
                    <div className="t">YOUR BANDS</div>
                    <div className="s">SHAPED BY KAEL</div>
                  </div>
                  {(['stretch', 'realistic', 'floor'] as const).map((k) => (
                    <div className="q" key={k} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <b style={{ fontFamily: "'Orbitron'", fontSize: 13, letterSpacing: '.14em' }}>{k.toUpperCase()}</b>
                        <span style={{ fontSize: 16 }}>{revealed.bands?.[k]} {revealed.unit}</span>
                      </div>
                      <div style={{ fontSize: 15 }}>{revealed.descriptions?.[k]}</div>
                      <div className="mono dim" style={{ fontSize: 12, marginTop: 4 }}>{revealed.reasons?.[k]}</div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <button className="btn" onClick={enterEmber}>ENTER EMBER</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="viewport">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <linearGradient id="gIc" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor="#f4e6ff" />
            <stop offset=".45" stopColor="#b57cff" />
            <stop offset="1" stopColor="#5a26c8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="stage" style={{ '--s': scale } as any}>
        <div className="root">
          <div className="grid" />
          <div className="portal" aria-hidden="true">
            <i className="p-halo" />
            <i className="p-s3" />
            <i className="p-s2" />
            <i className="p-s1" />
            <i className="p-core" />
          </div>
          <i className="sp" style={{ left: 880, top: 560, animationDelay: '0s' }} />
          <i className="sp" style={{ left: 1010, top: 620, animationDelay: '2.2s' }} />
          <i className="sp" style={{ left: 1180, top: 580, animationDelay: '4.1s' }} />
          <i className="sp" style={{ left: 760, top: 640, animationDelay: '5.6s' }} />
          <i className="sp" style={{ left: 1290, top: 650, animationDelay: '1.3s' }} />
          <i className="sp" style={{ left: 960, top: 690, animationDelay: '6.8s' }} />
          <div className="floor" />
          <div className="floorfire" aria-hidden="true" />
          <div className="coach" aria-hidden="true">
            <img className="kael" src={kael} alt="" />
          </div>
          <div className="top">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 12 }}>
              <div className="icbox sm">
                <FlameIcon />
              </div>
              <div style={{ fontFamily: "'Orbitron'", fontWeight: 900, fontSize: 22, letterSpacing: '.3em', textShadow: '0 0 16px #a45cff' }}>EMBER</div>
            </div>
            <button className={`tab ${tab === 'today' ? 'on' : ''}`} onClick={() => setTab('today')}>TODAY</button>
            <button className={`tab ${tab === 'tonight' ? 'on' : ''}`} onClick={() => setTab('tonight')}>TONIGHT</button>
            <button className={`tab ${tab === 'week' ? 'on' : ''}`} onClick={() => setTab('week')}>WEEK</button>
            <button className={`tab ${tab === 'achievements' ? 'on' : ''}`} onClick={() => setTab('achievements')}>ACHIEVEMENTS</button>
            <button className={`tab ${tab === 'reminder' ? 'on' : ''}`} onClick={() => setTab('reminder')}>REMINDER</button>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, paddingRight: 8 }}>
              {aiStatus && (
                <span style={{ fontSize: 11, color: '#b9a7ff', letterSpacing: '.12em', whiteSpace: 'nowrap' }}>
                  AI: {aiStatus.provider === 'groq' ? 'Groq' : aiStatus.provider === 'vertex' ? 'Gemini (Vertex AI)' : 'offline mode'}
                </span>
              )}
            </div>
          </div>
          <div className="wrap" style={{ left: 30, top: 806, width: 290, height: 68, ['--d' as any]: '.4s', zIndex: 6 }}>
            <div className="win" style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="icbox sm">
                <SwordIcon />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 15, letterSpacing: '.2em' }}>KAEL</div>
                <div className="mono dim" style={{ fontSize: 12 }}>SHADOW KNIGHT · COACH</div>
              </div>
              <button className="btn ghost" style={{ padding: '8px 10px', fontSize: 10 }} onClick={toggleKael}>CONSULT KAEL</button>
            </div>
          </div>
          <div className="wrap" style={{ left: 470, top: 716, width: 470, height: 128, ['--d' as any]: '.9s', zIndex: 6 }}>
            <i className="flame" style={{ ['--d' as any]: '1.4s' }}></i>
            <div className="win" style={{ padding: '14px 22px' }}>
              <div className="hd" style={{ paddingBottom: 6, marginBottom: 8 }}>
                <div className="excl" style={{ width: 26, height: 26, fontSize: 14 }}>!</div>
                <div className="t" style={{ fontSize: 14 }}>KAEL</div>
                <div className="s">{copy[2]}</div>
              </div>
              <div style={{ fontSize: 19, lineHeight: 1.3 }}>
                <span className="type">{copy[0]}</span>
                <span className="type b dim">{copy[1]}</span>
              </div>
            </div>
          </div>

          {isToday && (
            <>
              <div className="wrap" style={{ left: 470, top: 150, width: 560, height: 320, ['--d' as any]: '.15s' }}>
                <i className="flame" style={{ ['--d' as any]: '.7s' }}></i>
                <i className="streak" style={{ ['--d' as any]: '.15s' }}></i>
                <div className="win">
                  <div className="hd">
                    <div className="excl">!</div>
                    <div className="t">QUEST INFO</div>
                    <div className="s">ACTIVE GOAL · {goal?.name?.toUpperCase() || 'GOAL'}</div>
                  </div>
                  <div className="dim" style={{ textAlign: 'center', fontSize: 15, marginBottom: 6 }}>"{goal?.why || 'Keep the ember alive.'}"</div>
                  <div style={{ textAlign: 'center', fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 15, letterSpacing: '.3em', margin: '6px 0 12px', textDecoration: 'underline', textUnderlineOffset: 6, textShadow: '0 0 12px #a45cff' }}>GOAL BANDS</div>
                  <div className="row">
                    <div className="icbox">
                      <FlameIcon />
                    </div>
                    <div style={{ width: 110 }}>
                      <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 13, letterSpacing: '.14em' }}>STRETCH</div>
                      <div className="dim" title={descs.stretch || ''} style={{ fontSize: 14 }}>{bands?.stretch ?? 5} {unit || 'units'}</div>
                    </div>
                    <div className="bar" style={{ flex: 1 }}>
                      <b style={{ width: '100%' }}></b>
                    </div>
                    <div className="chk"></div>
                  </div>
                  <div className="row">
                    <div className="icbox">
                      <DumbIcon />
                    </div>
                    <div style={{ width: 110 }}>
                      <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 13, letterSpacing: '.14em' }}>REALISTIC</div>
                      <div className="dim" title={descs.realistic || ''} style={{ fontSize: 14 }}>{bands?.realistic ?? 3} {unit || 'units'}</div>
                    </div>
                    <div className="bar" style={{ flex: 1 }}>
                      <b style={{ width: '56%' }}></b>
                    </div>
                    <div className="chk"></div>
                  </div>
                  <div className="row" style={{ marginBottom: 0 }}>
                    <div className="icbox">
                      <ShieldIcon />
                    </div>
                    <div style={{ width: 110 }}>
                      <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 13, letterSpacing: '.14em' }}>FLOOR</div>
                      <div className="dim" title={descs.floor || ''} style={{ fontSize: 14 }}>{bands?.floor ?? 1} {unit || 'units'}</div>
                    </div>
                    <div className="bar pulse" style={{ flex: 1 }}>
                      <b style={{ width: '22%' }}></b>
                    </div>
                    <div className="chk">
                      <CheckIcon />
                    </div>
                  </div>
                </div>
              </div>
              <div className="wrap" style={{ left: 470, top: 520, width: 560, height: 140, ['--d' as any]: '.35s' }}>
                <i className="flame" style={{ ['--d' as any]: '.9s' }}></i>
                <i className="streak" style={{ ['--d' as any]: '.35s' }}></i>
                <div className="win" style={{ paddingTop: 14 }}>
                  <div className="hd" style={{ paddingBottom: 6, marginBottom: 10 }}>
                    <div className="t" style={{ fontSize: 15 }}>NIGHTLY LOG</div>
                    <div className="s">NOTHING COSTS RANK</div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className={`log ${log === 'stretch' ? 'on' : ''}`} onClick={() => logTonight('stretch')}>
                      STRETCH<small>big one</small>
                    </button>
                    <button className={`log ${log === 'realistic' ? 'on' : ''}`} onClick={() => logTonight('realistic')}>
                      REALISTIC<small>steady</small>
                    </button>
                    <button className={`log ${log === 'floor' ? 'on' : ''}`} onClick={() => logTonight('floor')}>
                      FLOOR<small>still counts</small>
                    </button>
                    <button className={`log warn ${log === 'none' ? 'on' : ''}`} onClick={() => logTonight('none')}>
                      NOTHING<small>rank drops</small>
                    </button>
                  </div>
                </div>
              </div>
              <div className="wrap" style={{ left: 1060, top: 150, width: 340, height: 200, ['--d' as any]: '.25s' }}>
                <i className="flame" style={{ ['--d' as any]: '.8s' }}></i>
                <div className="win">
                  <div className="hd">
                    <div className="t" style={{ fontSize: 15 }}>RANK</div>
                    <div className="s">MOMENTUM</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="hex">
                      <i></i>
                      <i>
                        <FlameIcon />
                      </i>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Orbitron'", fontWeight: 900, fontSize: 24, letterSpacing: '.14em', textShadow: '0 0 14px #a45cff' }}>{rankLabel}</div>
                      <div className="mono dim" style={{ fontSize: 12 }}>{rankText}</div>
                    </div>
                  </div>
                  <div className="bar pulse" style={{ marginTop: 14 }}>
                    <b style={{ width: rankPct }}></b>
                  </div>
                  <div className="dim" style={{ fontSize: 14, marginTop: 8 }}>{rankNote}</div>
                </div>
              </div>
            </>
          )}

          {isTonight && (
            <>
              <div className="wrap" style={{ left: 470, top: 150, width: 560, height: 480, ['--d' as any]: '.15s' }}>
                <i className="flame" style={{ ['--d' as any]: '.7s' }}></i>
                <i className="streak" style={{ ['--d' as any]: '.15s' }}></i>
                <div className="win">
                  <div className="hd">
                    <div className="excl">!</div>
                    <div className="t">DAILY QUEST</div>
                    <div className="s">TOMORROW · TOP 3</div>
                  </div>
                  <div className="dim" style={{ fontSize: 15, marginBottom: 12 }}>Three things. Each with a first step small enough to start tired.</div>
                  {questsLoading && <div className="dim" style={{ fontSize: 17, margin: '24px 0' }}>Kael is reading your dump...</div>}
                  {!questsLoading && quests.length === 0 && (
                    <div className="dim" style={{ fontSize: 17, margin: '24px 0' }}>Dump your thoughts on the right. Kael will pick tomorrow's three.</div>
                  )}
                  {!questsLoading && quests.map((q, i) => (
                    <div className="q" key={i} style={{ marginBottom: 12 }}>
                      <div className="row" style={{ margin: 0 }}>
                        <div className="chk"></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 19 }}>{q.title}</div>
                          <div className="mono dim" style={{ fontSize: 12 }}>FIRST STEP · {q.first_step}</div>
                        </div>
                        <span className="chip">{String(i + 1).padStart(2, '0')}</span>
                      </div>
                    </div>
                  ))}
                  {questsNote && <div className="dim" style={{ fontSize: 13, marginBottom: 8 }}>{questsNote}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span className="mono dim" style={{ fontSize: 12 }}>REWARD · LIGHTS OUT BADGE</span>
                    <button className="btn" disabled={quests.length === 0 || questsLoading} onClick={() => setPopup('complete')}>FINISH SHUTDOWN</button>
                  </div>
                </div>
              </div>
              <div className="wrap" style={{ left: 1060, top: 150, width: 340, height: 480, ['--d' as any]: '.3s' }}>
                <i className="flame" style={{ ['--d' as any]: '.85s' }}></i>
                <div className="win">
                  <div className="hd">
                    <div className="t" style={{ fontSize: 15 }}>BRAIN DUMP</div>
                    <div className="s">{dump.split('\n').filter(l => l.trim()).length} LINES</div>
                  </div>
                  <textarea
                    value={dump}
                    onChange={(e) => setDump(e.target.value)}
                    placeholder={'budget draft due thu\ncall mum back\nlandlord email, again'}
                    rows={9}
                    style={{ width: '100%', background: 'rgba(20,12,60,.9)', border: '1px solid rgba(201,160,255,.7)', color: '#f0e0ff', padding: '10px 12px', fontSize: 15, lineHeight: 1.6, resize: 'none', fontFamily: 'inherit' }}
                  />
                  <div className="dim" style={{ fontSize: 14, margin: '10px 0 12px' }}>Dump it all. Kael picks tomorrow's three.</div>
                  <button className="btn" disabled={!dump.trim() || questsLoading || !goal?.id} onClick={generateQuests}>
                    {questsLoading ? 'KAEL IS THINKING...' : 'ASK KAEL'}
                  </button>
                </div>
              </div>
            </>
          )}

          {isWeek && (
            <>
              <div className="wrap" style={{ left: 470, top: 150, width: 560, height: 500, ['--d' as any]: '.15s' }}>
                <i className="flame" style={{ ['--d' as any]: '.7s' }}></i>
                <i className="streak" style={{ ['--d' as any]: '.15s' }}></i>
                <div className="win">
                  <div className="hd">
                    <div className="excl">!</div>
                    <div className="t">WEEKLY EVALUATION</div>
                    <div className="s">
                      {weekStage === 'questions' ? `QUESTION ${weekIdx + 1} / ${weekQs.length}` : weekStage === 'proposal' || weekStage === 'proposing' ? 'PROPOSAL' : weekStage === 'done' ? 'DONE' : 'THIS WEEK'}
                    </div>
                  </div>

                  {!weekInfo && <div className="dim" style={{ fontSize: 17, margin: '24px 0' }}>Reading your logs...</div>}

                  {weekInfo && !weekInfo.unlocked && weekStage === 'idle' && (
                    <div style={{ margin: '24px 0' }}>
                      <div style={{ fontSize: 19, marginBottom: 10 }}>Begin your journey to view your conquests.</div>
                      <div className="mono dim" style={{ fontSize: 13 }}>{weekInfo.nights_logged ?? 0} OF {weekInfo.nights_needed ?? 3} NIGHTS LOGGED</div>
                      <div className="bar" style={{ marginTop: 12 }}>
                        <b style={{ width: `${Math.min(100, ((weekInfo.nights_logged ?? 0) / (weekInfo.nights_needed ?? 3)) * 100)}%` }}></b>
                      </div>
                    </div>
                  )}

                  {weekInfo && weekInfo.unlocked && weekStage === 'idle' && (
                    <div style={{ margin: '16px 0' }}>
                      <div style={{ fontSize: 18, marginBottom: 12 }}>Kael will ask three questions about your week, then propose one change, based on your logs and your answers.</div>
                      <div className="dim" style={{ fontSize: 15, marginBottom: 18 }}>Bands move on evidence, not mood.</div>
                      <button className="btn" disabled={weekBusy} onClick={startWeek}>START EVALUATION</button>
                    </div>
                  )}

                  {weekStage === 'loading' && <div className="dim" style={{ fontSize: 17, margin: '24px 0' }}>Kael is preparing your questions...</div>}

                  {weekStage === 'questions' && weekQs[weekIdx] && (
                    <div style={{ marginTop: 8 }}>
                      <div className="q" style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 18 }}>{weekQs[weekIdx].text}</div>
                      </div>
                      <textarea
                        value={weekInput}
                        onChange={(e) => setWeekInput(e.target.value)}
                        rows={4}
                        placeholder="Answer in your own words..."
                        style={{ width: '100%', background: 'rgba(20,12,60,.9)', border: '1px solid rgba(201,160,255,.7)', color: '#f0e0ff', padding: '10px 12px', fontSize: 15, resize: 'none', fontFamily: 'inherit' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                        <span className="mono dim" style={{ fontSize: 12 }}>{weekBusy ? 'SAVING...' : `${weekIdx} OF ${weekQs.length} ANSWERED`}</span>
                        <button className="btn" disabled={weekBusy || !weekInput.trim()} onClick={answerWeek}>
                          {weekIdx + 1 >= weekQs.length ? 'SEE PROPOSAL' : 'NEXT'}
                        </button>
                      </div>
                    </div>
                  )}

                  {weekStage === 'proposing' && <div className="dim" style={{ fontSize: 17, margin: '24px 0' }}>Kael is weighing the week...</div>}

                  {weekStage === 'proposal' && proposal && (
                    <>
                      <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 13, letterSpacing: '.2em', margin: '10px 0 8px', textShadow: '0 0 10px #a45cff' }}>SYSTEM PROPOSAL</div>
                      <div className="q" style={{ borderColor: '#c9a0ff', boxShadow: 'inset 0 2px 4px rgba(0,0,0,.5),0 0 16px rgba(160,90,255,.5)', marginBottom: 12 }}>
                        {proposal.band === 'none' || proposal.to == null ? (
                          <div style={{ fontSize: 18, marginBottom: 8 }}>No change. Your bands hold.</div>
                        ) : (
                          <div className="row" style={{ marginBottom: 8 }}>
                            <div className="icbox sm">{proposal.band === 'floor' ? <ShieldIcon /> : <DumbIcon />}</div>
                            <div style={{ flex: 1, fontSize: 18 }}>
                              {String(proposal.band).charAt(0).toUpperCase() + String(proposal.band).slice(1)}: <span className="dim">{proposal.from ?? proposal.from_value} {unit}</span> → <b>{proposal.to} {unit}</b>
                            </div>
                          </div>
                        )}
                        {proposal.reason && <div style={{ fontSize: 15, marginBottom: 6 }}>{proposal.reason}</div>}
                        {proposal.evidence_text && <div className="mono dim" style={{ fontSize: 12 }}>EVIDENCE · {proposal.evidence_text}</div>}
                      </div>
                      {proposal.band !== 'floor' && (
                        <div className="q" style={{ marginBottom: 14 }}>
                          <div className="row" style={{ margin: 0 }}>
                            <div className="icbox sm"><ShieldIcon /></div>
                            <div style={{ flex: 1, fontSize: 18 }}>Floor: <b>{bands?.floor ?? 1} {unit}</b> <span className="dim">· holds</span></div>
                          </div>
                        </div>
                      )}
                      <button className="btn" disabled={weekBusy} onClick={acceptProposal}>{proposal.band === 'none' || proposal.to == null ? 'CONTINUE' : 'ACCEPT'}</button>
                    </>
                  )}

                  {weekStage === 'done' && (
                    <div style={{ margin: '20px 0' }}>
                      <div style={{ fontSize: 20, marginBottom: 10 }}>Week closed. Badge earned: Honest Week.</div>
                      <div className="dim" style={{ fontSize: 16 }}>
                        Stretch {bands?.stretch} · Realistic {bands?.realistic} · Floor {bands?.floor} {unit}
                      </div>
                    </div>
                  )}

                  {weekError && <div className="dim" style={{ fontSize: 14, marginTop: 10 }}>{weekError}</div>}
                </div>
              </div>
              <div className="wrap" style={{ left: 1060, top: 150, width: 340, height: 500, ['--d' as any]: '.3s' }}>
                <i className="flame" style={{ ['--d' as any]: '.85s' }}></i>
                <div className="win">
                  <div className="hd">
                    <div className="t" style={{ fontSize: 15 }}>LAST 7 DAYS</div>
                    <div className="s">
                      {weekInfo && !weekInfo.last7_just_starting ? `${(weekInfo.logs || []).filter((x: string) => x !== 'N').length} / 7 KEPT` : ''}
                    </div>
                  </div>
                  {weekInfo && weekInfo.last7_just_starting ? (
                    <div style={{ fontSize: 17, lineHeight: 1.35, margin: '18px 0' }}>
                      {weekInfo.last7_message || "We'll see how well you've done by the end of the week"}
                    </div>
                  ) : weekInfo ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 6, textAlign: 'center' }}>
                        {[6, 5, 4, 3, 2, 1, 0].map((i) => {
                          const d = new Date();
                          d.setDate(d.getDate() - i);
                          return (
                            <div key={`l${i}`} className="mono dim" style={{ fontSize: 11 }}>
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()]}
                            </div>
                          );
                        })}
                        {[6, 5, 4, 3, 2, 1, 0].map((i) => {
                          const v = (weekInfo.logs || [])[i];
                          return <div key={`d${i}`} className={v === 'S' || v === 'R' ? 'dot k' : v === 'F' ? 'dot f' : 'dot'}></div>;
                        })}
                      </div>
                      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 15 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="dot k" style={{ width: 16, height: 16 }}></span>Stretch / Realistic
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="dot f" style={{ width: 16, height: 16 }}></span>Floor · counts as a win
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="dot" style={{ width: 16, height: 16 }}></span>Nothing · costs rank
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="dim" style={{ fontSize: 15, margin: '18px 0' }}>Reading your logs...</div>
                  )}
                  <div className="q" style={{ marginTop: 18 }}>
                    <div className="mono dim" style={{ fontSize: 12, marginBottom: 4 }}>RANK</div>
                    <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 18, letterSpacing: '.14em' }}>{rankLabel}{rankIdx < RANKS.length - 1 ? ` → ${RANKS[rankIdx + 1].toUpperCase()}` : ''}</div>
                    <div className="bar pulse" style={{ marginTop: 8 }}>
                      <b style={{ width: rankPct }}></b>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {isAchievements && (
            <>
              <div className="wrap" style={{ left: 470, top: 150, width: 560, height: 420, ['--d' as any]: '.15s' }}>
                <i className="flame" style={{ ['--d' as any]: '.7s' }}></i>
                <div className="win">
                  <div className="hd">
                    <div className="t" style={{ fontSize: 17 }}>ACHIEVEMENTS</div>
                    <div className="s">4 / 6</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '16px 8px', justifyItems: 'center', padding: '10px 6px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div className="hex"><i></i><i><FlameIcon /></i></div>
                      <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.1 }}>First<br />Kindling</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div className="hex"><i></i><i><MoonIcon /></i></div>
                      <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.1 }}>Lights<br />Out</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div className="hex"><i></i><i><ScrollIcon /></i></div>
                      <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.1 }}>Honest<br />Week</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div className="hex"><i></i><i><ShieldIcon /></i></div>
                      <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.1 }}>Held the<br />Line</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div className="hex lock"><i></i><i><BoltIcon /></i></div>
                      <div className="dim2" style={{ fontSize: 13, marginTop: 8, lineHeight: 1.1 }}>Tapped<br />In</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div className="hex lock"><i></i><i><SwordIcon /></i></div>
                      <div className="dim2" style={{ fontSize: 13, marginTop: 8, lineHeight: 1.1 }}>Rage<br />7 Stretch</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="wrap" style={{ left: 1060, top: 150, width: 340, height: 420, ['--d' as any]: '.25s' }}>
                <i className="flame" style={{ ['--d' as any]: '.8s' }}></i>
                <div className="win">
                  <div className="hd">
                    <div className="t" style={{ fontSize: 15 }}>BADGES</div>
                    <div className="s">COLLECTED</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="row" style={{ margin: 0 }}>
                      <div className="icbox sm"><MoonIcon /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16 }}>Lights Out</div>
                        <div className="mono dim" style={{ fontSize: 12 }}>Finished shutdown</div>
                      </div>
                      <div className="chk"><CheckIcon /></div>
                    </div>
                    <div className="row" style={{ margin: 0 }}>
                      <div className="icbox sm"><FlameIcon /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16 }}>First Kindling</div>
                        <div className="mono dim" style={{ fontSize: 12 }}>Started the ember</div>
                      </div>
                      <div className="chk"><CheckIcon /></div>
                    </div>
                    <div className="row" style={{ margin: 0 }}>
                      <div className="icbox sm"><ScrollIcon /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16 }}>Honest Week</div>
                        <div className="mono dim" style={{ fontSize: 12 }}>≥3 nights logged</div>
                      </div>
                      <div className="chk"><CheckIcon /></div>
                    </div>
                    <div className="row" style={{ margin: 0 }}>
                      <div className="icbox sm"><ShieldIcon /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16 }}>Held the Line</div>
                        <div className="mono dim" style={{ fontSize: 12 }}>Kept floor going</div>
                      </div>
                      <div className="chk"><CheckIcon /></div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {isReminder && (
            <>
              <div className="wrap" style={{ left: 470, top: 200, width: 560, height: 220, ['--d' as any]: '.15s' }}>
                <i className="flame" style={{ ['--d' as any]: '.7s' }}></i>
                <i className="streak" style={{ ['--d' as any]: '.15s' }}></i>
                <div className="win">
                  <div className="hd">
                    <div className="icbox sm"><BellIcon /></div>
                    <div className="t">REMINDER</div>
                    <div className="s">EVENING TRIGGER</div>
                  </div>
                  <div style={{ fontSize: 19, textAlign: 'center', margin: '24px 0' }}>"Do the floor. It still counts."</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                    <button className="btn">ENABLE</button>
                    <button className="btn ghost">DISABLE</button>
                  </div>
                </div>
              </div>
              <div className="wrap" style={{ left: 1060, top: 200, width: 340, height: 160, ['--d' as any]: '.25s' }}>
                <i className="flame" style={{ ['--d' as any]: '.8s' }}></i>
                <div className="win">
                  <div className="hd">
                    <div className="icbox sm">
                      <BellIcon />
                    </div>
                    <div className="t">NOTIFICATION</div>
                    <div className="s">9:12 PM</div>
                  </div>
                  <div style={{ fontSize: 16, lineHeight: 1.25 }}>
                    You said: <span className="dim">"{goal?.why || 'Keep the ember alive.'}"</span> Ten minutes still counts.
                  </div>
                </div>
              </div>
            </>
          )}

          {popup === 'reminder' && (
            <div className="wrap" style={{ left: 960, top: 660, width: 440, height: 196, ['--d' as any]: '1.6s', zIndex: 10 }}>
              <i className="flame" style={{ ['--d' as any]: '2.1s' }}></i>
              <i className="streak" style={{ ['--d' as any]: '1.6s' }}></i>
              <div className="win" style={{ paddingTop: 14 }}>
                <div className="hd" style={{ paddingBottom: 6, marginBottom: 8 }}>
                  <div className="icbox sm">
                    <BellIcon />
                  </div>
                  <div className="t" style={{ fontSize: 15 }}>NOTIFICATION</div>
                  <div className="s">9:12 PM</div>
                </div>
                <div style={{ fontSize: 17, lineHeight: 1.25, marginBottom: 12 }}>
                  You said: <span className="dim">"{goal?.why || 'Keep the ember alive.'}"</span> Ten minutes still counts.
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button className="btn" onClick={() => setPopup(null)}>START THE FLOOR</button>
                  <button className="btn ghost" onClick={() => setPopup(null)}>LATER</button>
                </div>
              </div>
            </div>
          )}
          {kaelChatOpen && (
            <div className="modal" role="dialog" aria-modal="true">
              <div className="wrap" style={{ left: 470, top: 160, width: 560, height: 420, ['--d' as any]: '.12s', zIndex: 60 }}>
                <i className="flame" style={{ ['--d' as any]: '.4s' }}></i>
                <div className="win" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div className="hd" style={{ paddingBottom: 8, marginBottom: 12 }}>
                    <div className="icbox sm">
                      <SwordIcon />
                    </div>
                    <div className="t">CONSULT KAEL</div>
                    <div className="s">SHADOW KNIGHT · COACH</div>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {kaelMessages.map((m, idx) => (
                      <div key={idx} style={{ alignSelf: m.role === 'kael' ? 'flex-start' : 'flex-end', maxWidth: '75%', background: m.role === 'kael' ? 'rgba(160,90,255,.28)' : 'rgba(90,38,200,.28)', border: '1px solid rgba(201,160,255,.7)', padding: '8px 12px', borderRadius: 6, fontSize: 15 }}>
                        {m.text}
                      </div>
                    ))}
                    {kaelBusy && (
                      <div className="dim" style={{ alignSelf: 'flex-start', fontSize: 14, padding: '4px 4px' }}>Kael is thinking...</div>
                    )}
                    <div ref={kaelEnd} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <input
                      value={kaelInput}
                      onChange={e => setKaelInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') sendKael(); }}
                      placeholder="Speak to Kael..."
                      style={{ flex: 1, background: 'rgba(20,12,60,.9)', border: '1px solid rgba(201,160,255,.7)', color: '#f0e0ff', padding: '8px 10px', fontFamily: "'Inter',sans-serif", fontSize: 15 }}
                    />
                    <button className="btn" disabled={kaelBusy || !kaelInput.trim()} onClick={sendKael}>SEND</button>
                    <button className="btn ghost" onClick={() => setKaelChatOpen(false)}>CLOSE</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {popup === 'penalty' && (
            <>
              <div className="dim-ov"></div>
              <div className="wrap" style={{ left: 450, top: 290, width: 540, height: 250, ['--d' as any]: '.1s', zIndex: 30 }}>
                <i className="flame red" style={{ ['--d' as any]: '.6s' }}></i>
                <i className="streak" style={{ ['--d' as any]: '.1s', background: 'linear-gradient(90deg,transparent,#ff9aae 30%,#fff 50%,#ff9aae 70%,transparent)', boxShadow: '0 0 14px 3px #ff3a5c' }}></i>
                <div className="win red">
                  <div className="hd" style={{ borderColor: 'rgba(255,140,160,.4)' }}>
                    <div className="excl" style={{ borderColor: '#ffb0c0', background: 'linear-gradient(150deg,#a01438,#3a0618)', boxShadow: 'inset 0 2px 2px rgba(255,255,255,.4),0 3px 0 #3a0618,0 0 14px #ff3a5c' }}>!</div>
                    <div className="t" style={{ textShadow: '0 0 12px #ff3a5c' }}>RANK DECREASED</div>
                  </div>
                  <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 21, letterSpacing: '.1em', marginBottom: 8 }}>Nothing logged. Rank lowered.</div>
                  <div style={{ fontSize: 17, lineHeight: 1.3, marginBottom: 16, color: '#ffd8e0' }}>{rankMsg}</div>
                  <button className="btn red" onClick={() => setPopup(null)}>RESUME AT FLOOR</button>
                </div>
              </div>
            </>
          )}
          {popup === 'complete' && (
            <>
              <div className="dim-ov"></div>
              <div className="wrap" style={{ left: 470, top: 280, width: 500, height: 270, ['--d' as any]: '.1s', zIndex: 30 }}>
                <i className="flame" style={{ ['--d' as any]: '.6s' }}></i>
                <i className="streak" style={{ ['--d' as any]: '.1s' }}></i>
                <div className="win" style={{ textAlign: 'center' }}>
                  <div className="hd" style={{ justifyContent: 'center' }}>
                    <div className="t">QUEST COMPLETE</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 10px' }}>
                    <div className="hex">
                      <i></i>
                      <i>
                        <MoonIcon />
                      </i>
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 20, letterSpacing: '.14em', marginBottom: 6 }}>DONE FOR TODAY</div>
                  <div className="dim" style={{ fontSize: 16, marginBottom: 14 }}>Tomorrow's three are set. Badge earned: Lights Out.</div>
                  <button className="btn" onClick={() => setPopup(null)}>REST NOW</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
