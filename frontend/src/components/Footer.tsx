export default function Footer() {
  return (
    <footer className="bg-[#08101e] border-t border-white/10 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="text-white font-semibold tracking-tight">Crusin</span>
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Crusin. All rights reserved.
        </p>
        <p className="text-sm text-gray-600">MIS 372T Final Project</p>
      </div>
    </footer>
  )
}
