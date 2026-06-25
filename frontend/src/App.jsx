import { useEffect, useMemo, useState } from "react";
import api, { setAuthToken } from "./api/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid
} from "recharts";

const initialProfile = {
  name: "",
  email: "",
  password: "",
  age: 25,
  weight: 70,
  height: 170,
  gender: "male",
  fitnessGoal: "fat_loss",
  activityLevel: "moderate",
  experienceLevel: "beginner",
  workoutDuration: "30",
  targetDaysPerWeek: "4",
  injuryLimitation: "none",
  safetyConfirmed: false
};

const choiceGroups = {
  gender: [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" }
  ],
  fitnessGoal: [
    { value: "fat_loss", label: "Fat loss" },
    { value: "muscle_gain", label: "Muscle gain" },
    { value: "endurance", label: "Endurance" },
    { value: "general_fitness", label: "General fitness" },
    { value: "recovery_mobility", label: "Recovery" }
  ],
  activityLevel: [
    { value: "sedentary", label: "Sedentary" },
    { value: "light", label: "Light" },
    { value: "moderate", label: "Moderate" },
    { value: "very_active", label: "Very active" }
  ],
  experienceLevel: [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" }
  ],
  workoutDuration: [
    { value: "15", label: "15 min" },
    { value: "30", label: "30 min" },
    { value: "45", label: "45 min" },
    { value: "60", label: "60 min" }
  ],
  targetDaysPerWeek: [
    { value: "3", label: "3 days" },
    { value: "4", label: "4 days" },
    { value: "5", label: "5 days" },
    { value: "6", label: "6 days" }
  ],
  injuryLimitation: [
    { value: "none", label: "None" },
    { value: "knee_pain", label: "Knee pain" },
    { value: "back_pain", label: "Back pain" },
    { value: "shoulder_pain", label: "Shoulder pain" },
    { value: "other", label: "Other" }
  ]
};

const metrics = [
  {
    key: "sleepQuality",
    label: "Sleep Quality",
    range: "1-10",
    min: 1,
    max: 10,
    accent: "from-indigo-400 to-sky-400",
    copy: "Recovery depth"
  },
  {
    key: "energyLevel",
    label: "Energy Level",
    range: "1-10",
    min: 1,
    max: 10,
    accent: "from-amber-300 to-lime-300",
    copy: "Training drive"
  },
  {
    key: "heartRate",
    label: "Resting Heart Rate",
    range: "bpm",
    min: 40,
    max: 120,
    accent: "from-rose-400 to-orange-300",
    copy: "Cardio signal"
  },
  {
    key: "stressLevel",
    label: "Stress Level",
    range: "1-10",
    min: 1,
    max: 10,
    accent: "from-cyan-300 to-teal-300",
    copy: "Load pressure"
  },
  {
    key: "sorenessLevel",
    label: "Muscle Soreness",
    range: "1-10",
    min: 1,
    max: 10,
    accent: "from-fuchsia-400 to-pink-300",
    copy: "Tissue fatigue"
  }
];

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("userProfile")) || null;
  } catch {
    return null;
  }
};

const getChartUserKey = (user) => user?.email?.trim().toLowerCase() || null;

const getStoredChartBaselines = () => {
  try {
    return JSON.parse(localStorage.getItem("chartRefreshBaselines")) || {};
  } catch {
    return {};
  }
};

const getStoredChartBaseline = (user) => {
  const userKey = getChartUserKey(user);
  if (!userKey) return null;

  const baselines = getStoredChartBaselines();
  if (baselines[userKey]) return baselines[userKey];

  try {
    return JSON.parse(localStorage.getItem("chartRefreshBaseline") || "null");
  } catch {
    return null;
  }
};

const saveStoredChartBaseline = (user, baseline) => {
  const userKey = getChartUserKey(user);
  if (!userKey) return;

  const baselines = getStoredChartBaselines();
  baselines[userKey] = baseline;
  localStorage.setItem("chartRefreshBaselines", JSON.stringify(baselines));
  localStorage.removeItem("chartRefreshBaseline");
};

