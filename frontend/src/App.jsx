import { useMemo, useState } from "react";
import api, { setAuthToken } from "./api/client";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from "recharts";

const initialProfile = {
  name: "", email: "", password: "", age: 25, weight: 70, height: 170, gender: "male"
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [profile, setProfile] = useState(initialProfile);
  const [isLoginMode, setIsLoginMode] = useState(true); 
  const [activeView, setActiveView] = useState("input");

  const [daily, setDaily] = useState({
    sleepQuality: 7,
    energyLevel: 7,
    heartRate: 72,
    previousPerformance: 70
  });

  const [dash, setDash] = useState(null);
  const [plan, setPlan] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [feedback, setFeedback] = useState("medium");
  const [message, setMessage] = useState("");

  if (token) setAuthToken(token);

  // Slices data to only show up to a 30-day track
  const recent30Metrics = useMemo(() => {
    if (!dash?.recentMetrics) return [];
    // Since backend now reverses the list for us, we just take the last 30
    return dash.recentMetrics.slice(-30); 
  }, [dash]);

  const adherenceData = useMemo(() =>
    recent30Metrics.map((m, i) => ({
      day: `Day ${i + 1}`,
      ready: (m.ready === true || m.ready === 1 || String(m.ready).toLowerCase() === "true") ? 1 : 0
    })), [recent30Metrics]);

  const progressData = useMemo(() =>
    recent30Metrics.map((m, i) => ({
      day: `Day ${i + 1}`,
      score: Math.round((m.readinessScore || 0) * 100)
    })), [recent30Metrics]);

  const handleProfileChange = (key, value) => {
    if (key === "name") {
      if (/\d/.test(value)) {
        window.alert(`Invalid Input: Your name cannot contain numbers.`);
        return; 
      }
      if (value.length > 20) {
        window.alert(`Invalid Input: Name cannot exceed 20 characters.`);
        return;
      }
    }

    if ((key === "age" || key === "weight" || key === "height") && value !== "") {
      if (isNaN(Number(value))) {
        window.alert(`Invalid Input: This field must be a number.`);
        return; 
      }
      const numValue = Number(value);
      if (key === "age" && numValue > 150) {
        window.alert(`Invalid Input: Please enter a valid age (maximum 150).`);
        return;
      }
      if (key === "weight" && numValue > 500) {
        window.alert(`Invalid Input: Weight cannot exceed 500 kg.`);
        return;
      }
      if (key === "height" && numValue > 400) {
        window.alert(`Invalid Input: Height cannot exceed 400 cm.`);
        return;
      }
    }

    setProfile({ ...profile, [key]: value });
  };

  const register = async () => {
    const hasEmptyFields = Object.values(profile).some(val => val === "" || val === null || val === undefined);
    if (hasEmptyFields) {
      window.alert("Please fill in all fields before registering.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
      window.alert("Please enter a valid email address.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{10,}$/;
    if (!passwordRegex.test(profile.password)) {
      window.alert("Weak Password: Your password must be at least 10 characters long, and include an uppercase letter, a lowercase letter, and a special character.");
      return;
    }

    try {
      await api.post("/auth/register", profile);
      setMessage("Registered successfully. Please login.");
      setIsLoginMode(true); 
    } catch (error) {
      setMessage("Registration failed. Please try again.");
    }
  };

  const login = async () => {
    if (!profile.email || !profile.password) {
      window.alert("Please enter both your Email and Password to login.");
      return;
    }

    try {
      const res = await api.post("/auth/login", {
        email: profile.email,
        password: profile.password
      });
      
      const newToken = res.data.token;
      localStorage.setItem("token", newToken);
      setToken(newToken);
      setAuthToken(newToken); 
      
      setMessage(" Logged in successfully.");
      setActiveView("input"); 
      loadDashboard(); 
    } catch (error) {
      setMessage("Login failed. Check your credentials.");
    }
  };

  const loadDashboard = async () => {
    try {
      const res = await api.get("/dashboard");
      setDash(res.data);
    } catch (error) {
      console.error("Dashboard load failed", error);
    }
  };

  const submitDaily = async () => {
    try {
      const res = await api.post("/fitness-data", daily);
      setReadiness(res.data);

      const planRes = await api.post("/plan", {
        readiness_score: res.data.readiness_score,
        previous_performance: daily.previousPerformance
      });

      setPlan(planRes.data);
      await loadDashboard(); 
      setActiveView("plan"); 
    } catch (error) {
      console.error("Failed to submit daily data", error);
    }
  };

  const submitFeedback = async () => {
    try {
      const res = await fetch("http://localhost:8000/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workout_completion: true,
          difficulty_feedback: feedback,
          current_intensity: plan?.intensity || "moderate"
        })
      });

      const data = await res.json();
      setMessage(`Feedback logged. AI adjustment: ${data.next_recommendation}`);
    } catch (error) {
      console.error("Feedback submission failed", error);
      setMessage("Failed to submit feedback.");
    }
  };

  const handleChartRefresh = () => {
    const daysLogged = dash?.recentMetrics?.length || 0;
    if (daysLogged >= 30) {
      loadDashboard();
      setMessage("✅ Charts refreshed successfully.");
    } else {
      window.alert(` You can refresh the chart after 30 days. Currently logged: ${daysLogged} days.`);
    }
  };

  const fieldsToShow = isLoginMode 
    ? ["email", "password"] 
    : Object.keys(initialProfile);

  return (
    <div className="min-h-screen bg-slate-800 text-slate-100 font-sans flex flex-col items-center p-6 sm:p-10">

      <div className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 tracking-tight mb-3">
          FitSense AI
        </h1>
        <p className="font-medium text-lg text-slate-400">
          Adaptive Daily Fitness Coaching
        </p>
      </div>

      {!token && (
        <div className="w-full max-w-2xl animate-fade-in-up">
          <div className="bg-slate-700 p-8 sm:p-10 rounded-3xl shadow-2xl border border-slate-600">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white">
                {isLoginMode ? "Welcome Back" : "Create Your Account"}
              </h2>
              <p className="text-slate-300 mt-1">
                {isLoginMode ? "Enter your details to access your AI coach" : "Let's personalize your fitness journey"}
              </p>
            </div>

            <div className={`grid gap-5 ${isLoginMode ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {fieldsToShow.map((k) => {
                if (k === "gender") {
                  return (
                    <div key={k} className="flex flex-col sm:col-span-2 mt-2">
                      <label className="text-sm font-semibold text-slate-300 mb-2">Select Biological Sex</label>
                      <div className="grid grid-cols-3 gap-3">
                        {["male", "female", "other"].map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setProfile({...profile, gender: g})}
                            className={`py-3 rounded-xl font-semibold capitalize transition-all border-2 ${
                              profile.gender === g 
                                ? "bg-blue-500 border-blue-400 text-white shadow-md" 
                                : "bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500 hover:bg-slate-700"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }

                let label = k;
                let placeholder = `Enter your ${k}`;
                if (k === "weight") { label = "Weight (kg)"; placeholder = "Max 500kg"; }
                if (k === "height") { label = "Height (cm)"; placeholder = "Max 400cm"; }
                if (k === "age") { label = "Age"; placeholder = "Max 150"; }
                if (k === "name") { placeholder = "Max 20 characters"; }

                const showPasswordHint = !isLoginMode && k === "password";

                return (
                  <div key={k} className="flex flex-col">
                    <label className="text-sm font-semibold text-slate-300 capitalize mb-1">
                      {label}
                    </label>
                    <input
                      value={profile[k]}
                      type={k === "password" ? "password" : k === "email" ? "email" : k === "age" || k === "weight" || k === "height" ? "number" : "text"}
                      onChange={(e) => handleProfileChange(k, e.target.value)}
                      placeholder={placeholder}
                      className="bg-slate-800 border border-slate-600 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-3 transition-all outline-none"
                    />
                    {showPasswordHint && (
                      <span className="text-xs text-slate-400 mt-1">
                        Min 10 chars, 1 uppercase, 1 lowercase, 1 special char.
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col items-center mt-8 max-w-md mx-auto">
              <button
                onClick={isLoginMode ? login : register}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold transition px-8 py-3 rounded-xl shadow-lg mb-4"
              >
                {isLoginMode ? "Sign In" : "Register Account"}
              </button>
              
              <button
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setMessage(""); 
                }}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition"
              >
                {isLoginMode 
                  ? "Don't have an account? Register here" 
                  : "Already have an account? Sign in here"}
              </button>
            </div>

            {message && (
              <div className="mt-6 p-4 bg-slate-800 text-blue-300 rounded-xl text-center font-medium border border-slate-600">
                {message}
              </div>
            )}
          </div>
        </div>
      )}

      {token && (
        <div className="w-full max-w-4xl space-y-6 animate-fade-in-up">
          <div className="bg-slate-700 p-6 rounded-3xl shadow-2xl border border-slate-600 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-inner">
                {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <p className="text-xl font-bold text-white">Hello, {profile.name || "Athlete"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-blue-900/40 border border-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                    {dash?.fitnessLevel || "Active"}
                  </span>
                  <span className="text-sm text-slate-400">{profile.email}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => {
                localStorage.removeItem("token");
                setToken("");
                setAuthToken(null);
                setDash(null);
                setPlan(null);
                setReadiness(null);
                setProfile(initialProfile); 
                setActiveView("input");
              }}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium px-5 py-2 rounded-xl transition border border-red-500/20"
            >
              Logout
            </button>
          </div>

          <div className="flex gap-2 bg-slate-700 p-2 rounded-2xl border border-slate-600 shadow-lg">
            <button onClick={() => setActiveView("input")} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeView === "input" ? "bg-blue-500 text-white" : "text-slate-400 hover:bg-slate-600"}`}>📝 Daily Input</button>
            <button onClick={() => setActiveView("plan")} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeView === "plan" ? "bg-indigo-500 text-white" : "text-slate-400 hover:bg-slate-600"}`}>🤖 AI Plan</button>
            <button onClick={() => { loadDashboard(); setActiveView("dashboard"); }} className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeView === "dashboard" ? "bg-emerald-500 text-white" : "text-slate-400 hover:bg-slate-600"}`}>📈 Dashboard</button>
          </div>

          {message && <div className="p-4 bg-green-900/30 text-green-400 rounded-xl text-center font-medium border border-green-800">{message}</div>}

          {activeView === "input" && (
            <div className="bg-slate-700 p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-600 animate-fade-in-up">
              <h2 className="text-2xl font-bold text-white mb-6">📊 Enter Daily Biometrics</h2>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-300">Sleep Quality (1-10)</label>
                    <span className="text-lg font-bold text-indigo-400">{daily.sleepQuality}</span>
                  </div>
                  <input type="range" min="1" max="10" value={daily.sleepQuality} onChange={(e) => setDaily({ ...daily, sleepQuality: Number(e.target.value) })} className="w-full h-3 bg-slate-800 rounded-lg accent-indigo-500" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-300">Energy Level (1-10)</label>
                    <span className="text-lg font-bold text-amber-400">{daily.energyLevel}</span>
                  </div>
                  <input type="range" min="1" max="10" value={daily.energyLevel} onChange={(e) => setDaily({ ...daily, energyLevel: Number(e.target.value) })} className="w-full h-3 bg-slate-800 rounded-lg accent-amber-500" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-300">Resting Heart Rate</label>
                    <span className="text-lg font-bold text-rose-400">{daily.heartRate} bpm</span>
                  </div>
                  <input type="range" min="40" max="120" value={daily.heartRate} onChange={(e) => setDaily({ ...daily, heartRate: Number(e.target.value) })} className="w-full h-3 bg-slate-800 rounded-lg accent-rose-500" />
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <button onClick={submitDaily} className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 text-lg">Analyze & Generate Plan 🚀</button>
                  <button onClick={() => { loadDashboard(); setActiveView("dashboard"); }} className="flex-1 bg-slate-800 text-white font-bold py-4 rounded-xl border border-slate-600 text-lg">Go to Dashboard 📈</button>
                </div>
              </div>
            </div>
          )}

          {activeView === "plan" && (
            <div className="bg-slate-700 p-6 sm:p-10 rounded-3xl shadow-2xl border border-slate-600 animate-fade-in-up">
              <h2 className="text-2xl font-bold text-white mb-6">🤖 AI Assessment & Plan</h2>
              {!readiness ? (
                <div className="flex flex-col items-center justify-center text-slate-400 py-16 bg-slate-800 rounded-2xl border border-slate-600">
                  <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-lg">Awaiting biometric input...</p>
                  <button onClick={() => setActiveView("input")} className="mt-4 text-blue-400 underline">Go to Daily Input</button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className={`p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between border ${readiness.ready ? "bg-green-900/20 border-green-800" : "bg-amber-900/20 border-amber-800"}`}>
                    <div className="text-center sm:text-left">
                      <p className={`font-bold text-2xl ${readiness.ready ? "text-green-400" : "text-amber-400"}`}>{readiness.ready ? "Optimal Readiness" : "Recovery Recommended"}</p>
                      <p className="text-slate-400 mt-1">Based on today's biometrics</p>
                    </div>
                    <div className={`text-5xl font-black ${readiness.ready ? "text-green-400" : "text-amber-400"}`}>{(readiness.readiness_score * 100).toFixed(0)}%</div>
                  </div>
                  {plan && (
                    <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-600">
                      <h3 className="font-bold text-indigo-300 mb-6 uppercase tracking-widest text-sm">⚡ Today's Adaptive Plan</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between border-b border-slate-700 pb-4"><span className="text-slate-400 text-lg">Workout</span><span className="font-bold text-white text-lg">{plan.workout_type}</span></div>
                        <div className="flex justify-between border-b border-slate-700 pb-4"><span className="text-slate-400 text-lg">Intensity</span><span className="font-bold text-white text-lg capitalize">{plan.intensity}</span></div>
                        <div className="flex justify-between pb-2"><span className="text-slate-400 text-lg">Duration</span><span className="font-bold text-white text-lg">{plan.duration_minutes} Min</span></div>
                      </div>
                      <div className="mt-8 pt-6 border-t border-slate-700 text-center">
                         <h4 className="text-md font-bold text-slate-300 mb-4">How did it feel?</h4>
                         <div className="flex gap-3 mb-4">
                           {["easy", "medium", "hard"].map(level => (
                             <button key={level} onClick={() => setFeedback(level)} className={`flex-1 py-3 rounded-xl font-bold capitalize transition border ${feedback === level ? "bg-indigo-500 border-indigo-400 text-white shadow-lg scale-105" : "bg-slate-700 border-slate-500 text-slate-300"}`}>{level}</button>
                           ))}
                         </div>
                         <button onClick={submitFeedback} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl border border-slate-700 shadow-lg">Submit Feedback to AI Core</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeView === "dashboard" && (
            <div className="bg-slate-700 p-6 sm:p-10 rounded-3xl shadow-2xl border border-slate-600 animate-fade-in-up">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <h2 className="text-2xl font-bold text-white">📈 Performance Trends</h2>
                <button onClick={handleChartRefresh} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${(dash?.recentMetrics?.length || 0) >= 30 ? "bg-blue-600 text-white shadow-lg" : "bg-slate-800 text-slate-400 border border-slate-600"}`}>
                  Refresh Charts ({(dash?.recentMetrics?.length || 0)}/30 Days)
                </button>
              </div>
              {(!dash || !dash.recentMetrics || dash.recentMetrics.length === 0) ? (
                <div className="flex flex-col items-center justify-center text-slate-400 py-16 bg-slate-800 rounded-2xl border border-slate-600">
                  <p className="text-lg mb-2">No historical data available yet.</p>
                  <button onClick={() => setActiveView("input")} className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-lg font-bold">Go to Daily Input</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-12">
                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-600">
                    <h3 className="text-lg font-bold text-slate-300 mb-6 text-center">Readiness Score History (Last 30 Days)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={progressData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#475569" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(v) => [`${v}%`, 'Score']} contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #475569', color: '#f8fafc' }} />
                        <Line type="monotone" dataKey="score" stroke="#60a5fa" strokeWidth={4} dot={{r: 5, fill: '#60a5fa', strokeWidth: 2, stroke: '#1e293b'}} activeDot={{r: 8}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-600">
                    <h3 className="text-lg font-bold text-slate-300 mb-6 text-center">Adherence (Days Ready)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={adherenceData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#475569" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                        <Tooltip cursor={{fill: '#334155'}} contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #475569', color: '#f8fafc' }} />
                        <Bar dataKey="ready" fill="#34d399" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}