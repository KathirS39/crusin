import { useNavigate } from 'react-router-dom'

export default function RoleSelect() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#08101e] flex flex-col items-center justify-center px-4">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-white">How will you use Crusin?</h1>
        <p className="mt-2 text-gray-400">Choose your role to get started.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
        {/* Rider card */}
        <button
          onClick={() => navigate('/onboarding/rider')}
          className="flex-1 group bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/50 rounded-2xl p-8 text-left transition-all duration-200"
        >
          <div className="w-14 h-14 bg-blue-600/20 group-hover:bg-blue-600/30 rounded-2xl flex items-center justify-center mb-5 transition-colors">
            <span className="text-3xl">🙋</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">I'm a Rider</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Request rides, track your trips, and get where you need to go.
          </p>
        </button>

        {/* Driver card */}
        <button
          onClick={() => navigate('/onboarding/driver')}
          className="flex-1 group bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/50 rounded-2xl p-8 text-left transition-all duration-200"
        >
          <div className="w-14 h-14 bg-blue-600/20 group-hover:bg-blue-600/30 rounded-2xl flex items-center justify-center mb-5 transition-colors">
            <span className="text-3xl">🚗</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">I'm a Driver</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Accept rides, earn on your schedule, and help people get around.
          </p>
        </button>
      </div>
    </div>
  )
}