const getChoiceLabel = (group, value, fallback = "Not set") => {
  return choiceGroups[group].find((option) => option.value === value)?.label || fallback;
};

const getMetricDateSortValue = (metric) => {
  if (metric?.metricDate) {
    const parsedDate = Date.parse(metric.metricDate);
    if (!Number.isNaN(parsedDate)) return parsedDate;
  }

  return null;
};

const getMetricIdSortValue = (metric) => {
  if (metric?.id !== undefined && metric?.id !== null) {
    const parsedId = Number(metric.id);
    if (!Number.isNaN(parsedId)) return parsedId;
  }

  return null;
};

const isMetricAfterChartBaseline = (metric, baseline) => {
  if (!baseline) return true;

  const metricDate = getMetricDateSortValue(metric);
  const baselineDate = getMetricDateSortValue(baseline);
  if (metricDate !== null && baselineDate !== null && metricDate !== baselineDate) {
    return metricDate > baselineDate;
  }

  const metricId = getMetricIdSortValue(metric);
  const baselineId = getMetricIdSortValue(baseline);
  if (metricId !== null && baselineId !== null) {
    return metricId > baselineId;
  }

  return false;
};

const cx = (...classes) => classes.filter(Boolean).join(" ");

function BrandMark({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-sm font-black text-zinc-950 shadow-[0_18px_50px_rgba(255,255,255,0.18)]">
        FS
      </div>
      {!compact && (
        <div>
          <p className="text-lg font-black tracking-tight text-white">FitSense</p>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200/70">AI Fitness OS</p>
        </div>
      )}
    </div>
  );
}

function Panel({ children, className = "" }) {
  return (
    <section className={cx("rounded-[2rem] border border-white/10 bg-white/[0.075] shadow-2xl shadow-black/25 backdrop-blur-2xl", className)}>
      {children}
    </section>
  );
}

function Field({ label, children, hint }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">{label}</label>
      {children}
      {hint && <p className="text-xs leading-5 text-zinc-500">{hint}</p>}
    </div>
  );
}

function TextInput({ value, type = "text", min, max, onChange, placeholder }) {
  return (
    <input
      value={value}
      type={type}
      min={min}
      max={max}
      onChange={onChange}
      placeholder={placeholder}
      className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950/70 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/10"
    />
  );
}

