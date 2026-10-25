import { useEffect, useState } from 'react';
import kael from './assets/kael.jpg';
import { api } from './services/api';

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

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [popup, setPopup] = useState<Popup>(null);
  const [log, setLog] = useState<'stretch' | 'realistic' | 'floor' | 'none'>('floor');
  const [scale, setScale] = useState(1);
  const [kaelChatOpen, setKaelChatOpen] = useState(false);
  const [kaelMessages, setKaelMessages] = useState<Array<{role: 'kael' | 'user', text: string}>>([
    { role: 'kael', text: 'I am Kael. Speak, and I will walk beside you.' }
  ]);
  const [kaelInput, setKaelInput] = useState('');
  const [goal, setGoal] = useState<any>(null);
  const [bands, setBands] = useState<any>(null);
  const [rank, setRank] = useState<any>(null);
  const [hasGoal, setHasGoal] = useState<boolean | null>(null);
  const [setupName, setSetupName] = useState('');
  const [setupWhy, setSetupWhy] = useState('');
  const [settingUp, setSettingUp] = useState(false);
  const [onboardStep, setOnboardStep] = useState<'goal' | 'interview'>('goal');
  const [goalId, setGoalId] = useState<number | null>(null);
  const [interviewQs, setInterviewQs] = useState<string[]>([]);
  const [interviewAns, setInterviewAns] = useState<string[]>(['', '', '']);
  const [submittingInterview, setSubmittingInterview] = useState(false);

  useEffect(() => {
    api.getStatus().then((res: any) => {
      if (res.has_goal) {
        setHasGoal(true);
        setGoal(res.goal);
        setBands(res.bands);
        setRank(res.rank);
      } else {
        setHasGoal(false);
      }
    }).catch(() => {
      setHasGoal(false);
    });
  }, []);

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

  const rankPct = log === 'none' ? '50%' : '70%';
  const rankText = log === 'none' ? '5 / 10 TO FLAME ▼' : '7 / 10 TO FLAME';
  const rankNote = log === 'none' ? 'Rank lowered after a Nothing day.' : '3 more kept days. Floor days count.';

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
              <div className="wrap" style={{ left: 470, top: 200, width: 560, height: 320, ['--d' as any]: '.15s' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <button className="btn" disabled={settingUp || !setupName.trim() || !setupWhy.trim()} onClick={async () => {
                      setSettingUp(true);
                      try {
                        const res: any = await api.startGoal(setupName.trim(), setupWhy.trim());
                        setGoalId(res.goal_id);
                        try {
                          const iq: any = await api.getInterview(res.goal_id);
                          setInterviewQs(iq.questions || []);
                          setInterviewAns((iq.questions || []).map(() => ''));
                        } catch (e) {
                          setInterviewQs([]);
                        }
                        setOnboardStep('interview');
                      } catch (e) {
                      } finally {
                        setSettingUp(false);
                      }
                    }}>BEGIN</button>
                  </div>
                </div>
              </div>
            )}
            {onboardStep === 'interview' && (
              <div className="wrap" style={{ left: 470, top: 160, width: 560, height: 420, ['--d' as any]: '.15s' }}>
                <i className="flame" style={{ ['--d' as any]: '.7s' }}></i>
                <div className="win">
                  <div className="hd">
                    <div className="excl">!</div>
                    <div className="t">EMBER · INTERVIEW</div>
                    <div className="s">BANDS FROM ANSWERS</div>
                  </div>
                  <div className="dim" style={{ fontSize: 16, marginBottom: 12 }}>Kael will shape Stretch/Realistic/Floor from your answers.</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(interviewQs.length ? interviewQs : ["How much time can you realistically spare on a tired evening?", "What's the smallest version you'd still do when unmotivated?", "What tends to get in the way most often?"]).map((q, i) => (
                      <div key={i}>
                        <div style={{ fontSize: 16, marginBottom: 6 }}>{i+1}. {q}</div>
                        <input value={interviewAns[i] || ''} onChange={e => {
                          const next = [...interviewAns];
                          next[i] = e.target.value;
                          setInterviewAns(next);
                        }} style={{ width: '100%', background: 'rgba(20,12,60,.9)', border: '1px solid rgba(201,160,255,.7)', color: '#f0e0ff', padding: '10px 12px', fontSize: 15 }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <button className="btn" disabled={submittingInterview || !goalId} onClick={async () => {
                      setSubmittingInterview(true);
                      try {
                        await api.submitInterview(goalId!, interviewAns);
                        const st = await api.getStatus();
                        if (st.has_goal) {
                          setHasGoal(true);
                          setGoal(st.goal);
                          setBands(st.bands);
                          setRank(st.rank);
                        }
                      } catch (e) {
                      } finally {
                        setSubmittingInterview(false);
                      }
                    }}>REVEAL BANDS</button>
                  </div>
                </div>
              </div>
            )}
            <div className="wrap" style={{ left: 470, top: 560, width: 560, height: 100, ['--d' as any]: '.35s' }}>
              <div className="win" style={{ padding: '12px 18px' }}>
                <div style={{ fontSize: 17 }}>Goal · Why</div>
                <div className="dim" style={{ fontSize: 15 }}>Your single goal. Bands will form around it.</div>
              </div>
            </div>
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
              <div className="hex" style={{ width: 42, height: 46 }}>
                <i></i>
                <i>
                  <FlameIcon />
                </i>
              </div>
              <span style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 12, letterSpacing: '.16em', whiteSpace: 'nowrap' }}>KINDLE</span>
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
              <button className="btn ghost" style={{ padding: '8px 10px', fontSize: 10 }} onClick={() => setKaelChatOpen(v => !v)}>CONSULT KAEL</button>
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
                      <div className="dim" style={{ fontSize: 14 }}>{bands?.stretch || 5}-unit</div>
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
                      <div className="dim" style={{ fontSize: 14 }}>{bands?.realistic || 3}-unit</div>
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
                      <div className="dim" style={{ fontSize: 14 }}>{bands?.floor || 1}-unit</div>
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
                    <button className={`log ${log === 'stretch' ? 'on' : ''}`} onClick={() => { setLog('stretch'); if (goal?.id) api.logNight(goal.id, 'stretch').catch(()=>{}); }}>
                      STRETCH<small>big one</small>
                    </button>
                    <button className={`log ${log === 'realistic' ? 'on' : ''}`} onClick={() => { setLog('realistic'); if (goal?.id) api.logNight(goal.id, 'realistic').catch(()=>{}); }}>
                      REALISTIC<small>steady</small>
                    </button>
                    <button className={`log ${log === 'floor' ? 'on' : ''}`} onClick={() => { setLog('floor'); if (goal?.id) api.logNight(goal.id, 'floor').catch(()=>{}); }}>
                      FLOOR<small>still counts</small>
                    </button>
                    <button className={`log warn ${log === 'none' ? 'on' : ''}`} onClick={() => { setLog('none'); if (goal?.id) api.logNight(goal.id, 'none').catch(()=>{}); setPopup('penalty'); }}>
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
                      <div style={{ fontFamily: "'Orbitron'", fontWeight: 900, fontSize: 24, letterSpacing: '.14em', textShadow: '0 0 14px #a45cff' }}>KINDLE</div>
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
                  <div className="q" style={{ marginBottom: 12 }}>
                    <div className="row" style={{ margin: 0 }}>
                      <div className="chk"></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 19 }}>Finish the budget draft</div>
                        <div className="mono dim" style={{ fontSize: 12 }}>FIRST STEP · open the sheet, list 3 line items</div>
                      </div>
                      <span className="chip">01</span>
                    </div>
                  </div>
                  <div className="q" style={{ marginBottom: 12, borderColor: '#c9a0ff', boxShadow: 'inset 0 2px 4px rgba(0,0,0,.5),0 0 14px rgba(160,90,255,.5)' }}>
                    <div className="row" style={{ margin: 0 }}>
                      <div className="chk"></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 19, display: 'flex', alignItems: 'center', gap: 8 }}>Evening workout <span className="chip on">FLOOR</span></div>
                        <div className="mono dim" style={{ fontSize: 12 }}>FIRST STEP · shoes on, walk 10 minutes</div>
                      </div>
                      <span className="chip">02</span>
                    </div>
                  </div>
                  <div className="q" style={{ marginBottom: 18 }}>
                    <div className="row" style={{ margin: 0 }}>
                      <div className="chk"></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 19 }}>Reply to the landlord email</div>
                        <div className="mono dim" style={{ fontSize: 12 }}>FIRST STEP · write one sentence</div>
                      </div>
                      <span className="chip">03</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono dim" style={{ fontSize: 12 }}>REWARD · LIGHTS OUT BADGE</span>
                    <button className="btn" onClick={() => setPopup('complete')}>FINISH SHUTDOWN</button>
                  </div>
                </div>
              </div>
              <div className="wrap" style={{ left: 1060, top: 150, width: 340, height: 480, ['--d' as any]: '.3s' }}>
                <i className="flame" style={{ ['--d' as any]: '.85s' }}></i>
                <div className="win">
                  <div className="hd">
                    <div className="t" style={{ fontSize: 15 }}>BRAIN DUMP</div>
                    <div className="s">01:42</div>
                  </div>
                  <div className="mono" style={{ fontSize: 14, lineHeight: 1.7, color: '#d9ccff' }}>
                    <div>&gt; budget draft due thu</div>
                    <div>&gt; call mum back</div>
                    <div>&gt; landlord email, again</div>
                    <div>&gt; gym? too late tonight...</div>
                    <div>&gt; slides for friday</div>
                    <div>
                      &gt; buy rice<span style={{ animation: 'flicker 1s infinite' }}> ▌</span>
                    </div>
                  </div>
                  <div className="bar" style={{ marginTop: 20 }}>
                    <b style={{ width: '78%' }}></b>
                  </div>
                  <div className="dim" style={{ fontSize: 14, marginTop: 8 }}>Dump it all. Ember picks tomorrow's three.</div>
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
                    <div className="s">QUESTION 1 / 3</div>
                  </div>
                  <div className="q" style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 17, marginBottom: 8 }}>How did the evenings feel when you started anyway?</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span className="chip">HEAVY</span>
                      <span className="chip on">OKAY</span>
                      <span className="chip">LIGHT</span>
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 13, letterSpacing: '.2em', margin: '14px 0 8px', textShadow: '0 0 10px #a45cff' }}>SYSTEM PROPOSAL</div>
                  <div className="q" style={{ borderColor: '#c9a0ff', boxShadow: 'inset 0 2px 4px rgba(0,0,0,.5),0 0 16px rgba(160,90,255,.5)', marginBottom: 12 }}>
                    <div className="row" style={{ marginBottom: 8 }}>
                      <div className="icbox sm">
                        <DumbIcon />
                      </div>
                      <div style={{ flex: 1, fontSize: 18 }}>Realistic: <span className="dim">25 min</span> → <b>30 min</b></div>
                    </div>
                    <div className="mono dim" style={{ fontSize: 12, marginBottom: 8 }}>EVIDENCE · 5 of 7 days logged Realistic or better</div>
                    <div className="bar">
                      <b style={{ width: '71%' }}></b>
                    </div>
                  </div>
                  <div className="q" style={{ marginBottom: 16 }}>
                    <div className="row" style={{ margin: 0 }}>
                      <div className="icbox sm">
                        <ShieldIcon />
                      </div>
                      <div style={{ flex: 1, fontSize: 18 }}>Floor: <b>10 min</b> <span className="dim">· holds</span></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button className="btn">ACCEPT</button>
                  </div>
                </div>
              </div>
              <div className="wrap" style={{ left: 1060, top: 150, width: 340, height: 500, ['--d' as any]: '.3s' }}>
                <i className="flame" style={{ ['--d' as any]: '.85s' }}></i>
                <div className="win">
                  <div className="hd">
                    <div className="t" style={{ fontSize: 15 }}>LAST 7 DAYS</div>
                    <div className="s">6 / 7 KEPT</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 6, textAlign: 'center' }}>
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => (
                      <div key={d} className="mono dim" style={{ fontSize: 11 }}>
                        {d}
                      </div>
                    ))}
                    <div className="dot k"></div>
                    <div className="dot k"></div>
                    <div className="dot f"></div>
                    <div className="dot k"></div>
                    <div className="dot k"></div>
                    <div className="dot"></div>
                    <div className="dot k"></div>
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
                  <div className="q" style={{ marginTop: 18 }}>
                    <div className="mono dim" style={{ fontSize: 12, marginBottom: 4 }}>RANK</div>
                    <div style={{ fontFamily: "'Orbitron'", fontWeight: 700, fontSize: 18, letterSpacing: '.14em' }}>KINDLE → FLAME</div>
                    <div className="bar pulse" style={{ marginTop: 8 }}>
                      <b style={{ width: '80%' }}></b>
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
                    You said: <span className="dim">"I want to feel strong again."</span> Ten minutes still counts.
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
                  You said: <span className="dim">"I want to feel strong again."</span> Ten minutes still counts.
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
              <div className="wrap" style={{ left: 470, top: 200, width: 560, height: 320, ['--d' as any]: '.12s', zIndex: 60 }}>
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
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <input value={kaelInput} onChange={e => setKaelInput(e.target.value)} placeholder="Speak to Kael..." style={{ flex: 1, background: 'rgba(20,12,60,.9)', border: '1px solid rgba(201,160,255,.7)', color: '#f0e0ff', padding: '8px 10px', fontFamily: "'Inter',sans-serif", fontSize: 15 }} />
                    <button className="btn" onClick={() => {
                      if (!kaelInput.trim()) return;
                      setKaelMessages(m => [...m, { role: 'user', text: kaelInput.trim() }]);
                      setTimeout(() => {
                        setKaelMessages(m => [...m, { role: 'kael', text: 'Keep going. The floor is enough for tonight.' }]);
                      }, 200);
                      setKaelInput('');
                    }}>SEND</button>
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
                  <div style={{ fontSize: 17, lineHeight: 1.3, marginBottom: 16, color: '#ffd8e0' }}>Momentum 7 → 5. Kindle holds for now. Tomorrow, the 10-minute walk wins it back.</div>
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
