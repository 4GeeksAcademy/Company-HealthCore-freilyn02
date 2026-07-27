// Shared header shown on every page. Keeping the HealthCore branding
// and the People & Talent department name here (instead of repeating
// it on each page) is what makes the whole app read as a HealthCore
// internal tool rather than a generic candidate tracker.
export default function Header() {
    return (
      <header className="bg-slate-800 text-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <span className="font-bold text-lg">HealthCore</span>
            <span className="text-slate-300 ml-2">People &amp; Talent</span>
          </div>
          <span className="text-sm text-slate-300">Talent Pipeline Tracker</span>
        </div>
      </header>
    );
  }