function ChoiceGrid({ options, value, onChange, columns = "grid-cols-2 sm:grid-cols-3" }) {
  return (
    <div className={cx("grid gap-2", columns)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cx(
            "min-h-11 rounded-2xl border px-3 py-2 text-sm font-bold transition",
            value === option.value
              ? "border-cyan-200 bg-cyan-200 text-zinc-950 shadow-lg shadow-cyan-500/20"
              : "border-white/10 bg-white/[0.045] text-zinc-300 hover:border-white/25 hover:bg-white/10"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function MetricSlider({ metric, value, onChange }) {
  const percentage = ((value - metric.min) / (metric.max - metric.min)) * 100;

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-zinc-950/45 p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-black text-white">{metric.label}</p>
          <p className="mt-1 text-sm text-zinc-400">{metric.copy}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black tracking-tight text-white">{value}</p>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">{metric.range}</p>
        </div>
      </div>
      <div className="relative">
        <div className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/10" style={{ width: "100%" }} />
        <div
          className={cx("absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r", metric.accent)}
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={metric.min}
          max={metric.max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="premium-range relative z-10 w-full"
        />
      </div>
    </div>
  );
}

function EmptyState({ title, action, onAction }) {
  return (
    <div className="grid min-h-[320px] place-items-center rounded-[1.75rem] border border-dashed border-white/15 bg-zinc-950/35 p-8 text-center">
      <div>
        <div className="mx-auto mb-5 h-12 w-12 rounded-2xl border border-white/10 bg-white/10" />
        <p className="text-lg font-black text-white">{title}</p>
        {action && (
          <button onClick={onAction} className="mt-6 rounded-2xl bg-white px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-cyan-100">
            {action}
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [profile, setProfile] = useState(initialProfile);
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [activeView, setActiveView] = useState("input");

  const [daily, setDaily] = useState({
    sleepQuality: 7,
    energyLevel: 7,
    heartRate: 72,
    stressLevel: 4,
    sorenessLevel: 3,
    previousPerformance: 70
  });

  const [dash, setDash] = useState(null);
  const [plan, setPlan] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [feedback, setFeedback] = useState("medium");
  const [chartBaseline, setChartBaseline] = useState(() => getStoredChartBaseline(getStoredUser()));
  const [message, setMessage] = useState("");

  if (token) setAuthToken(token);

  const saveCurrentUser = (userData) => {
    const userProfile = {
      name: userData.name || "",
      email: userData.email || "",
      fitnessLevel: userData.fitnessLevel || "Active",
      fitnessGoal: userData.fitnessGoal || initialProfile.fitnessGoal,
      experienceLevel: userData.experienceLevel || initialProfile.experienceLevel,
      workoutDuration: String(userData.workoutDuration || initialProfile.workoutDuration)
    };

    localStorage.setItem("userProfile", JSON.stringify(userProfile));
    setCurrentUser(userProfile);
    setChartBaseline(getStoredChartBaseline(userProfile));
    return userProfile;
  };

  useEffect(() => {
    if (!token) return;
    setAuthToken(token);

    const loadCurrentUser = async () => {
      try {
        const res = await api.get("/auth/me");
        saveCurrentUser(res.data);
      } catch (error) {
        console.error("Profile load failed", error);
      }
    };

    loadCurrentUser();
  }, [token]);

  const bmi = useMemo(() => {
    const weight = Number(profile.weight);
    const heightMeters = Number(profile.height) / 100;
    if (!weight || !heightMeters) return null;
    return weight / Math.pow(heightMeters, 2);
  }, [profile.weight, profile.height]);

  const bmiSummary = useMemo(() => {
    if (!bmi || !Number.isFinite(bmi)) {
      return {
        value: "--",
        category: "Add height and weight",
        note: "Your BMI preview updates automatically."
      };
    }

    if (bmi < 18.5) {
      return {
        value: bmi.toFixed(1),
        category: "Underweight",
        note: "Focus on steady nutrition and strength foundations."
      };
    }
    if (bmi < 25) {
      return {
        value: bmi.toFixed(1),
        category: "Normal",
        note: "Great baseline for balanced adaptive coaching."
      };
    }
    if (bmi < 30) {
      return {
        value: bmi.toFixed(1),
        category: "Overweight",
        note: "Coaching can balance fat loss and joint-friendly volume."
      };
    }
    return {
      value: bmi.toFixed(1),
      category: "Obese",
      note: "Start with safe intensity and sustainable progression."
    };
  }, [bmi]);

  const orderedMetrics = useMemo(() => {
    if (!dash?.recentMetrics) return [];

    return dash.recentMetrics
      .map((metric, index) => ({
        metric,
        dateSortValue: getMetricDateSortValue(metric),
        idSortValue: getMetricIdSortValue(metric),
        index
      }))
      .sort((a, b) => {
        if (a.dateSortValue !== null && b.dateSortValue !== null && a.dateSortValue !== b.dateSortValue) {
          return a.dateSortValue - b.dateSortValue;
        }
        if (a.idSortValue !== null && b.idSortValue !== null && a.idSortValue !== b.idSortValue) {
          return a.idSortValue - b.idSortValue;
        }
        return a.index - b.index;
      })
      .map(({ metric }) => metric);
  }, [dash]);

  const recent30Metrics = useMemo(() => {
    return orderedMetrics
      .filter((metric) => isMetricAfterChartBaseline(metric, chartBaseline))
      .slice(-30);
  }, [orderedMetrics, chartBaseline]);

  const adherenceData = useMemo(
    () =>
      recent30Metrics.map((m, i) => ({
        day: `Day ${i + 1}`,
        training: m.ready === true || m.ready === 1 || String(m.ready).toLowerCase() === "true" ? 1 : 0
      })),
    [recent30Metrics]
  );

  const progressData = useMemo(
    () =>
      recent30Metrics.map((m, i) => ({
        day: `Day ${i + 1}`,
        score: Math.round((m.readinessScore || 0) * 100)
      })),
    [recent30Metrics]
  );

  const handleProfileChange = (key, value) => {
    if (key === "name") {
      if (/\d/.test(value)) {
        window.alert("Invalid Input: Your name cannot contain numbers.");
        return;
      }
      if (value.length > 20) {
        window.alert("Invalid Input: Name cannot exceed 20 characters.");
        return;
      }
    }

    if ((key === "age" || key === "weight" || key === "height") && value !== "") {
      if (isNaN(Number(value))) {
        window.alert("Invalid Input: This field must be a number.");
        return;
      }
      const numValue = Number(value);
      if (key === "age" && numValue > 150) {
        window.alert("Invalid Input: Please enter a valid age (maximum 150).");
        return;
      }
      if (key === "weight" && numValue > 500) {
        window.alert("Invalid Input: Weight cannot exceed 500 kg.");
        return;
      }
      if (key === "height" && numValue > 400) {
        window.alert("Invalid Input: Height cannot exceed 400 cm.");
        return;
      }
    }

    setProfile({ ...profile, [key]: value });
  };

  const profilePayload = {
    ...profile,
    workoutDuration: Number(profile.workoutDuration),
    targetDaysPerWeek: Number(profile.targetDaysPerWeek)
  };

  const register = async () => {
    const hasEmptyFields = Object.values(profile).some((val) => val === "" || val === null || val === undefined);
    if (hasEmptyFields) {
      window.alert("Please fill in all fields before registering.");
      return;
    }

    if (!profile.safetyConfirmed) {
      window.alert("Please confirm you can safely perform exercise before registering.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
      window.alert("Please enter a valid email address.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{10,}$/;
    if (!passwordRegex.test(profile.password)) {
      window.alert(
        "Weak Password: Your password must be at least 10 characters long, and include an uppercase letter, a lowercase letter, and a special character."
      );
      return;
    }

    try {
      await api.post("/auth/register", profilePayload);
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
      const userProfile = saveCurrentUser(res.data);
      setProfile({ ...profile, name: userProfile.name, email: userProfile.email });

      setMessage("Logged in successfully.");
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
        previous_performance: daily.previousPerformance,
        fitness_goal: currentUser?.fitnessGoal || profile.fitnessGoal,
        experience_level: currentUser?.experienceLevel || profile.experienceLevel,
        preferred_duration: Number(currentUser?.workoutDuration || profile.workoutDuration)
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
    const daysLogged = recent30Metrics.length;
    if (daysLogged >= 30) {
      const latestMetric = recent30Metrics[recent30Metrics.length - 1];
      const nextBaseline = {
        metricDate: latestMetric?.metricDate || null,
        id: latestMetric?.id ?? null
      };

      saveStoredChartBaseline(currentUser || { email: profile.email }, nextBaseline);
      setChartBaseline(nextBaseline);
      loadDashboard();
      setMessage("Charts refreshed. Your next log will start a new chart cycle at Day 1.");
    } else {
      window.alert(`You can refresh the chart after 30 days. Currently logged: ${daysLogged} days.`);
    }
  };

  const renderInput = (key, label, options = {}) => (
    <Field label={label} hint={options.hint}>
      <TextInput
        value={profile[key]}
        type={options.type || "text"}
        min={options.min}
        max={options.max}
        onChange={(event) => handleProfileChange(key, event.target.value)}
        placeholder={options.placeholder}
      />
    </Field>
  );

  const renderChoiceGroup = (key, label, columns = "grid-cols-2 sm:grid-cols-3") => (
    <Field label={label}>
      <ChoiceGrid options={choiceGroups[key]} value={profile[key]} onChange={(value) => setProfile({ ...profile, [key]: value })} columns={columns} />
    </Field>
  );

  const displayName = currentUser?.name || profile.name || "Athlete";
  const displayEmail = currentUser?.email || profile.email;
  const readinessPercent = readiness ? (readiness.readiness_score * 100).toFixed(0) : "--";
  const daysLogged = recent30Metrics.length;

  const goalReminder = [
    { label: "Goal", value: getChoiceLabel("fitnessGoal", currentUser?.fitnessGoal || profile.fitnessGoal) },
    { label: "Experience", value: getChoiceLabel("experienceLevel", currentUser?.experienceLevel || profile.experienceLevel) },
    { label: "Duration", value: getChoiceLabel("workoutDuration", currentUser?.workoutDuration || profile.workoutDuration) }
  ];

  const navItems = [
    { id: "input", label: "Today", meta: "Biometrics" },
    { id: "plan", label: "Coach", meta: "AI plan" },
    { id: "dashboard", label: "Progress", meta: "Trends" }
  ];

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userProfile");
    setToken("");
    setCurrentUser(null);
    setChartBaseline(null);
    setAuthToken(null);
    setDash(null);
    setPlan(null);
    setReadiness(null);
    setProfile(initialProfile);
    setActiveView("input");
  };

  if (!token) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#07090d] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(45,212,191,0.20),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(244,114,182,0.14),transparent_26%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(3,7,18,1))]" />
        <div className="relative mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-8 px-5 py-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
          <aside className="flex min-h-[460px] flex-col justify-between rounded-[2.5rem] border border-white/10 bg-white/[0.07] p-7 shadow-2xl shadow-black/30 backdrop-blur-2xl lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
            <BrandMark />
            <div className="my-8">
              <div className="mb-5 inline-flex rounded-full border border-cyan-200/25 bg-cyan-200/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
                Adaptive readiness engine
              </div>
              <h1 className="max-w-xl text-4xl font-black leading-[0.96] tracking-tight text-white sm:text-5xl">
                Train with the precision of an AI performance team.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-8 text-zinc-300">
                FitSense converts sleep, energy, stress, soreness, heart rate, goals, and feedback into a daily plan that feels personal, premium, and measurable.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Readiness", "Live"],
                ["Plans", "Adaptive"],
                ["Trends", "30 day"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-zinc-950/45 p-4">
                  <p className="text-xl font-black text-white">{value}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
          </aside>

          <section className="flex items-center">
            <Panel className={cx("w-full p-5 sm:p-7", isLoginMode ? "max-w-xl lg:ml-auto" : "")}>
              <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-200/80">{isLoginMode ? "Member access" : "Personalization"}</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-white">{isLoginMode ? "Welcome back" : "Build your AI profile"}</h2>
                </div>
                <button
                  onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setMessage("");
                  }}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
                >
                  {isLoginMode ? "Create account" : "Sign in"}
                </button>
              </div>

              {isLoginMode ? (
                <div className="grid gap-5">
                  {renderInput("email", "Email", { type: "email", placeholder: "you@example.com" })}
                  {renderInput("password", "Password", { type: "password", placeholder: "Enter your password" })}
                </div>
              ) : (
                <div className="grid gap-5">
                  <div className="grid gap-5 lg:grid-cols-2">
                    {renderInput("name", "Name", { placeholder: "Max 20 characters" })}
                    {renderInput("email", "Email", { type: "email", placeholder: "you@example.com" })}
                    {renderInput("password", "Password", {
                      type: "password",
                      placeholder: "Create a strong password",
                      hint: "Min 10 chars, 1 uppercase, 1 lowercase, 1 special char."
                    })}
                    {renderInput("age", "Age", { type: "number", min: 1, max: 150 })}
                    {renderInput("weight", "Weight (kg)", { type: "number", min: 1, max: 500 })}
                    {renderInput("height", "Height (cm)", { type: "number", min: 1, max: 400 })}
                  </div>

                  <div className="rounded-[1.75rem] border border-cyan-200/15 bg-cyan-200/[0.07] p-5">
                    <div className="flex items-end justify-between gap-5">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100/80">Live BMI</p>
                        <p className="mt-2 text-5xl font-black tracking-tight text-white">{bmiSummary.value}</p>
                      </div>
                      <div className="max-w-xs text-right">
                        <p className="font-black text-cyan-50">{bmiSummary.category}</p>
                        <p className="mt-1 text-sm leading-6 text-zinc-300">{bmiSummary.note}</p>
                      </div>
                    </div>
                  </div>

                  {renderChoiceGroup("gender", "Biological sex", "grid-cols-3")}
                  {renderChoiceGroup("fitnessGoal", "Fitness goal", "grid-cols-2 xl:grid-cols-5")}
                  {renderChoiceGroup("activityLevel", "Activity level", "grid-cols-2 xl:grid-cols-4")}
                  <div className="grid gap-5 xl:grid-cols-2">
                    {renderChoiceGroup("experienceLevel", "Workout experience", "grid-cols-3")}
                    {renderChoiceGroup("workoutDuration", "Preferred duration", "grid-cols-2 sm:grid-cols-4")}
                  </div>
                  <div className="grid gap-5 xl:grid-cols-2">
                    {renderChoiceGroup("targetDaysPerWeek", "Target days per week", "grid-cols-2 sm:grid-cols-4")}
                    {renderChoiceGroup("injuryLimitation", "Injury or limitation", "grid-cols-2 sm:grid-cols-3")}
                  </div>

                  <label className="flex items-start gap-3 rounded-[1.5rem] border border-white/10 bg-zinc-950/45 p-4 text-sm leading-6 text-zinc-300">
                    <input
                      type="checkbox"
                      checked={profile.safetyConfirmed}
                      onChange={(event) => setProfile({ ...profile, safetyConfirmed: event.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-zinc-950 accent-cyan-200"
                    />
                    <span>I confirm I can safely perform exercise and will stop if I feel pain.</span>
                  </label>
                </div>
              )}

              <button
                onClick={isLoginMode ? login : register}
                className="mt-7 h-14 w-full rounded-2xl bg-white text-sm font-black uppercase tracking-[0.14em] text-zinc-950 shadow-xl shadow-white/10 transition hover:bg-cyan-100"
              >
                {isLoginMode ? "Sign in" : "Create FitSense profile"}
              </button>

              {message && <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center text-sm font-bold text-cyan-100">{message}</div>}
            </Panel>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080a0f] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(45,212,191,0.12),transparent_28%),radial-gradient(circle_at_90%_12%,rgba(251,191,36,0.10),transparent_22%),linear-gradient(180deg,#080a0f_0%,#0d1117_48%,#080a0f_100%)]" />
      <div className="relative mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-4 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-2xl lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <div className="flex items-center justify-between">
            <BrandMark />
            <button onClick={logout} className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-rose-100 transition hover:bg-rose-300/15">
              Logout
            </button>
          </div>

          <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-zinc-950/45 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-200 to-lime-200 text-xl font-black text-zinc-950">
                {displayName ? displayName.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-black text-white">{displayName}</p>
                <p className="truncate text-sm text-zinc-400">{displayEmail}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-100">
              {dash?.fitnessLevel || currentUser?.fitnessLevel || "Active"} athlete
            </div>
          </div>

          <nav className="mt-5 grid gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "dashboard") loadDashboard();
                  setActiveView(item.id);
                }}
                className={cx(
                  "flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition",
                  activeView === item.id
                    ? "border-cyan-200 bg-cyan-200 text-zinc-950 shadow-lg shadow-cyan-500/15"
                    : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10"
                )}
              >
                <span>
                  <span className="block text-sm font-black">{item.label}</span>
                  <span className={cx("mt-1 block text-xs font-bold", activeView === item.id ? "text-zinc-700" : "text-zinc-500")}>{item.meta}</span>
                </span>
                <span className="text-lg">→</span>
              </button>
            ))}
          </nav>

          <div className="mt-5 grid gap-3">
            {goalReminder.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-zinc-950/35 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">{item.label}</p>
                <p className="mt-1 text-sm font-black text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <Panel className="p-5 sm:p-7">
            <div className="grid gap-5 xl:grid-cols-[1fr_420px] xl:items-center">
              <div>
                <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-300">
                  {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                </div>
                <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Your adaptive training cockpit</h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-300">
                  Log today's signals, let the model decide training readiness, then turn the result into a focused workout and measurable trend line.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-zinc-950/45 p-4">
                  <p className="text-3xl font-black text-white">{readinessPercent}%</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Readiness</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-zinc-950/45 p-4">
                  <p className="text-3xl font-black text-white">{daysLogged}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Logs</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-zinc-950/45 p-4">
                  <p className="truncate text-3xl font-black capitalize text-white">{plan?.intensity || "Set"}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Intensity</p>
                </div>
              </div>
            </div>
          </Panel>

          {activeView === "input" && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Panel className="p-5 sm:p-7">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-100/80">Daily signal capture</p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Biometric check-in</h2>
                  </div>
                  <button onClick={submitDaily} className="rounded-2xl bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-zinc-950 transition hover:bg-cyan-100">
                    Generate Plan
                  </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {metrics.map((metric) => (
                    <MetricSlider
                      key={metric.key}
                      metric={metric}
                      value={daily[metric.key]}
                      onChange={(value) => setDaily({ ...daily, [metric.key]: value })}
                    />
                  ))}
                  <div className="rounded-[1.5rem] border border-white/10 bg-zinc-950/45 p-5 lg:col-span-2">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-black text-white">Previous Performance</p>
                        <p className="mt-1 text-sm text-zinc-400">How well your last session landed</p>
                      </div>
                      <p className="text-3xl font-black text-white">{daily.previousPerformance}%</p>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={daily.previousPerformance}
                      onChange={(event) => setDaily({ ...daily, previousPerformance: Number(event.target.value) })}
                      className="premium-range w-full"
                    />
                  </div>
                </div>
              </Panel>

              <Panel className="p-5 sm:p-7">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-lime-100/80">Today preview</p>
                <div className="mt-5 rounded-[1.75rem] bg-gradient-to-br from-white to-cyan-100 p-5 text-zinc-950">
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-zinc-600">AI decision</p>
                  <p className="mt-3 text-4xl font-black tracking-tight">{readiness ? (readiness.ready ? "Train" : "Recover") : "Pending"}</p>
                  <p className="mt-4 text-sm font-semibold leading-6 text-zinc-700">
                    Submit your signals to generate a readiness score and a workout tuned to your goal, level, and preferred duration.
                  </p>
                </div>
                <button onClick={() => { loadDashboard(); setActiveView("dashboard"); }} className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-sm font-black text-white transition hover:bg-white/10">
                  View progress trends
                </button>
              </Panel>
            </div>
          )}

          {activeView === "plan" && (
            <Panel className="p-5 sm:p-7">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-100/80">AI coach</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Assessment and plan</h2>
                </div>
                <button onClick={() => setActiveView("input")} className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:bg-white/10">
                  Update signals
                </button>
              </div>

              {!readiness ? (
                <EmptyState title="Awaiting biometric input" action="Go to daily check-in" onAction={() => setActiveView("input")} />
              ) : (
                <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
                  <div className={cx("rounded-[2rem] border p-6", readiness.ready ? "border-emerald-300/25 bg-emerald-300/10" : "border-amber-300/25 bg-amber-300/10")}>
                    <p className="text-sm font-black uppercase tracking-[0.22em] text-zinc-300">Readiness score</p>
                    <p className={cx("mt-5 text-7xl font-black tracking-tight", readiness.ready ? "text-emerald-100" : "text-amber-100")}>
                      {readinessPercent}%
                    </p>
                    <p className="mt-4 text-3xl font-black text-white">{readiness.ready ? "Training day" : "Recovery day"}</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-300">Based on today's sleep, energy, heart rate, stress, soreness, and prior session performance.</p>
                  </div>

                  {plan && (
                    <div className="rounded-[2rem] border border-white/10 bg-zinc-950/45 p-6">
                      <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-100/80">Today's adaptive plan</p>
                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-4">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Workout</p>
                          <p className="mt-2 text-xl font-black text-white">{plan.workout_type}</p>
                        </div>
                        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-4">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Intensity</p>
                          <p className="mt-2 text-xl font-black capitalize text-white">{plan.intensity}</p>
                        </div>
                        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-4">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Duration</p>
                          <p className="mt-2 text-xl font-black text-white">{plan.duration_minutes} min</p>
                        </div>
                      </div>

                      {plan.focus && (
                        <div className="mt-4 rounded-[1.5rem] border border-cyan-200/15 bg-cyan-200/[0.07] p-4">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/80">Training focus</p>
                          <p className="mt-2 text-sm leading-6 text-zinc-200">{plan.focus}</p>
                        </div>
                      )}

                      {plan.examples && (
                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                          {Object.entries(plan.examples).map(([category, exercises]) => (
                            <div key={category} className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4">
                              <p className="text-sm font-black text-white">{category}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {exercises.map((exercise) => (
                                  <span key={exercise} className="rounded-full border border-white/10 bg-zinc-950/55 px-3 py-1 text-xs font-bold text-zinc-300">
                                    {exercise}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-6 border-t border-white/10 pt-5">
                        <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-zinc-400">How did it feel?</p>
                        <div className="grid grid-cols-3 gap-2">
                          {["easy", "medium", "hard"].map((level) => (
                            <button
                              key={level}
                              onClick={() => setFeedback(level)}
                              className={cx(
                                "rounded-2xl border px-4 py-3 text-sm font-black capitalize transition",
                                feedback === level ? "border-lime-200 bg-lime-200 text-zinc-950" : "border-white/10 bg-white/[0.055] text-zinc-300 hover:bg-white/10"
                              )}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                        <button onClick={submitFeedback} className="mt-3 w-full rounded-2xl bg-white px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-zinc-950 transition hover:bg-cyan-100">
                          Submit feedback to AI core
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Panel>
          )}

          {activeView === "dashboard" && (
            <Panel className="p-5 sm:p-7">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-100/80">Performance intelligence</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-white">30 day trends</h2>
                </div>
                <button
                  onClick={handleChartRefresh}
                  className={cx(
                    "rounded-2xl px-5 py-3 text-sm font-black transition",
                    daysLogged >= 30 ? "bg-white text-zinc-950 hover:bg-cyan-100" : "border border-white/10 bg-white/[0.06] text-zinc-300 hover:bg-white/10"
                  )}
                >
                  Refresh charts ({daysLogged}/30 days)
                </button>
              </div>

              {(!dash || recent30Metrics.length === 0) ? (
                <EmptyState title="No historical data available yet" action="Log today's metrics" onAction={() => setActiveView("input")} />
              ) : (
                <div className="grid gap-5 xl:grid-cols-2">
                  <div className="rounded-[2rem] border border-white/10 bg-zinc-950/45 p-5">
                    <h3 className="mb-6 text-lg font-black text-white">Readiness score history</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={progressData} margin={{ top: 10, right: 20, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.10)" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#a1a1aa", fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                        <Tooltip
                          formatter={(v) => [`${v}%`, "Score"]}
                          contentStyle={{ backgroundColor: "#09090b", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                        />
                        <Line type="monotone" dataKey="score" stroke="#67e8f9" strokeWidth={4} dot={{ r: 4, fill: "#67e8f9", strokeWidth: 2, stroke: "#09090b" }} activeDot={{ r: 7 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="rounded-[2rem] border border-white/10 bg-zinc-950/45 p-5">
                    <h3 className="mb-6 text-lg font-black text-white">Training and recovery days</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={adherenceData} margin={{ top: 10, right: 20, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.10)" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#a1a1aa", fontSize: 12 }} ticks={[0, 1]} tickFormatter={(v) => (v === 1 ? "Training" : "Recovery")} />
                        <Tooltip
                          cursor={{ fill: "rgba(255,255,255,0.04)" }}
                          formatter={(v) => [v === 1 ? "Training" : "Recovery", "Status"]}
                          contentStyle={{ backgroundColor: "#09090b", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                        />
                        <Bar dataKey="training" fill="#bef264" radius={[10, 10, 0, 0]} barSize={34} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </Panel>
          )}

          {message && <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-center text-sm font-black text-emerald-100">{message}</div>}
        </section>
      </div>
    </main>
  );
}
